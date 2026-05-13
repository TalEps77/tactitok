from fastapi import APIRouter
from api.endpoints import health, upload, categories, interests, content #ייבוא הקבצים


#מנהל הראוטרים
api_router=APIRouter()

api_router.include_router(health.router, prefix="/health", tags=["Health"])
api_router.include_router(upload.router, prefix="/content", tags=["Upload Content"])
api_router.include_router(categories.router, prefix="/categories", tags=["Categories"])
api_router.include_router(interests.router, prefix="/interests", tags=["Interests"])
api_router.include_router(content.router, prefix="/content", tags=["Content"])

