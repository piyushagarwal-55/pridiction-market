from fastapi import APIRouter
from app.models.market import MarketResponse
from typing import List, Optional
from datetime import datetime, timedelta
import random

router = APIRouter()

@router.get("/", response_model=List[MarketResponse])
async def list_markets(sport: Optional[str] = None):
    """List active micro-markets"""
    markets = []
    
    market_ids = [
        f"next-point-{random.randint(1000,9999)}",
        f"next-goal-{random.randint(1000,9999)}",
        f"next-kill-{random.randint(1000,9999)}"
    ]
    
    for market_id in market_ids:
        # Fix: sport or random.choice() → handle None properly
        market_sport = sport if sport else random.choice(["soccer", "lol", "cs2"])
        
        markets.append(MarketResponse(
            id=market_id,
            sport=market_sport,
            description=f"Next {random.choice(['point', 'goal', 'kill'])} Winner",
            odds={
                "home": round(1.85 + random.uniform(-0.1, 0.1), 2),
                "away": round(1.85 + random.uniform(-0.1, 0.1), 2)
            },
            max_stake=1.0,
            expires_at=datetime.utcnow() + timedelta(minutes=random.randint(2, 10))
        ))
    
    return markets
