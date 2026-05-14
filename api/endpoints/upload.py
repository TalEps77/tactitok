from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.orm import Session
from typing import List
import os
import uuid
import shutil
from datetime import datetime

# יבוא של המודלים והדאטה-בייס (תוודא שהנתיבים תואמים למבנה שלך)
from core.database import get_db
from models.tables import Content 

router = APIRouter()

# הגדרת תיקיית ההעלאות
UPLOAD_DIR = "uploads"
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

@router.post("/", status_code=201)
async def create_content(
    title: str = Form(...),
    description: str = Form(None),
    category_id: str = Form(...),
    interest_ids: List[str] = Form([]), # FastAPI יודע לקבל רשימה מה-Form
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    # 1. עיבוד פרטי הקובץ (Backend Logic)
    file_extension = os.path.splitext(file.filename)[1]
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)
    
    # שמירת הקובץ פיזית בשרת
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Could not save file: {str(e)}")

    # 2. חישוב מטא-דאטה באופן אוטומטי
    file_size = os.path.getsize(file_path)
    mime_type = file.content_type
    
    # קביעת סוג התוכן לוגית
    content_type = "video" if "video" in mime_type else "pdf"
    
    # הערה: duration ו-thumbnail_path נשאיר כרגע כ-None 
    # אפשר להוסיף ספריות כמו moviepy בהמשך לחישוב אוטומטי
    duration = None 
    thumbnail_path = None

    # 3. יצירת האובייקט למסד הנתונים (לפי ה-ERD)
    new_content = Content(
        id=str(uuid.uuid4()), # או לתת ל-DB לייצר UUID
        title=title,
        description=description,
        type=content_type,
        filename=file.filename, # השם המקורי שהמשתמש העלה
        file_path=file_path,
        file_size=file_size,
        mime_type=mime_type,
        duration=duration,
        thumbnail_path=thumbnail_path,
        category_id=category_id,
        interest_ids=interest_ids,
        version=1, # גרסה ראשונית
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )

    # 4. שמירה ב-DB
    db.add(new_content)
    db.commit()
    db.refresh(new_content)

    return {
        "status": "success",
        "message": "Content uploaded and cataloged successfully",
        "content_id": new_content.id
    }