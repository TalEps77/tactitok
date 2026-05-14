import os
import uuid
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.responses import StreamingResponse, FileResponse
from sqlalchemy.orm import Session
from typing import List

# ייבוא הכלים מהפרויקט שלך - ודא שהנתיבים נכונים
from core.database import get_db
from models.tables import Content, Interest

router = APIRouter()

#שליפת הקטלוג המלא
@router.get("/")
async def get_catalog(db: Session = Depends(get_db)):
    """
    שליפת קטלוג התוכן המלא.
    הראוט מחזיר את כל פריטי התוכן (וידאו ו-PDF) הקיימים במערכת.
    """
    try:
        # שליפת כל השורות מטבלת ה-Content
        contents = db.query(Content).all()
        return contents
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"שגיאה בשליפת הקטלוג: {str(e)}")

@router.get("/{content_id}")
async def get_content_by_id(content_id: str, db: Session = Depends(get_db)):
    """
    שליפת פריט תוכן ספציפי לפי ה-ID שלו.
    """
    content = db.query(Content).filter(Content.id == content_id).first()
    if not content:
        raise HTTPException(status_code=404, detail="התוכן המבוקש לא נמצא")
    return content

#מחיקה
@router.delete("/{content_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_content(content_id: uuid.UUID, db: Session = Depends(get_db)):
    """
    מחיקת פריט תוכן: מוחק את הרשומה מה-DB ואת הקובץ הפיזי מהשרת.
    """
    # 1. חיפוש התוכן ב-DB
    content = db.query(Content).filter(Content.id == content_id).first()
    if not content:
        raise HTTPException(status_code=404, detail="התוכן למחיקה לא נמצא")

    # 2. שמירת הנתיב לקובץ לפני המחיקה מה-DB
    file_to_delete = content.file_path

    try:
        # 3. מחיקה מהדאטה-בייס
        db.delete(content)
        db.commit()

        # 4. מחיקת הקובץ הפיזי מהדיסק
        if os.path.exists(file_to_delete):
            os.remove(file_to_delete)
            print(f"File deleted: {file_to_delete}")
        else:
            print(f"Warning: File {file_to_delete} not found on disk, but record was deleted from DB.")

        return None # בגלל סטטוס 204 לא מחזירים תוכן

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"שגיאה בזמן המחיקה: {str(e)}")



from pydantic import BaseModel
from typing import Optional, List
from uuid import UUID
from fastapi import Depends, HTTPException
from sqlalchemy.orm import Session


class ContentUpdateRequest(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category_id: Optional[UUID] = None
    interest_ids: Optional[List[UUID]] = None


@router.patch("/{content_id}")
async def update_content_metadata(
    content_id: UUID,
    update_data: ContentUpdateRequest,
    db: Session = Depends(get_db)
):
    """
    עדכון פרטי תוכן לפי ID.
    מקבל JSON body מה-Frontend.
    ניתן לעדכן כותרת, תיאור, קטגוריה ותחומי עניין.
    """

    content = db.query(Content).filter(Content.id == content_id).first()

    if not content:
        raise HTTPException(status_code=404, detail="התוכן לעדכון לא נמצא")

    # עדכון כותרת
    if update_data.title is not None:
        content.title = update_data.title

    # עדכון תיאור
    if update_data.description is not None:
        content.description = update_data.description

    # עדכון קטגוריה
    if update_data.category_id is not None:
        content.category_id = update_data.category_id

    # עדכון תחומי עניין
    if update_data.interest_ids is not None:

        # בדיקה שכל תחומי העניין שנשלחו באמת קיימים בטבלת Interest
        if len(update_data.interest_ids) > 0:
            existing_count = db.query(Interest).filter(
                Interest.id.in_(update_data.interest_ids)
            ).count()

            if existing_count != len(update_data.interest_ids):
                raise HTTPException(
                    status_code=400,
                    detail="אחד או יותר מתחומי העניין לא קיימים במסד הנתונים"
                )

        # כאן העדכון הנכון לפי המודל שלכם:
        # במודל Content יש עמודה בשם interest_ids
        content.interest_ids = update_data.interest_ids

    try:
        db.commit()
        db.refresh(content)
        return content

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"שגיאה בעדכון הנתונים: {str(e)}"
        )   

#בקשת הסרטון בחלקים/ 206
@router.get("/{content_id}/file")
async def stream_content_file(content_id: str, request: Request, db: Session = Depends(get_db)):
    """
    הזרמת קובץ וידאו בחתיכות (HTTP 206) או הורדה מלאה של קובץ (HTTP 200).
    """
    # 1. שולפים את פרטי התוכן מהדאטה-בייס
    content = db.query(Content).filter(Content.id == content_id).first()
    if not content or not os.path.exists(content.file_path):
        raise HTTPException(status_code=404, detail="הקובץ לא נמצא במערכת")

    file_path = content.file_path
    file_size = os.path.getsize(file_path) # בודקים כמה שוקל הקובץ הפיזי
    
    # 2. בודקים אם הלקוח ביקש רק "חתיכה" מהקובץ (Range)
    range_header = request.headers.get("range")

    # אם אין כותרת Range (למשל, הורדת קובץ PDF מלא), מחזירים את כל הקובץ כרגיל
    if not range_header:
        return FileResponse(file_path, filename=content.filename)

    # 3. אם יש Range - מפענחים מאיזה בייט עד איזה בייט הלקוח מבקש
    try:
        # חותכים את המילה "bytes=" ונשארים עם המספרים
        byte_range = range_header.replace("bytes=", "").split("-")
        start = int(byte_range[0])
        
        # לפעמים הדפדפן לא שולח את סוף הטווח, אז ברירת המחדל היא עד סוף הקובץ
        end = int(byte_range[1]) if byte_range[1] else file_size - 1
    except ValueError:
        raise HTTPException(status_code=400, detail="Range header לא תקין")

    # מחשבים את גודל החתיכה שאנחנו הולכים לשלוח עכשיו
    chunk_size = end - start + 1

    # 4. פונקציית עזר שקוראת את הקובץ מהדיסק *רק* בטווח שחישבנו (Generator)
    def file_iterator(path, start_byte, chunk_bytes):
        with open(path, "rb") as file:
            file.seek(start_byte) # קופצים בדיוק לנקודת ההתחלה
            bytes_read = 0
            
            # קוראים במנות קטנות (64KB) כדי לא לפוצץ את זיכרון ה-RAM של השרת
            while bytes_read < chunk_bytes:
                read_size = min(65536, chunk_bytes - bytes_read)
                data = file.read(read_size)
                if not data:
                    break
                bytes_read += len(data)
                yield data # שולחים את המידע החוצה כזרם (Stream)

    # 5. מגדירים את הכותרות המיוחדות לסטטוס 206
    headers = {
        "Content-Range": f"bytes {start}-{end}/{file_size}", # "אני נותן לך X מתוך Y"
        "Accept-Ranges": "bytes", # "אני תומך בחיתוך לפי בייטים"
        "Content-Length": str(chunk_size), # גודל החתיכה הנוכחית
        "Content-Type": content.mime_type or "application/octet-stream", # סוג הקובץ (וידאו/PDF)
    }

    # מחזירים את התשובה כ-Stream עם הסטטוס המיוחד 206
    return StreamingResponse(
        file_iterator(file_path, start, chunk_size), 
        status_code=206, 
        headers=headers
    )