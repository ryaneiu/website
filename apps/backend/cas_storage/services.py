import uuid
from datetime import timedelta
import pyred.settings as settings
import jwt
from rest_framework_simplejwt.tokens import Token
from rest_framework.exceptions import ValidationError, PermissionDenied, AuthenticationFailed
from django.core.cache import cache


from typing import TYPE_CHECKING, TypedDict, Literal, get_args

if TYPE_CHECKING:
    from posts.models import Post

ValidTypes = Literal["image", "video" , "gif"]

class AttachmentRequest(TypedDict):
    type: ValidTypes

class GenericObjectUploadToken(Token):
    token_type = "generic_cas_upload"
    lifetime = timedelta(minutes=60)

class PostAttachmentUploadToken(Token):
    token_type = "post_attachment_upload"
    lifetime = timedelta(minutes=60)

class ObjectStorageTokenService:
    @staticmethod
    def validate_attachment_request(attachment: AttachmentRequest):
        if attachment.get("type") is None:
            raise ValidationError("No attachment type")
        
        if not attachment["type"] in get_args(ValidTypes):
            raise ValidationError("Invalid attachment type")
    
    @staticmethod
    def generate_upload_token(attachment_type: AttachmentRequest):
        
        ObjectStorageTokenService.validate_attachment_request(attachment_type)
        
        jti = str(uuid.uuid4())
        token = GenericObjectUploadToken()
        token["type"] = attachment_type
        token["jti"] = jti
        
        cache.set(f"jwt_jti:{jti}", True, timeout=3600)
        
        return str(token)
    
    @staticmethod
    def generate_post_upload_token(attachment_type: AttachmentRequest, post_id: int):
        ObjectStorageTokenService.validate_attachment_request(attachment_type)
        
        jti = str(uuid.uuid4())
        token = PostAttachmentUploadToken()
        token["type"] = attachment_type["type"]
        token["jti"] = jti
        token["post_id"] = post_id
        
        cache.set(f"jwt_jti:{jti}", True, timeout=3600)
        
        return str(token)
    
    @staticmethod
    def claim_one_time_token(payload):
        
        jti: str | None = payload.get("jti")
        if not jti:
            return False
        
        is_fresh = cache.delete(f"jwt_jti:{jti}")
        return is_fresh
    
    @staticmethod
    def check_token(upload_token: str, ensure_type: str):
        try:
            payload = jwt.decode(upload_token, settings.SECRET_KEY, algorithms=["HS256"])
        except jwt.ExpiredSignatureError:
            print("Invalid signature")
            return None
        except jwt.InvalidTokenError:
            print("Invalid token")
            return None
        
        if payload.get("token_type") != ensure_type:
            print(f"Wrong type: {payload.get("token_type")} {ensure_type}")
            return None
        
        return payload