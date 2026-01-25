from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class BetCreate(BaseModel):
    market_id: str
    side: str  # "home", "away", "over", "under"
    stake: float = Field(..., gt=0.001, le=1.0)
    wallet: str  # 0x...

class BetQuote(BaseModel):
    quote_id: str
    market_id: str
    side: str
    odds: float
    price: float  # CRO amount
    max_stake: float
    expires_at: int  # Unix timestamp

class BetPosition(BaseModel):
    position_id: str
    market_id: str
    side: str
    stake: float
    odds: float
    tx_hash: Optional[str] = None
