"""
Management command to migrate existing base64 profile images to CAS storage.

For each UserProfile with a base64 data URL image_url:
1. Decode the base64 image
2. Downscale to 256x256 max
3. Store in CAS
4. Replace image_url with the CAS object_id
"""

import base64
import re
from io import BytesIO

from django.core.management.base import BaseCommand
from django.core.files.base import ContentFile
from PIL import Image

from pyreddit.models import UserProfile
from cas_storage.storage import ContentAdressableStorage


IMAGE_DATA_URL_PATTERN = re.compile(
    r"^data:image/(?P<fmt>[a-z0-9.+-]+);base64,(?P<data>[a-z0-9+/=]+)$",
    re.IGNORECASE,
)
PROFILE_IMAGE_MAX_SIZE = 256


class Command(BaseCommand):
    help = "Migrate existing base64 profile images to CAS storage"

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Show what would be done without making changes",
        )

    def handle(self, *args, **options):
        dry_run = options["dry_run"]
        cas = ContentAdressableStorage()

        profiles = UserProfile.objects.exclude(image_url="").exclude(
            image_url__isnull=True
        )

        migrated = 0
        skipped = 0
        errors = 0

        for profile in profiles:
            image_url = profile.image_url.strip()
            match = IMAGE_DATA_URL_PATTERN.match(image_url)

            if not match:
                # Not a base64 image — already a URL or CAS object ID, skip
                skipped += 1
                continue

            try:
                fmt = match.group("fmt")
                data = match.group("data")
                raw_bytes = base64.b64decode(data)

                # Open and process the image
                image_stream = BytesIO(raw_bytes)
                with Image.open(image_stream) as img:
                    if img.mode in ("RGBA", "P"):
                        img = img.convert("RGBA")
                        background = Image.new(
                            "RGBA", img.size, (255, 255, 255, 255)
                        )
                        img = Image.alpha_composite(background, img).convert("RGB")
                    elif img.mode != "RGB":
                        img = img.convert("RGB")

                    w, h = img.size
                    if (
                        w > PROFILE_IMAGE_MAX_SIZE
                        or h > PROFILE_IMAGE_MAX_SIZE
                    ):
                        ratio = min(
                            PROFILE_IMAGE_MAX_SIZE / w,
                            PROFILE_IMAGE_MAX_SIZE / h,
                        )
                        img = img.resize(
                            (int(w * ratio), int(h * ratio)), Image.LANCZOS
                        )

                    output = BytesIO()
                    img.save(output, format="AVIF")
                    output.seek(0)
                    processed_bytes = output.read()

                if dry_run:
                    self.stdout.write(
                        f"[DRY RUN] Would migrate {profile.user.username}'s "
                        f"profile image ({len(raw_bytes)} bytes → "
                        f"{len(processed_bytes)} bytes)"
                    )
                else:
                    cas_file = ContentFile(processed_bytes, name="profile.avif")
                    filename = cas.save_cas("profile.avif", cas_file)
                    object_id = filename.removesuffix(".bin")
                    profile.image_url = object_id
                    profile.save(update_fields=["image_url"])
                    self.stdout.write(
                        f"Migrated {profile.user.username}: "
                        f"{len(raw_bytes)} bytes → {object_id}"
                    )

                migrated += 1
            except Exception as e:
                self.stderr.write(
                    f"ERROR migrating {profile.user.username} (id={profile.id}): {e}"
                )
                errors += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"Done: {migrated} migrated, {skipped} skipped, {errors} errors"
                + (" (DRY RUN)" if dry_run else "")
            )
        )
