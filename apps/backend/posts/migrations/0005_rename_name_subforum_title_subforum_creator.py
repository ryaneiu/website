from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("posts", "0004_subforum_slug_and_general_default"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.RenameField(
            model_name="subforum",
            old_name="name",
            new_name="title",
        ),
        migrations.AddField(
            model_name="subforum",
            name="creator",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="created_subforums",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
    ]
