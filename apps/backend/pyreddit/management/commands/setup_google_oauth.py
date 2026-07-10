"""Management command to create the Google OAuth SocialApp from env vars.

Run after deploy so allauth can find the provider credentials.
Idempotent — safe to run repeatedly.
"""

import os
from django.core.management.base import BaseCommand
from django.contrib.sites.models import Site
from allauth.socialaccount.models import SocialApp


class Command(BaseCommand):
    help = "Create the Google SocialApp for allauth from GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET env vars"

    def handle(self, *args, **options):
        client_id = os.environ.get("GOOGLE_CLIENT_ID", "").strip()
        client_secret = os.environ.get("GOOGLE_CLIENT_SECRET", "").strip()

        if not client_id or not client_secret:
            self.stderr.write(
                self.style.ERROR(
                    "GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set in the environment."
                )
            )
            return

        site, _ = Site.objects.get_or_create(
            id=1,
            defaults={"domain": "localhost:8001", "name": "PyRed"},
        )

        app, created = SocialApp.objects.get_or_create(
            provider="google",
            defaults={
                "name": "Google",
                "client_id": client_id,
                "secret": client_secret,
            },
        )

        if not created:
            # Update credentials if they changed
            updated = False
            if app.client_id != client_id:
                app.client_id = client_id
                updated = True
            if app.secret != client_secret:
                app.secret = client_secret
                updated = True
            if updated:
                app.save(update_fields=["client_id", "secret"])
                self.stdout.write(self.style.SUCCESS("Updated Google SocialApp credentials."))
            else:
                self.stdout.write(self.style.SUCCESS("Google SocialApp already exists and is up to date."))
        else:
            self.stdout.write(self.style.SUCCESS("Created Google SocialApp."))

        # Link to site
        app.sites.add(site)

        self.stdout.write(self.style.SUCCESS("Done — Google OAuth is ready."))
