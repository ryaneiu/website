"""Management command to delete users by username or email.

Also cleans up all linked allauth records (SocialAccount, SocialToken)
to ensure the "already signed in" record is properly removed.
"""

from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from allauth.socialaccount.models import SocialAccount, SocialToken


class Command(BaseCommand):
    help = "Delete one or more users by username or email (cleans allauth links too)"

    def add_arguments(self, parser):
        parser.add_argument(
            "identifiers",
            nargs="+",
            type=str,
            help="Username(s) or email(s) of users to delete",
        )
        parser.add_argument(
            "--yes",
            action="store_true",
            help="Skip confirmation prompt",
        )

    def handle(self, *args, **options):
        identifiers = options["identifiers"]
        skip_confirm = options["yes"]

        users_to_delete = []
        not_found = []

        for ident in identifiers:
            ident = ident.strip()
            user = (
                User.objects.filter(username=ident).first()
                or User.objects.filter(email=ident).first()
            )
            if user:
                users_to_delete.append(user)
            else:
                not_found.append(ident)

        if not_found:
            self.stderr.write(
                self.style.WARNING(f"Not found: {', '.join(not_found)}")
            )

        if not users_to_delete:
            self.stdout.write(self.style.WARNING("No users to delete."))
            return

        self.stdout.write("\nUsers to delete:")
        for user in users_to_delete:
            social = SocialAccount.objects.filter(user=user).first()
            provider = f" (linked to {social.provider})" if social else ""
            self.stdout.write(
                f"  • {user.username} <{user.email}>{provider}"
            )

        if not skip_confirm:
            confirm = input("\nDelete these users? [y/N] ")
            if confirm.lower() not in ("y", "yes"):
                self.stdout.write(self.style.WARNING("Aborted."))
                return

        for user in users_to_delete:
            username = user.username

            # Explicitly delete allauth records first to guarantee cleanup
            social_accounts = SocialAccount.objects.filter(user=user)
            for sa in social_accounts:
                # Delete any stored tokens for this social account
                SocialToken.objects.filter(account=sa).delete()
                sa.delete()

            user.delete()
            self.stdout.write(
                self.style.SUCCESS(f"Deleted: {username} (allauth records cleaned)")
            )

        self.stdout.write(
            self.style.SUCCESS(f"\nDone — {len(users_to_delete)} user(s) deleted.")
        )
