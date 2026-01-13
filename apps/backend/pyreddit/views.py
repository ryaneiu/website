from django.shortcuts import render

# Create your views here
from rest_framework.views import APIView
from rest_framework.response import Response

class DummyPosts(APIView):
    def get(self, request):
        # Dummy data, no model needed
        posts = [
            {"id": 1, "title": "First Post", "content": "Hello world!"},
            {"id": 2, "title": "Second Post", "content": "React + Django is fun!"}
        ]
        return Response(posts)