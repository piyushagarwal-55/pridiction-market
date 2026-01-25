"""
Auto Bet Bot Service
Monitors markets and places bets automatically using AI predictions
"""

import asyncio
import time
from typing import Dict, List, Optional
from datetime import datetime
import logging

from .gemini_predictor import get_gemini_predictor
from .bot_safety import create_safety_checker
from web3 import Web3
from eth_account import Account

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class AutoBetBot:
    def __init__(
        self,
        user_address: str,
        private_key: str,
        bot_settings_address: str,
        prediction_market_address: str,
        usdt_address: str,
        web3_provider: str = "https://testnet-rpc.monad.xyz"
    ):
        self.user_address = Web3.to_checksum_address(user_address)
        self.private_key = private_key
        self.bot_settings_address = bot_settings_address
        self.prediction_market_address = prediction_market_address
        self.usdt_address = usdt_address
        
        # Initialize Web3
        self.w3 = Web3(Web3.HTTPProvider(web3_provider))
        self.account = Account.from_key(private_key)
        
        # Initialize services
        self.predictor = get_gemini_predictor()
        self.safety_checker = create_safety_checker(
            user_address,
            bot_settings_address,
            web3_provider
        )
        
        # Bot state
        self.is_running = False
        self.activity_log = []
        self.stats = {
            "markets_analyzed": 0,
            "bets_placed": 0,
            "bets_skipped": 0,
            "total_spent": 0,
            "last_activity": None
        }
        
        logger.info(f"🤖 Bot initialized for {user_address[:10]}...")
    
    async def start(self):
        """Start the bot"""
        if self.is_running:
            logger.warning("Bot is already running")
            return
        
        self.is_running = True
        self.log_activity("Bot started", "info")
        logger.info("🚀 Bot started!")
        
        # Main bot loop
        while self.is_running:
            try:
                await self._bot_cycle()
                
                # Wait 60 seconds before next cycle
                await asyncio.sleep(60)
                
            except Exception as e:
                logger.error(f"❌ Bot cycle error: {e}")
                self.log_activity(f"Error: {str(e)}", "error")
                await asyncio.sleep(60)
    
    async def stop(self):
        """Stop the bot"""
        self.is_running = False
        self.log_activity("Bot stopped", "info")
        logger.info("🛑 Bot stopped!")
    
    async def _bot_cycle(self):
        """Single bot cycle - check for new markets and place bets"""
        
        logger.info("🔄 Starting bot cycle...")
        
        # Check if bot is active on-chain
        is_active = await self.safety_checker.is_bot_active()
        if not is_active:
            logger.info("⏸️ Bot is not active on-chain")
            self.log_activity("Bot not active on-chain", "warning")
            return
        
        # Get new markets
        markets = await self._get_new_markets()
        
        if not markets or len(markets) == 0:
            logger.info("📭 No new markets found")
            return
        
        logger.info(f"📊 Found {len(markets)} new markets")
        
        # Analyze each market
        for market in markets:
            try:
                await self._analyze_and_bet(market)
            except Exception as e:
                logger.error(f"❌ Error processing market {market.get('id')}: {e}")
                self.log_activity(f"Error processing market: {str(e)}", "error")
    
    async def _get_new_markets(self) -> List[Dict]:
        """
        Get new markets from blockchain
        This would query the PredictionMarket contract for active markets
        """
        
        # TODO: Implement actual blockchain query
        # For now, return empty list
        # In production, this would:
        # 1. Query PredictionMarket contract for all markets
        # 2. Filter for markets that are:
        #    - Active (not resolved)
        #    - Not yet bet on by this user
        #    - Within allowed categories
        # 3. Return list of market data
        
        return []
    
    async def _analyze_and_bet(self, market: Dict):
        """Analyze market and place bet if conditions are met"""
        
        market_id = market.get('id', 'unknown')
        market_question = market.get('question', 'Unknown')
        market_category = market.get('category', 'unknown')
        
        logger.info(f"🔍 Analyzing market: {market_question}")
        self.stats["markets_analyzed"] += 1
        
        # Get AI prediction
        prediction = await self.predictor.predict_market(
            market_question,
            market_category,
            user_history=None  # TODO: Fetch user history
        )
        
        logger.info(f"🤖 AI Prediction: {prediction['prediction']} ({prediction['confidence']}%)")
        self.log_activity(
            f"Analyzed: {market_question[:50]}... → {prediction['prediction']} ({prediction['confidence']}%)",
            "info"
        )
        
        # Validate with safety checker
        can_bet, reason = await self.safety_checker.validate_all_checks(
            market,
            {
                "amount": prediction['recommended_bet'],
                "confidence": prediction['confidence']
            }
        )
        
        if not can_bet:
            logger.info(f"⏭️ Skipping bet: {reason}")
            self.log_activity(f"Skipped: {reason}", "warning")
            self.stats["bets_skipped"] += 1
            return
        
        # Place bet
        success = await self._place_bet(
            market,
            prediction['prediction'],
            prediction['recommended_bet']
        )
        
        if success:
            self.stats["bets_placed"] += 1
            self.stats["total_spent"] += prediction['recommended_bet']
            self.log_activity(
                f"✅ Bet placed: {market_question[:50]}... → {prediction['prediction']} (${prediction['recommended_bet']})",
                "success"
            )
        else:
            self.stats["bets_skipped"] += 1
            self.log_activity(
                f"❌ Bet failed: {market_question[:50]}...",
                "error"
            )
    
    async def _place_bet(
        self,
        market: Dict,
        choice: str,
        amount: float
    ) -> bool:
        """
        Place bet on blockchain
        
        Returns:
            True if successful, False otherwise
        """
        
        try:
            # TODO: Implement actual blockchain transaction
            # This would:
            # 1. Approve USDT if needed
            # 2. Call PredictionMarket.placeBet()
            # 3. Call BotSettings.recordBet()
            # 4. Wait for confirmation
            
            logger.info(f"💰 Placing bet: {choice} with ${amount}")
            
            # Simulate for now
            await asyncio.sleep(1)
            
            return True
            
        except Exception as e:
            logger.error(f"❌ Error placing bet: {e}")
            return False
    
    def log_activity(self, message: str, level: str = "info"):
        """Log activity with timestamp"""
        entry = {
            "timestamp": datetime.now().isoformat(),
            "message": message,
            "level": level
        }
        self.activity_log.append(entry)
        self.stats["last_activity"] = entry["timestamp"]
        
        # Keep only last 100 entries
        if len(self.activity_log) > 100:
            self.activity_log = self.activity_log[-100:]
    
    def get_status(self) -> Dict:
        """Get bot status"""
        return {
            "is_running": self.is_running,
            "user_address": self.user_address,
            "stats": self.stats,
            "last_activity": self.stats.get("last_activity")
        }
    
    def get_activity_log(self, limit: int = 50) -> List[Dict]:
        """Get recent activity log"""
        return self.activity_log[-limit:]


# Bot instances (one per user)
_bot_instances: Dict[str, AutoBetBot] = {}


def get_bot_instance(user_address: str) -> Optional[AutoBetBot]:
    """Get bot instance for user"""
    return _bot_instances.get(user_address.lower())


def create_bot_instance(
    user_address: str,
    private_key: str,
    bot_settings_address: str,
    prediction_market_address: str,
    usdt_address: str
) -> AutoBetBot:
    """Create and store bot instance"""
    bot = AutoBetBot(
        user_address,
        private_key,
        bot_settings_address,
        prediction_market_address,
        usdt_address
    )
    _bot_instances[user_address.lower()] = bot
    return bot


def remove_bot_instance(user_address: str):
    """Remove bot instance"""
    if user_address.lower() in _bot_instances:
        del _bot_instances[user_address.lower()]
