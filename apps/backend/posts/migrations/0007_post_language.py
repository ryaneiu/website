from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("posts", "0006_post_has_swears_post_is_nsfw"),
    ]

    operations = [
        migrations.AddField(
            model_name="post",
            name="language",
            field=models.CharField(
                choices=[("en", "English"), ("fr", "French")],
                db_index=True,
                default="en",
                max_length=2,
            ),
        ),
    ]
