
# --- ספריות מובנות של פייתון ---
import uuid
import enum
from datetime import datetime
from typing import Optional

# --- ספריות של SQLAlchemy ---
from sqlalchemy import Integer, Text, ForeignKey, DateTime, Enum, BigInteger
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from sqlalchemy.sql import func
from sqlalchemy.orm import Mapped, mapped_column

# --- ייבוא מהפרויקט שלנו ---
from core.database import Base

# --- טבלת הקטגוריות ---
class Category(Base):
    __tablename__ = "categories"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(Text, nullable=False)
    parent_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("categories.id"), nullable=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

class Interest(Base):
    __tablename__ = "interests"

    # מזהה ייחודי אוניברסלי שנוצר אוטומטית
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # שם תחום העניין (חובה)
    name: Mapped[str] = mapped_column(Text, nullable=False)
    
    # תאריך יצירה בלבד
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

# 1. הגדרת רשימה סגורה לסוגי התוכן
class ContentType(enum.Enum):
    video = "video"
    pdf = "pdf"

# 2. טבלת התוכן הראשית
class Content(Base):
    __tablename__ = "content"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title: Mapped[str] = mapped_column(Text, nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    type: Mapped[ContentType] = mapped_column(Enum(ContentType), nullable=False)

    # נתוני קובץ
    filename: Mapped[str] = mapped_column(Text, nullable=False)
    file_path: Mapped[str] = mapped_column(Text, nullable=False)
    file_size: Mapped[int] = mapped_column(BigInteger, nullable=False)
    mime_type: Mapped[str] = mapped_column(Text, nullable=False)

    # נתונים ספציפיים לוידאו (יכולים להיות ריקים)
    duration: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    thumbnail_path: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # קשרים וסנכרון
    category_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("categories.id"), nullable=True)
    interest_ids: Mapped[list[uuid.UUID]] = mapped_column(ARRAY(UUID(as_uuid=True)), default=list)
    
    version: Mapped[int] = mapped_column(Integer, default=1)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())