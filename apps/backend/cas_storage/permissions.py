import jwt
import pyred.settings as settings
from cas_storage.services import ObjectStorageTokenService
from rest_framework.exceptions import PermissionDenied, AuthenticationFailed
from rest_framework.permissions import BasePermission




class HasValidUploadToken(BasePermission):
    def has_permission(self, request, view):
        
        upload_token = request.headers.get("X-Upload-Token")
        if not upload_token:
            raise PermissionDenied("No upload token specified")
        
        payload =  ObjectStorageTokenService.check_token(upload_token, "generic_cas_token")
        if not payload:
            raise AuthenticationFailed("Authentication failed")
        
        is_fresh = ObjectStorageTokenService.claim_one_time_token(payload)
        if not is_fresh:
            raise PermissionDenied("Cannot reuse same token")
        
        request.upload_payload = payload
        return True