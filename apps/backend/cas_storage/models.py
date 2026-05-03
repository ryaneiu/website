from django.db import models
from .storage import ContentAdressableStorage

# Create your models here.

cas_storage = ContentAdressableStorage()

class UploadedFile(models.Model):
    
    file = models.FileField(upload_to="cas/", storage=cas_storage)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    