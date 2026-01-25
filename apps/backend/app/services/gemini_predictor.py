"""
Gemini AI Predictor Service
Uses Google's Gemini AI to predict market outcomes
"""

import json
import os
from typing import Dict, List, Optional
import google.generativeai as genai

# Configure Gemini
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "AIzaSyDFS8umhNSmp38Hw4Zk2gDAG1c-l93vuu0")
MODEL_NAME = os.getenv("MODEL_NAME", "gemini-flash-latest")

genai.configure(api_key=GEMINI_API_KEY)


class GeminiPredictor:
    def __init__(self):
        self.model = genai.GenerativeModel(MODEL_NAME)
        print(f"🤖 Gemini AI initialized with model: {MODEL_NAME}")
    
    async def predict_market(
        self,
        market_question: str,
        market_category: str,
        user_history: Optional[List[Dict]] = None
    ) -> Dict:
        """
        Predict market outcome using Gemini AI
        
        Args:
            market_question: The prediction market question
            market_category: Category (sports, crypto, politics, etc.)
            user_history: User's betting history for personalization
        
        Returns:
            {
                "prediction": "YES" or "NO",
                "confidence": 0-100,
                "reasoning": "why",
                "risk_level": "LOW", "MEDIUM", or "HIGH",
                "recommended_bet": amount in USDT
            }
        """
        
        # Build prompt
        prompt = self._build_prediction_prompt(
            market_question,
            market_category,
            user_history
        )
        
        try:
            # Generate prediction
            response = self.model.generate_content(prompt)
            
            # Parse JSON response
            result = self._parse_response(response.text)
            
            print(f"✅ Gemini prediction: {result['prediction']} ({result['confidence']}%)")
            
            return result
            
        except Exception as e:
            print(f"❌ Gemini prediction error: {e}")
            # Return conservative default
            return {
                "prediction": "NO",
                "confidence": 50,
                "reasoning": f"Error in AI prediction: {str(e)}",
                "risk_level": "HIGH",
                "recommended_bet": 0
            }
    
    def _build_prediction_prompt(
        self,
        question: str,
        category: str,
        user_history: Optional[List[Dict]]
    ) -> str:
        """Build the prompt for Gemini"""
        
        prompt = f"""
You are an expert prediction market analyst. Analyze this market and provide a prediction.

Market Question: {question}
Category: {category}

"""
        
        # Add user history if available
        if user_history and len(user_history) > 0:
            prompt += "User's Betting History:\n"
            for bet in user_history[-10:]:  # Last 10 bets
                prompt += f"- {bet.get('market_question', 'Unknown')}: Bet {bet.get('choice', 'Unknown')} "
                prompt += f"({bet.get('amount', 0)} USDT) - "
                prompt += f"{'Won' if bet.get('won', False) else 'Lost'}\n"
            prompt += "\n"
        
        prompt += """
Analyze this market carefully and provide your prediction in JSON format:

{
    "prediction": "YES" or "NO",
    "confidence": 0-100 (integer),
    "reasoning": "Brief explanation of your prediction (2-3 sentences)",
    "risk_level": "LOW", "MEDIUM", or "HIGH",
    "recommended_bet": 10-100 (USDT amount to bet)
}

Guidelines:
- Be conservative with confidence scores
- Consider current events and trends
- Factor in the user's betting patterns if provided
- Recommend lower bets for higher risk
- Only return valid JSON, no additional text

JSON Response:
"""
        
        return prompt
    
    def _parse_response(self, response_text: str) -> Dict:
        """Parse Gemini's response"""
        
        try:
            # Try to extract JSON from response
            # Sometimes Gemini adds markdown code blocks
            if "```json" in response_text:
                json_start = response_text.find("```json") + 7
                json_end = response_text.find("```", json_start)
                json_text = response_text[json_start:json_end].strip()
            elif "```" in response_text:
                json_start = response_text.find("```") + 3
                json_end = response_text.find("```", json_start)
                json_text = response_text[json_start:json_end].strip()
            else:
                json_text = response_text.strip()
            
            result = json.loads(json_text)
            
            # Validate required fields
            required_fields = ["prediction", "confidence", "reasoning", "risk_level", "recommended_bet"]
            for field in required_fields:
                if field not in result:
                    raise ValueError(f"Missing required field: {field}")
            
            # Validate values
            if result["prediction"] not in ["YES", "NO"]:
                result["prediction"] = "NO"
            
            result["confidence"] = max(0, min(100, int(result["confidence"])))
            
            if result["risk_level"] not in ["LOW", "MEDIUM", "HIGH"]:
                result["risk_level"] = "MEDIUM"
            
            result["recommended_bet"] = max(5, min(1000, int(result["recommended_bet"])))
            
            return result
            
        except Exception as e:
            print(f"❌ Error parsing Gemini response: {e}")
            print(f"Response text: {response_text}")
            
            # Return safe default
            return {
                "prediction": "NO",
                "confidence": 50,
                "reasoning": "Unable to parse AI response",
                "risk_level": "HIGH",
                "recommended_bet": 10
            }
    
    async def analyze_user_strategy(self, user_history: List[Dict]) -> Dict:
        """
        Analyze user's betting strategy and patterns
        
        Returns:
            {
                "favorite_categories": ["sports", "crypto"],
                "avg_bet_amount": 50,
                "win_rate": 65,
                "typical_choice": "YES",
                "risk_profile": "MODERATE"
            }
        """
        
        if not user_history or len(user_history) == 0:
            return {
                "favorite_categories": [],
                "avg_bet_amount": 50,
                "win_rate": 0,
                "typical_choice": "YES",
                "risk_profile": "UNKNOWN"
            }
        
        # Calculate stats
        categories = {}
        total_bet = 0
        wins = 0
        yes_count = 0
        
        for bet in user_history:
            # Count categories
            category = bet.get('category', 'unknown')
            categories[category] = categories.get(category, 0) + 1
            
            # Sum bets
            total_bet += bet.get('amount', 0)
            
            # Count wins
            if bet.get('won', False):
                wins += 1
            
            # Count YES bets
            if bet.get('choice', '').upper() == 'YES':
                yes_count += 1
        
        # Calculate metrics
        favorite_categories = sorted(categories.items(), key=lambda x: x[1], reverse=True)
        favorite_categories = [cat[0] for cat in favorite_categories[:3]]
        
        avg_bet = total_bet / len(user_history) if len(user_history) > 0 else 50
        win_rate = (wins / len(user_history) * 100) if len(user_history) > 0 else 0
        typical_choice = "YES" if yes_count > len(user_history) / 2 else "NO"
        
        # Determine risk profile
        if avg_bet > 200:
            risk_profile = "AGGRESSIVE"
        elif avg_bet > 100:
            risk_profile = "MODERATE"
        else:
            risk_profile = "CONSERVATIVE"
        
        return {
            "favorite_categories": favorite_categories,
            "avg_bet_amount": round(avg_bet, 2),
            "win_rate": round(win_rate, 2),
            "typical_choice": typical_choice,
            "risk_profile": risk_profile,
            "total_bets": len(user_history),
            "total_wins": wins
        }


# Singleton instance
_predictor_instance = None

def get_gemini_predictor() -> GeminiPredictor:
    """Get singleton Gemini predictor instance"""
    global _predictor_instance
    if _predictor_instance is None:
        _predictor_instance = GeminiPredictor()
    return _predictor_instance
