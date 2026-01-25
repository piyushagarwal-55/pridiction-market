from pydantic import BaseModel, Field
from typing import Dict, Optional
from datetime import datetime

class MarketBase(BaseModel):
    id: str
    sport: str
    description: str
    odds: Dict[str, float]
    max_stake: float = Field(default=1.0, gt=0)
    expires_at: datetime

class MarketCreate(MarketBase):
    pass

class MarketResponse(MarketBase):
    address: Optional[str] = None
    total_stake: float = 0.0
    is_settled: bool = False
    
    class Config:
        from_attributes = True
