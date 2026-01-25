from typing import Dict, List

class SettlementService:
    async def settle_market(self, market_id: str, result: str, positions: List[Dict]):
        """Process payouts for winning positions"""
        print(f"🔄 Settling {market_id} -> Winner: {result}")
        
        winners = [p for p in positions if p["side"] == result]
        total_payout = sum(p["stake"] * p["odds"] for p in winners)
        
        print(f"💰 Total payout: {total_payout} CRO")
        # In production: batch transfer winnings
