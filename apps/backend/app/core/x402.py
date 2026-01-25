from typing import Dict, Any

async def verify_x402_payment(quote_id: str) -> Dict[str, Any]:
    """Verify x402 payment on Monad testnet"""
    # Simulate blockchain verification
    return {
        "quote_id": quote_id,
        "paid": True,
        "tx_hash": f"0x{quote_id[:64]}",
        "confirmed": True
    }
