import jwt
from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response

from rest_framework import status
from .serializers import FileUploadSerializer
import pyred.settings as settings
from cas_storage.permissions import HasValidUploadToken


# Create your views here.

class FileUploadView(APIView):
    
    permission_classes = [IsAuthenticated, HasValidUploadToken]
    parser_classes = [MultiPartParser, FormParser]
    
    def post(self, request, *args, **kwargs):
        
        payload = getattr(request, 'upload_payload', {})
        
        
        serializer = FileUploadSerializer(data=request.data, context={'request': request, 'file_type': payload.get("type")})
        
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)