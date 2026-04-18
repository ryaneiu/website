"""
Docstring for apps.backend.posts.apps
"""

from django.apps import AppConfig


class PostsConfig(AppConfig):
    """
    Docstring for PostsConfig
    """
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'posts'

    def ready(self):
        from .deploy_reset import maybe_reset_api_on_deploy

        maybe_reset_api_on_deploy()
