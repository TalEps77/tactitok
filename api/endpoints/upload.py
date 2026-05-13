import uuid
import os
import shutil
from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException
from sqlalchemy.orm import Session

# ודא שהייבואים האלו תואמים לפרויקט שלך:
from core.database import get_db
from models.tables import Content, ContentType
# שים לב: אם יש לך ייבוא ל-ContentType Enum, כדאי לייבא אותו גם, למשל:
# from models import ContentType 

router = APIRouter()

os.makedirs("uploads", exist_ok=True)

@router.post("/")
async def upload_content(
    file: UploadFile = File(...),
    title: str = Form(...),
    description: str = Form(None),
    # אני מוסיף כאן את סוג התוכן, כדי שה-Enum לא יקרוס
    content_type: str = Form("video"), # תחליף את הדיפולט למה שמוגדר ב-Enum שלך
    category_id: uuid.UUID = Form(...),
    db: Session = Depends(get_db)
):
    try:
        # --- שלב 1: שמירת הקובץ הפיזי ---
        unique_id = str(uuid.uuid4())
        safe_filename = f"{unique_id}_{file.filename}"
        file_path = os.path.join("uploads", safe_filename)
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # משיגים את גודל הקובץ רק אחרי שהוא נשמר בהצלחה!
        file_size_bytes = os.path.getsize(file_path)
            
        # --- שלב 2: שמירת הנתונים במסד הנתונים ---
        new_content = Content(
            title=title,
            description=description or "", # מונע את שגיאת ה-null שראינו!
            type=content_type,             # Enum של סוג התוכן
            filename=file.filename,        # שם הקובץ המקורי
            file_path=file_path,           # המיקום בשרת
            file_size=file_size_bytes,     # גודל מדויק
            mime_type=file.content_type or "application/octet-stream", # סוג המדיה
            category_id=category_id
            # שדות כמו duration או thumbnail_path יכולים להישאר ריקים (nullable=True)
        )
        
        db.add(new_content)
        db.commit()
        db.refresh(new_content)
        
        return {
            "message": "Content uploaded successfully",
            "content_id": new_content.id,
            "title": new_content.title,
            "file_path": new_content.file_path,
            "size_bytes": new_content.file_size
        }
        
    except Exception as e:
        db.rollback() # במקרה של שגיאה ב-DB, מבטלים את הטרנזקציה כדי לא לנעול אותו
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")