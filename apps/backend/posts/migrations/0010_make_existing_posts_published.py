from django.db import migrations


def set_all_posts_published(apps, schema_editor):
    Post = apps.get_model("posts", "Post")
    Post.objects.update(published=True)


class Migration(migrations.Migration):

    dependencies = [
        ("posts", "0009_postattachment"),
    ]

    operations = [
        migrations.RunPython(
            set_all_posts_published,
            reverse_code=migrations.RunPython.noop,
        ),
    ]
