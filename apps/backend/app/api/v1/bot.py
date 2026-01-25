"""
Bot API Endpoints
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, List
import os

from app.services.auto_bet_bot import (
    get_bot_instance,
    create_bot_instance,
    remove_bot_instance
)

router = APIRouter(tags=["bot"])

# Contract addresses from environment
BOT_SETTINGS_ADDRESS = os.getenv("BOT_SETTINGS_ADDRESS", "0xEBE6E13c31b23347F69c1b31fAdB0335063E224b")
PREDICTION_MARKET_ADDRESS = os.getenv("PREDICTION_MARKET_ADDRESS", "0x7d42BDDc69f58E5C6FF1852Afd6B4c2303227D7B")
USDT_ADDRESS = os.getenv("USDT_ADDRESS", "0x8c34Bb925340901683C48BDbDc2D211B9C7c6c21")


# ============================================================================
# REQUEST MODELS
# ============================================================================

class StartBotRequest(BaseModel):
    user_address: str
    private_key: str  # In production, use secure key management


class StopBotRequest(BaseModel):
    user_address: str


class BotStatusRequest(BaseModel):
    user_address: str


# ============================================================================
# ENDPOINTS
# ============================================================================

@router.post("/start")
async def start_bot(request: StartBotRequest):
    """
    Start auto-betting bot for user
    
    The bot will:
    - Monitor for new markets every 60 seconds
    - Use AI to analyze markets
    - Validate with safety checks
    - Place bets automatically
    """
    
    try:
        # Check if bot already exists
        existing_bot = get_bot_instance(request.user_address)
        
        if existing_bot and existing_bot.is_running:
            return {
                "success": False,
                "message": "Bot is already running",
                "status": existing_bot.get_status()
            }
        
        # Create new bot instance
        bot = create_bot_instance(
            request.user_address,
            request.private_key,
            BOT_SETTINGS_ADDRESS,
            PREDICTION_MARKET_ADDRESS,
            USDT_ADDRESS
        )
        
        # Start bot in background
        import asyncio
        asyncio.create_task(bot.start())
        
        return {
            "success": True,
            "message": "Bot started successfully",
            "status": bot.get_status()
        }
        
    except Exception as e:
        import traceback
        print(f"❌ Error starting bot: {e}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/stop")
async def stop_bot(request: StopBotRequest):
    """Stop auto-betting bot for user"""
    
    try:
        bot = get_bot_instance(request.user_address)
        
        if not bot:
            return {
                "success": False,
                "message": "Bot not found"
            }
        
        if not bot.is_running:
            return {
                "success": False,
                "message": "Bot is not running"
            }
        
        await bot.stop()
        
        return {
            "success": True,
            "message": "Bot stopped successfully",
            "status": bot.get_status()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/status/{user_address}")
async def get_bot_status(user_address: str):
    """Get bot status and statistics"""
    
    try:
        bot = get_bot_instance(user_address)
        
        if not bot:
            return {
                "exists": False,
                "is_running": False,
                "message": "Bot not initialized"
            }
        
        status = bot.get_status()
        
        # Get on-chain stats
        on_chain_stats = await bot.safety_checker.get_bot_stats()
        on_chain_config = await bot.safety_checker.get_bot_config()
        
        return {
            "exists": True,
            "is_running": status["is_running"],
            "stats": status["stats"],
            "last_activity": status["last_activity"],
            "on_chain_stats": on_chain_stats,
            "on_chain_config": on_chain_config
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/activity/{user_address}")
async def get_bot_activity(user_address: str, limit: int = 50):
    """Get recent bot activity log"""
    
    try:
        bot = get_bot_instance(user_address)
        
        if not bot:
            return {
                "success": False,
                "message": "Bot not found",
                "activity": []
            }
        
        activity = bot.get_activity_log(limit)
        
        return {
            "success": True,
            "activity": activity,
            "total_entries": len(bot.activity_log)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/remove/{user_address}")
async def remove_bot(user_address: str):
    """Remove bot instance (must be stopped first)"""
    
    try:
        bot = get_bot_instance(user_address)
        
        if not bot:
            return {
                "success": False,
                "message": "Bot not found"
            }
        
        if bot.is_running:
            return {
                "success": False,
                "message": "Stop bot before removing"
            }
        
        remove_bot_instance(user_address)
        
        return {
            "success": True,
            "message": "Bot removed successfully"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
