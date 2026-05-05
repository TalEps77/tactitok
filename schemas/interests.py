from pydantic import BaseModel, ConfigDict
from uuid import UUID
from datetime import datetime

class InterestBase(BaseModel):
    name: str

class InterestCreate(InterestBase):
    pass 

class Interest(InterestBase):
    id: UUID
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)