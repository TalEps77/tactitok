import os
import uuid
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.responses import StreamingResponse, FileResponse
from sqlalchemy.orm import Session
from typing import List

# ייבוא הכלים מהפרויקט שלך - ודא שהנתיבים נכונים
from core.database import get_db
from models.tables import Content

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


#עדכון התוכן
@router.patch("/{content_id}")
async def update_content_metadata(
    content_id: uuid.UUID, 
    title: str = None, 
    description: str = None, 
    category_id: uuid.UUID = None,
    db: Session = Depends(get_db)
):
    """
    עדכון פרטי תוכן (Metadata) לפי ID.
    ניתן לעדכן כותרת, תיאור או קטגוריה.
    """
    content = db.query(Content).filter(Content.id == content_id).first()
    if not content:
        raise HTTPException(status_code=404, detail="התוכן לעדכון לא נמצא")

    # עדכון השדות שנשלחו בלבד
    if title:
        content.title = title
    if description is not None: # מאפשר לשלוח מחרוזת ריקה
        content.description = description
    if category_id:
        content.category_id = category_id

    try:
        db.commit()
        db.refresh(content)
        return content
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"שגיאה בעדכון הנתונים: {str(e)}")
    
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