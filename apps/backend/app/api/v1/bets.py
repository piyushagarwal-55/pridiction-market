from fastapi import APIRouter, BackgroundTasks, HTTPException
from app.core.x402 import verify_x402_payment
from app.core.contracts import Contracts
from app.services.redis import publish_market_update
from pydantic import BaseModel

router = APIRouter()
contracts = Contracts()

class ConfirmBet(BaseModel):
    quote_id: str

@router.post("/confirm")
async def confirm_bet(confirm: ConfirmBet, background_tasks: BackgroundTasks):
    """Confirm bet after x402 payment"""
    
    # Verify payment
    payment = await verify_x402_payment(confirm.quote_id)
    if not payment["paid"]:
        raise HTTPException(400, "Payment not verified")
    
    # Mint position token
    tx_hash = contracts.mint_position(
        confirm.quote_id, 
        "next-point-123", 
        "home", 
        10000000000000000,  # 0.01 CRO
        1920000000000000000,  # 1.92 odds
        "0xUserWallet"
    )
    
    # Notify frontend
    background_tasks.add_task(
        publish_market_update, 
        confirm.quote_id, 
        {"status": "confirmed", "tx_hash": tx_hash}
    )
    
    return {
        "success": True,
        "position_id": confirm.quote_id,
        "tx_hash": tx_hash
    }
