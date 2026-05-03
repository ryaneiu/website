import hashlib
from django.conf import settings
from django.core.files.storage import FileSystemStorage
from django.core.files.base import File

class ContentAdressableStorage(FileSystemStorage):
    
    def __init__(self, *args, **kwargs):
        kwargs['location'] = settings.MEDIA_ROOT
        kwargs['base_url'] = settings.MEDIA_URL
        super().__init__(*args, **kwargs)
    
    def get_available_name(self, name: str, max_length: int | None = None) -> str:
        return name
    
    def _save(self, name: str, content: "File"):
        sha256 = hashlib.sha256()
        
        for chunk in content.chunks():
            sha256.update(chunk)
        file_hash = sha256.hexdigest()
        filename = f"{file_hash}.bin"

        if self.exists(filename):
            return filename
        return super()._save(filename, content) # ignore
        