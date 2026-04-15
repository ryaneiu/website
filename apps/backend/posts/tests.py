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


class PostContentFilteringTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="filteruser", password="pass1234")
        self.subforum = Subforum.objects.create(title="Filtered Forum", creator=self.user)

        self.clean_post = Post.objects.create(
            author=self.user,
            title="Gardening tips",
            content="Try watering in the morning.",
            content_markdown="Try watering in the morning.",
            subforum=self.subforum,
        )

        self.nsfw_post = Post.objects.create(
            author=self.user,
            title="NSFW warning",
            content="Contains explicit nude content ![Sensitive](https://example.com/nsfw.jpg)",
            content_markdown="Contains explicit nude content ![Sensitive](https://example.com/nsfw.jpg)",
            subforum=self.subforum,
        )

        self.swear_post = Post.objects.create(
            author=self.user,
            title="Angry rant",
            content="This is fucking bad",
            content_markdown="This is fucking bad",
            subforum=self.subforum,
        )

    def test_post_flags_are_set_during_create(self):
        self.clean_post.refresh_from_db()
        self.nsfw_post.refresh_from_db()
        self.swear_post.refresh_from_db()

        self.assertFalse(self.clean_post.is_nsfw)
        self.assertFalse(self.clean_post.has_swears)
        self.assertTrue(self.nsfw_post.is_nsfw)
        self.assertFalse(self.nsfw_post.has_swears)
        self.assertFalse(self.swear_post.is_nsfw)
        self.assertTrue(self.swear_post.has_swears)

    def test_post_list_defaults_to_censored_text_and_blurred_images(self):
        response = self.client.get("/api/posts/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        posts_by_id = {item["id"]: item for item in response.data}
        self.assertSetEqual(
            set(posts_by_id.keys()),
            {self.clean_post.id, self.nsfw_post.id, self.swear_post.id},
        )

        swear_payload = posts_by_id[self.swear_post.id]
        self.assertIn("****", swear_payload["content"])
        self.assertIn("****", swear_payload["content_markdown"])
        self.assertIn("****", swear_payload["body"])
        self.assertNotIn("fucking", swear_payload["body"].lower())

        nsfw_payload = posts_by_id[self.nsfw_post.id]
        self.assertEqual(nsfw_payload["image"]["url"], "https://example.com/nsfw.jpg")
        self.assertTrue(nsfw_payload["image"]["isBlurred"])

    def test_post_list_can_include_nsfw_and_swears(self):
        response = self.client.get("/api/posts/?include_nsfw=true&include_swears=true")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        posts_by_id = {item["id"]: item for item in response.data}
        self.assertSetEqual(
            set(posts_by_id.keys()),
            {self.clean_post.id, self.nsfw_post.id, self.swear_post.id},
        )

        swear_payload = posts_by_id[self.swear_post.id]
        self.assertIn("fucking", swear_payload["content"].lower())
        self.assertIn("fucking", swear_payload["body"].lower())

        nsfw_payload = posts_by_id[self.nsfw_post.id]
        self.assertEqual(nsfw_payload["image"]["url"], "https://example.com/nsfw.jpg")
        self.assertFalse(nsfw_payload["image"]["isBlurred"])

    def test_post_list_can_include_nsfw_but_keep_swear_censorship(self):
        response = self.client.get("/api/posts/?include_nsfw=true&include_swears=false")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        posts_by_id = {item["id"]: item for item in response.data}
        self.assertSetEqual(
            set(posts_by_id.keys()),
            {self.clean_post.id, self.nsfw_post.id, self.swear_post.id},
        )

        nsfw_payload = posts_by_id[self.nsfw_post.id]
        self.assertFalse(nsfw_payload["image"]["isBlurred"])

        swear_payload = posts_by_id[self.swear_post.id]
        self.assertIn("****", swear_payload["body"])
        self.assertNotIn("fucking", swear_payload["body"].lower())

    def test_post_list_can_filter_by_search_query(self):
        response = self.client.get("/api/posts/?q=watering")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        returned_ids = {item["id"] for item in response.data}
        self.assertSetEqual(returned_ids, {self.clean_post.id})

    def test_template_posts_endpoint_can_filter_by_search_query(self):
        response = self.client.get("/api/posts/rendered/?q=watering")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertContains(response, "Gardening tips")
        self.assertNotContains(response, "NSFW warning")

    def test_invalid_boolean_query_value_is_rejected(self):
        response = self.client.get("/api/posts/?include_nsfw=yes")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_unknown_query_param_is_rejected(self):
        response = self.client.get("/api/posts/?include_nsfw=true&debug=true")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_duplicate_query_param_is_rejected(self):
        response = self.client.get("/api/posts/?include_nsfw=true&include_nsfw=false")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_duplicate_search_query_param_is_rejected(self):
        response = self.client.get("/api/posts/?q=one&q=two")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_subforum_posts_are_processed_by_default(self):
        response = self.client.get(f"/api/posts/subforums/{self.subforum.slug}/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        nested_by_id = {item["id"]: item for item in response.data["posts"]}
        self.assertSetEqual(
            set(nested_by_id.keys()),
            {self.clean_post.id, self.nsfw_post.id, self.swear_post.id},
        )
        self.assertIn("****", nested_by_id[self.swear_post.id]["body"])
        self.assertTrue(nested_by_id[self.nsfw_post.id]["image"]["isBlurred"])

    def test_subforum_posts_can_disable_blur_and_censorship(self):
        response = self.client.get(
            f"/api/posts/subforums/{self.subforum.slug}/?include_nsfw=true&include_swears=true"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        nested_by_id = {item["id"]: item for item in response.data["posts"]}
        self.assertFalse(nested_by_id[self.nsfw_post.id]["image"]["isBlurred"])
        self.assertIn("fucking", nested_by_id[self.swear_post.id]["body"].lower())

    def test_template_posts_endpoint_shows_toggle_messages_for_hidden_posts(self):
        response = self.client.get("/api/posts/rendered/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertContains(response, "Activate NSFW toggle to show NSFW posts.")
        self.assertContains(response, "Activate swears toggle to show posts with swears.")
