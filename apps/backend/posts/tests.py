from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.test import APITestCase
from .models import Post


class PostDeleteAuthorizationTests(APITestCase):
    def setUp(self):
        self.author = User.objects.create_user(username="author", password="pass1234")
        self.other_user = User.objects.create_user(username="other", password="pass1234")
        self.post = Post.objects.create(
            author=self.author,
            title="hello",
            content="world",
            content_markdown="world",
        )
        self.url = f"/api/posts/{self.post.id}/"

    def test_author_can_delete_post(self):
        self.client.force_authenticate(user=self.author)

        response = self.client.delete(self.url)

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Post.objects.filter(id=self.post.id).exists())

    def test_non_author_cannot_delete_post(self):
        self.client.force_authenticate(user=self.other_user)

        response = self.client.delete(self.url)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertTrue(Post.objects.filter(id=self.post.id).exists())

    def test_unauthenticated_user_cannot_delete_post(self):
        response = self.client.delete(self.url)

        self.assertIn(
            response.status_code,
            (status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN),
        )
        self.assertTrue(Post.objects.filter(id=self.post.id).exists())
