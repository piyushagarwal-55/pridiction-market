from fastapi import APIRouter, HTTPException, Response
from pydantic import BaseModel
from app.models.bet import BetQuote
from app.services.market_manager import MarketManager
from app.services.redis import increment_rate_limit, set_rate_limit
from app.core.x402 import verify_x402_payment
import uuid
from datetime import datetime, timedelta
import os
from app.core.contracts import MARKET_MANAGER_ADDRESS

router = APIRouter()
market_mgr = MarketManager()

class BetRequest(BaseModel):
    market_id: str
    side: str
    stake: float

class ConfirmRequest(BaseModel):
    quote_id: str

@router.post("/place-bet")
async def place_bet_quote(bet: BetRequest):
    """x402 Payment Required endpoint"""
    
    # Rate limiting
    client_ip = "127.0.0.1"  # Replace with real IP
    if not await increment_rate_limit(f"bet:{client_ip}", 10, 60):
        raise HTTPException(429, "Rate limited")
    
    # Normalize side: support both yes/no (prediction) and home/away (sports)
    side_map = {
        "yes": "home",
        "no": "away",
        "home": "home",
        "away": "away",
        "over": "over",
        "under": "under"
    }
    
    normalized_side = side_map.get(bet.side.lower())
    if not normalized_side:
        print(f"[X402] Invalid side received: {bet.side}")
        raise HTTPException(400, f"Invalid side: {bet.side}. Must be one of: yes, no, home, away, over, under")
    
    quote_id = str(uuid.uuid4())
    odds = market_mgr.calculate_odds(bet.market_id)
    
    if normalized_side not in odds:
        print(f"[X402] Side {normalized_side} not in odds {odds}")
        raise HTTPException(400, f"Side {normalized_side} not available for this market")
    
    if not market_mgr.check_exposure(bet.market_id, normalized_side, bet.stake):
        raise HTTPException(400, "Exceeds exposure limit")
    
    price = market_mgr.quote_price(odds[normalized_side], bet.stake)
    
    quote = BetQuote(
        quote_id=quote_id,
        market_id=bet.market_id,
        side=normalized_side,
        odds=odds[normalized_side],
        price=price,
        max_stake=1.0,
        expires_at=int((datetime.utcnow() + timedelta(minutes=5)).timestamp())
    )
    
    # Update exposure
    market_mgr.update_exposure(bet.market_id, normalized_side, bet.stake)
    
    # HTTP 402 Payment Required
    payee_address = os.getenv("X402_PAYEE_ADDRESS", MARKET_MANAGER_ADDRESS)
    network_prefix = os.getenv("NETWORK", "monad-testnet")
    chain_id = os.getenv("CHAIN_ID", "10143")
    
    print(f"[X402] Quote {quote_id}: market={bet.market_id}, side={normalized_side}, stake={bet.stake}, price={price:.6f}")
    print(f"[X402] Payment address: {payee_address}")
    print(f"[X402] Network: {network_prefix} (Chain ID: {chain_id})")
    
    headers = {
        "Payment-Required": f"crypto-{network_prefix}://{payee_address}@{price:.6f}",
        "X-Quote-ID": quote_id,
        "Retry-After": "300"
    }
    
    return Response(
        content=quote.model_dump_json(),
        status_code=402,
        headers=headers,
        media_type="application/json"
    )

@router.post("/confirm")
async def confirm_payment(confirm: ConfirmRequest):
    """Confirm x402 payment and mint position"""
    
    print(f"[X402-CONFIRM] Confirming quote: {confirm.quote_id}")
    
    # Verify payment on blockchain
    payment = await verify_x402_payment(confirm.quote_id)
    
    if not payment.get("paid"):
        print(f"[X402-CONFIRM] Payment not verified for quote {confirm.quote_id}")
        raise HTTPException(400, "Payment not verified on blockchain")
    
    print(f"[X402-CONFIRM] Payment verified! TX: {payment.get('tx_hash')}")
    
    # TODO: Mint position token on smart contract
    # For now, just return success with the transaction hash
    
    return {
        "success": True,
        "position_id": confirm.quote_id,
        "tx_hash": payment.get("tx_hash"),
        "message": "Bet confirmed successfully"
    }
