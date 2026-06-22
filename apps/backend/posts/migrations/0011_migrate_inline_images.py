"""
Data migration: migrate inline base64 images and CAS URLs
into the object storage and attachment systems.

Finds base64 data URLs (data:image/...;base64,...) and CAS storage URLs
(/objects/<hash>.bin) in Post.content_markdown and Reply.content_markdown,
decodes base64 images, stores them in Content-Addressable Storage,
creates PostAttachment records for Posts, and cleans up the markdown.
"""
import re
import base64
import io

from PIL import Image
import pillow_avif  # noqa: F401 - ensure AVIF support is loaded

from django.db import migrations
from django.core.files.base import ContentFile

from cas_storage.storage import ContentAdressableStorage


# Regex to find markdown image syntax with base64 data URL
# Example: ![alt text](data:image/png;base64,iVBORw0KGgo...)
MD_B64_PATTERN = re.compile(
    r'!\[([^\]]*)\]\((data:image/[a-z0-9.+-]+;base64,[A-Za-z0-9+/=\s]+?)\)',
    re.IGNORECASE,
)

# Regex to find raw base64 data URLs (not inside markdown image syntax)
RAW_B64_PATTERN = re.compile(
    r'(data:image/[a-z0-9.+-]+;base64,[A-Za-z0-9+/=]+(?:\s|$))',
    re.IGNORECASE,
)

# Regex to find markdown image syntax referencing CAS storage
# Example: ![alt text](/objects/abcdef...bin)
MD_CAS_PATTERN = re.compile(
    r'!\[([^\]]*)\]\(((?:https?://[^/\s]+)?/objects/([a-f0-9]{64})\.bin)\)',
    re.IGNORECASE,
)

# Regex to find raw CAS URLs (not inside markdown image syntax)
# No boundary anchors to avoid consuming surrounding whitespace on replacement.
RAW_CAS_PATTERN = re.compile(
    r'((?:https?://[^/\s]+)?/objects/([a-f0-9]{64})\.bin)',
    re.IGNORECASE,
)


def decode_and_store_base64(b64_data_url, cas_storage):
    """
    Decode a base64 data URL, store the image in CAS, and return
    (sha256_hash, width, height). Returns (None, None, None) on error.
    """
    try:
        header, encoded = b64_data_url.split(',', 1)
        encoded = re.sub(r'\s+', '', encoded)
        data = base64.b64decode(encoded)

        width = None
        height = None
        try:
            with Image.open(io.BytesIO(data)) as img:
                width = img.width
                height = img.height
        except Exception:
            pass

        cf = ContentFile(data, name="migrated.bin")
        saved_name = cas_storage.save_cas("migrated.bin", cf)
        hash_val = saved_name.removesuffix('.bin')

        return hash_val, width, height
    except Exception:
        return None, None, None


