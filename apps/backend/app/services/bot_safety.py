"""
Bot Safety Checker
Validates all safety checks before placing bets
"""

import time
from typing import Dict, Tuple, Optional
from web3 import Web3
from eth_typing import Address

# Contract ABI (simplified - only functions we need)
BOT_SETTINGS_ABI = [
    {
        "name": "canPlaceBet",
        "type": "function",
        "stateMutability": "view",
        "inputs": [
            {"name": "user", "type": "address"},
            {"name": "marketId", "type": "string"},
            {"name": "category", "type": "string"},
            {"name": "betAmount", "type": "uint256"},
            {"name": "aiConfidence", "type": "uint256"}
        ],
        "outputs": [
            {"name": "", "type": "bool"},
            {"name": "", "type": "string"}
        ]
    },
    {
        "name": "getBotConfig",
        "type": "function",
        "stateMutability": "view",
        "inputs": [{"name": "user", "type": "address"}],
        "outputs": [
            {"name": "isActive", "type": "bool"},
            {"name": "maxBetPerMarket", "type": "uint256"},
            {"name": "dailyBudget", "type": "uint256"},
            {"name": "weeklyBudget", "type": "uint256"},
            {"name": "minConfidence", "type": "uint256"},
            {"name": "maxBetsPerDay", "type": "uint256"},
            {"name": "cooldownMinutes", "type": "uint256"},
            {"name": "emergencyStopLoss", "type": "uint256"}
        ]
    },
    {
        "name": "getBotStats",
        "type": "function",
        "stateMutability": "view",
        "inputs": [{"name": "user", "type": "address"}],
        "outputs": [
            {"name": "dailySpent", "type": "uint256"},
            {"name": "weeklySpent", "type": "uint256"},
            {"name": "totalLosses", "type": "uint256"},
            {"name": "betsToday", "type": "uint256"},
            {"name": "lastBetTimestamp", "type": "uint256"},
            {"name": "emergencyStopActive", "type": "bool"}
        ]
    },
    {
        "name": "isBotActive",
        "type": "function",
        "stateMutability": "view",
        "inputs": [{"name": "user", "type": "address"}],
        "outputs": [{"name": "", "type": "bool"}]
    }
]


class BotSafetyChecker:
    def __init__(
        self,
        user_address: str,
        bot_settings_address: str,
        web3_provider: str
    ):
        self.user_address = Web3.to_checksum_address(user_address)
        self.bot_settings_address = Web3.to_checksum_address(bot_settings_address)
        
        # Initialize Web3
        self.w3 = Web3(Web3.HTTPProvider(web3_provider))
        
        # Initialize contract
        self.contract = self.w3.eth.contract(
            address=self.bot_settings_address,
            abi=BOT_SETTINGS_ABI
        )
        
        print(f"🛡️ Safety checker initialized for {user_address[:10]}...")
    
    async def can_place_bet(
        self,
        market_id: str,
        market_category: str,
        bet_amount: float,  # USDT
        ai_confidence: int  # 0-100
    ) -> Tuple[bool, str]:
        """
        Check if bot can place bet
        
        Returns:
            (can_bet: bool, reason: str)
        """
        
        try:
            # Convert USDT to wei (6 decimals)
            bet_amount_wei = int(bet_amount * 10**6)
            
            # Call contract
            can_bet, reason = self.contract.functions.canPlaceBet(
                self.user_address,
                market_id,
                market_category,
                bet_amount_wei,
                ai_confidence
            ).call()
            
            if can_bet:
                print(f"✅ Safety check passed for {market_id}")
            else:
                print(f"❌ Safety check failed: {reason}")
            
            return can_bet, reason
            
        except Exception as e:
            print(f"❌ Error checking safety: {e}")
            return False, f"Safety check error: {str(e)}"
    
    async def get_bot_config(self) -> Optional[Dict]:
        """Get bot configuration from contract"""
        
        try:
            config = self.contract.functions.getBotConfig(
                self.user_address
            ).call()
            
            return {
                "is_active": config[0],
                "max_bet_per_market": config[1] / 10**6,  # Convert to USDT
                "daily_budget": config[2] / 10**6,
                "weekly_budget": config[3] / 10**6,
                "min_confidence": config[4],
                "max_bets_per_day": config[5],
                "cooldown_minutes": config[6],
                "emergency_stop_loss": config[7] / 10**6
            }
            
        except Exception as e:
            print(f"❌ Error getting config: {e}")
            return None
    
    async def get_bot_stats(self) -> Optional[Dict]:
        """Get bot statistics from contract"""
        
        try:
            stats = self.contract.functions.getBotStats(
                self.user_address
            ).call()
            
            return {
                "daily_spent": stats[0] / 10**6,  # Convert to USDT
                "weekly_spent": stats[1] / 10**6,
                "total_losses": stats[2] / 10**6,
                "bets_today": stats[3],
                "last_bet_timestamp": stats[4],
                "emergency_stop_active": stats[5]
            }
            
        except Exception as e:
            print(f"❌ Error getting stats: {e}")
            return None
    
    async def is_bot_active(self) -> bool:
        """Check if bot is active"""
        
        try:
            return self.contract.functions.isBotActive(
                self.user_address
            ).call()
        except Exception as e:
            print(f"❌ Error checking if bot active: {e}")
            return False
    
    async def validate_all_checks(
        self,
        market: Dict,
        prediction: Dict
    ) -> Tuple[bool, str]:
        """
        Run all safety checks
        
        Args:
            market: Market data
            prediction: AI prediction with amount and confidence
        
        Returns:
            (can_bet: bool, reason: str)
        """
        
        # Check 1: Bot active?
        if not await self.is_bot_active():
            return False, "Bot is not active"
        
        # Check 2: Get config
        config = await self.get_bot_config()
        if not config:
            return False, "Could not load bot configuration"
        
        # Check 3: Get stats
        stats = await self.get_bot_stats()
        if not stats:
            return False, "Could not load bot statistics"
        
        # Check 4: Contract validation
        can_bet, reason = await self.can_place_bet(
            market['id'],
            market.get('category', 'unknown'),
            prediction['amount'],
            prediction['confidence']
        )
        
        if not can_bet:
            return False, reason
        
        # Check 5: Wallet balance (additional check)
        # This would require wallet integration
        # For now, we trust the contract checks
        
        # All checks passed!
        return True, "All safety checks passed"


def create_safety_checker(
    user_address: str,
    bot_settings_address: str,
    web3_provider: str = "https://testnet-rpc.monad.xyz"
) -> BotSafetyChecker:
    """Factory function to create safety checker"""
    return BotSafetyChecker(user_address, bot_settings_address, web3_provider)
