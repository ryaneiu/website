from django.db import migrations, models
from django.utils.text import slugify


def populate_subforum_slugs_and_general(apps, schema_editor):
    Subforum = apps.get_model("posts", "Subforum")
    Post = apps.get_model("posts", "Post")

    used_slugs = set(Subforum.objects.values_list("slug", flat=True))

    for subforum in Subforum.objects.all().order_by("id"):
        if subforum.slug:
            used_slugs.add(subforum.slug)
            continue

        base_slug = slugify(subforum.name) or "general"
        slug = base_slug
        idx = 2
        while slug in used_slugs:
            slug = f"{base_slug}-{idx}"
            idx += 1

        subforum.slug = slug
        subforum.save(update_fields=["slug"])
        used_slugs.add(slug)

    general = Subforum.objects.filter(slug="general").first()
    if general is None:
        general = Subforum.objects.create(
            name="General",
            slug="general",
            description="Default subforum",
        )

    Post.objects.filter(subforum__isnull=True).update(subforum=general)


def reverse_noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("posts", "0003_reply_parent_reply"),
    ]

    operations = [
        migrations.AddField(
            model_name="subforum",
            name="slug",
            field=models.SlugField(blank=True, max_length=120, unique=True),
        ),
        migrations.RunPython(populate_subforum_slugs_and_general, reverse_noop),
    ]
