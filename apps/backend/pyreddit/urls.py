from django.urls import path
from .views import DummyPosts

urlpatterns = [
    path('api/posts/', DummyPosts.as_view(), name='dummy-posts'),
]