def migrate_inline_images(apps, schema_editor):
    Post = apps.get_model("posts", "Post")
    Reply = apps.get_model("posts", "Reply")
    PostAttachment = apps.get_model("posts", "PostAttachment")

    cas_storage = ContentAdressableStorage()

    print("\n--- Migrating Post images ---")
    post_stats = {'scanned': 0, 'modified': 0, 'base64': 0, 'cas': 0, 'errors': 0}

    for post in Post.objects.all().order_by('id'):
        original = post.content_markdown
        if not original:
            continue

        post_stats['scanned'] += 1
        modified = False
        base64_count = 0
        cas_count = 0
        pending_attachments = []  # (hash, width, height)

        def md_b64_replacer(match):
            nonlocal modified, base64_count
            b64_url = match.group(2)
            hash_val, width, height = decode_and_store_base64(b64_url.strip(), cas_storage)
            if hash_val:
                base64_count += 1
                modified = True
                pending_attachments.append((hash_val, width, height))
            else:
                post_stats['errors'] += 1
            return ''

        def md_cas_replacer(match):
            nonlocal modified, cas_count
            hash_val = match.group(3)
            cas_count += 1
            modified = True
            pending_attachments.append((hash_val, None, None))
            return ''

        def raw_b64_replacer(match):
            nonlocal modified, base64_count
            b64_url = match.group(1)
            hash_val, width, height = decode_and_store_base64(b64_url.strip(), cas_storage)
            if hash_val:
                base64_count += 1
                modified = True
                pending_attachments.append((hash_val, width, height))
            else:
                post_stats['errors'] += 1
            return ''

        def raw_cas_replacer(match):
            nonlocal modified, cas_count
            hash_val = match.group(2)
            cas_count += 1
            modified = True
            pending_attachments.append((hash_val, None, None))
            return ''

        new_content = MD_B64_PATTERN.sub(md_b64_replacer, original)
        new_content = MD_CAS_PATTERN.sub(md_cas_replacer, new_content)
        new_content = RAW_B64_PATTERN.sub(raw_b64_replacer, new_content)
        new_content = RAW_CAS_PATTERN.sub(raw_cas_replacer, new_content)

        if modified:
            cleaned = new_content.strip()
            # save(update_fields=[...]) skips full_clean(), so empty is fine

            # Create attachments
            for hash_val, width, height in pending_attachments:
                defaults = {'type': 'image'}
                if width is not None:
                    defaults['width'] = width
                if height is not None:
                    defaults['height'] = height
                PostAttachment.objects.get_or_create(
                    post=post,
                    object_id=hash_val,
                    defaults=defaults,
                )

            post_stats['modified'] += 1
            post_stats['base64'] += base64_count
            post_stats['cas'] += cas_count

            cleaned = re.sub(r'\n{3,}', '\n\n', cleaned)
            post.content_markdown = cleaned
            post.content = cleaned
            post.save(update_fields=['content', 'content_markdown'])

            print(f"  Post #{post.id}: {base64_count} base64, {cas_count} CAS migrated")

    print(f"Posts: {post_stats['scanned']} scanned, {post_stats['modified']} modified, "
          f"{post_stats['base64']} base64, {post_stats['cas']} CAS, "
          f"{post_stats['errors']} errors")

    print("\n--- Migrating Reply images ---")
    reply_stats = {'scanned': 0, 'modified': 0, 'base64': 0, 'errors': 0}

    for reply in Reply.objects.all().order_by('id'):
        original = reply.content_markdown
        if not original:
            continue

        reply_stats['scanned'] += 1
        modified = False
        base64_count = 0

        def reply_md_b64_replacer(match):
            nonlocal modified, base64_count
            alt_text = match.group(1)
            b64_url = match.group(2)
            hash_val, _, _ = decode_and_store_base64(b64_url.strip(), cas_storage)
            if hash_val:
                base64_count += 1
                modified = True
                return f'![{alt_text}](/objects/{hash_val}.bin)'
            else:
                reply_stats['errors'] += 1
                return match.group(0)

        def reply_raw_b64_replacer(match):
            nonlocal modified, base64_count
            b64_url = match.group(1)
            hash_val, _, _ = decode_and_store_base64(b64_url.strip(), cas_storage)
            if hash_val:
                base64_count += 1
                modified = True
                return f'![image](/objects/{hash_val}.bin)'
            else:
                reply_stats['errors'] += 1
                return match.group(0)

        new_content = MD_B64_PATTERN.sub(reply_md_b64_replacer, original)
        new_content = RAW_B64_PATTERN.sub(reply_raw_b64_replacer, new_content)

        if modified:
            reply_stats['modified'] += 1
            reply_stats['base64'] += base64_count

            reply.content_markdown = new_content.strip()
            reply.content = reply.content_markdown
            reply.save(update_fields=['content', 'content_markdown'])

            print(f"  Reply #{reply.id}: {base64_count} base64 migrated")

    print(f"Replies: {reply_stats['scanned']} scanned, {reply_stats['modified']} modified, "
          f"{reply_stats['base64']} base64, {reply_stats['errors']} errors")


class Migration(migrations.Migration):

    dependencies = [
        ("posts", "0010_make_existing_posts_published"),
    ]

    operations = [
        migrations.RunPython(
            migrate_inline_images,
            reverse_code=migrations.RunPython.noop,
        ),
    ]
