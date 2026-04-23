from fastapi import APIRouter


from api.endpoints import health #מייבאים את קובץ ה health

from api.endpoints import upload #ייבוא של הקובץ upload


#מנהל הראוטרים
api_router=APIRouter()

api_router.include_router(health.router, prefix="/health", tags=["Health"])
api_router.include_router(upload.router, prefix="/content", tags=["Content Management"])

