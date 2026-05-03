from django.urls import path
from .views import FileUploadView

urlpatterns = [
    # This matches /api/v1/objects/upload
    path('v1/objects/upload', FileUploadView.as_view(), name='cas-upload'),
]