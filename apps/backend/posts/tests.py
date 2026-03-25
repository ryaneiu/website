from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.test import APITestCase
from .models import Post, Subforum


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


class SubforumFlowTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="poster", password="pass1234")
        self.other_user = User.objects.create_user(username="other2", password="pass1234")
        self.staff_user = User.objects.create_user(
            username="staff", password="pass1234", is_staff=True
        )

    def test_create_post_without_subforum_defaults_to_general(self):
        self.client.force_authenticate(user=self.user)

        response = self.client.post(
            "/api/posts/create/",
            {
                "title": "t",
                "content": "c",
                "content_markdown": "c",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data.get("subforum"), "general")
        self.assertTrue(Subforum.objects.filter(slug="general").exists())

    def test_author_can_move_post_to_subforum_by_slug(self):
        target = Subforum.objects.create(title="Django")
        post = Post.objects.create(
            author=self.user,
            title="hello",
            content="world",
            content_markdown="world",
        )

        self.client.force_authenticate(user=self.user)
        response = self.client.patch(
            f"/api/posts/{post.id}/subforum/",
            {"subforum": target.slug},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        post.refresh_from_db()
        self.assertEqual(post.subforum.slug, target.slug)

    def test_non_author_cannot_move_post_to_subforum(self):
        target = Subforum.objects.create(title="Python")
        post = Post.objects.create(
            author=self.user,
            title="hello",
            content="world",
            content_markdown="world",
        )

        self.client.force_authenticate(user=self.other_user)
        response = self.client.patch(
            f"/api/posts/{post.id}/subforum/",
            {"subforum": target.slug},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_create_subforum_requires_auth(self):
        response = self.client.post(
            "/api/posts/subforums/",
            {"title": "New Forum", "description": "desc"},
            format="json",
        )
        self.assertIn(response.status_code, (status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN))

    def test_create_subforum_with_invalid_title_returns_400(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.post(
            "/api/posts/subforums/",
            {"title": "", "description": "desc"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_subforum_creator_can_update_and_delete(self):
        self.client.force_authenticate(user=self.user)
        create_response = self.client.post(
            "/api/posts/subforums/",
            {"title": "Forum One", "description": "desc"},
            format="json",
        )
        self.assertEqual(create_response.status_code, status.HTTP_201_CREATED)
        slug = create_response.data["slug"]

        update_response = self.client.put(
            f"/api/posts/subforums/{slug}/",
            {"title": "Forum One Updated", "description": "updated"},
            format="json",
        )
        self.assertEqual(update_response.status_code, status.HTTP_200_OK)
        self.assertEqual(update_response.data["title"], "Forum One Updated")

        delete_response = self.client.delete(f"/api/posts/subforums/{slug}/")
        self.assertEqual(delete_response.status_code, status.HTTP_200_OK)

    def test_non_creator_cannot_update_or_delete_subforum(self):
        subforum = Subforum.objects.create(title="Guarded", creator=self.user)

        self.client.force_authenticate(user=self.other_user)
        update_response = self.client.put(
            f"/api/posts/subforums/{subforum.slug}/",
            {"title": "Nope", "description": "x"},
            format="json",
        )
        self.assertEqual(update_response.status_code, status.HTTP_403_FORBIDDEN)

        delete_response = self.client.delete(f"/api/posts/subforums/{subforum.slug}/")
        self.assertEqual(delete_response.status_code, status.HTTP_403_FORBIDDEN)

    def test_staff_can_delete_subforum(self):
        subforum = Subforum.objects.create(title="Moderated", creator=self.user)

        self.client.force_authenticate(user=self.staff_user)
        delete_response = self.client.delete(f"/api/posts/subforums/{subforum.slug}/")
        self.assertEqual(delete_response.status_code, status.HTTP_200_OK)

    def test_add_post_to_subforum_endpoint(self):
        subforum = Subforum.objects.create(title="Topic", creator=self.user)
        self.client.force_authenticate(user=self.user)

        response = self.client.post(
            f"/api/posts/subforums/{subforum.slug}/posts/",
            {"title": "A title", "content": "A body", "content_markdown": "A body"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data.get("subforum"), subforum.slug)
