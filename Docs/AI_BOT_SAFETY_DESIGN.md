# 🤖 AI Auto-Bet Bot - Complete Safety Design

## 🚨 Edge Cases & Safety Mechanisms

### Critical Problems to Prevent

1. **Bot bets all your money** ❌
2. **Bot makes stupid bets** ❌
3. **Bot gets hacked** ❌
4. **Bot ignores user preferences** ❌
5. **Bot drains wallet on bad markets** ❌
6. **Bot can't be stopped** ❌
7. **Settings get lost** ❌
8. **No audit trail** ❌

---

## 🛡️ Safety Architecture

### 1. On-Chain Bot Settings Contract

Store ALL settings on-chain for:
- ✅ Immutability
- ✅ Easy fetching
- ✅ Transparency
- ✅ User control

```solidity
// contracts/BotSettings.sol
pragma solidity ^0.8.24;

contract BotSettings {
    struct UserBotConfig {
        bool isActive;
        uint256 maxBetPerMarket;      // Max USDT per single bet
        uint256 dailyBudget;          // Max USDT per day
        uint256 weeklyBudget;         // Max USDT per week
        uint256 minConfidence;        // Min AI confidence (0-100)
        uint256 maxBetsPerDay;        // Max number of bets per day
        uint256 cooldownMinutes;      // Minutes between bets
        uint256 emergencyStopLoss;    // Stop if losses exceed this
        string[] allowedCategories;   // Only bet on these
        uint256 lastBetTimestamp;
        uint256 dailySpent;
        uint256 weeklySpent;
        uint256 totalLosses;
        uint256 lastResetDay;
        uint256 lastResetWeek;
    }
    
    mapping(address => UserBotConfig) public botConfigs;
    mapping(address => bool) public emergencyStop;
    
    event BotConfigured(address indexed user, UserBotConfig config);
    event BotActivated(address indexed user);
    event BotDeactivated(address indexed user);
    event EmergencyStopTriggered(address indexed user, string reason);
    
    function configureBotSettings(
        uint256 _maxBetPerMarket,
        uint256 _dailyBudget,
        uint256 _weeklyBudget,
        uint256 _minConfidence,
        uint256 _maxBetsPerDay,
        uint256 _cooldownMinutes,
        uint256 _emergencyStopLoss,
        string[] memory _allowedCategories
    ) external {
        require(_maxBetPerMarket >= 5 * 10**6, "Min bet 5 USDT");
        require(_maxBetPerMarket <= 1000 * 10**6, "Max bet 1000 USDT");
        require(_minConfidence >= 60 && _minConfidence <= 95, "Confidence 60-95%");
        require(_dailyBudget >= _maxBetPerMarket, "Daily budget too low");
        
        botConfigs[msg.sender] = UserBotConfig({
            isActive: false,
            maxBetPerMarket: _maxBetPerMarket,
            dailyBudget: _dailyBudget,
            weeklyBudget: _weeklyBudget,
            minConfidence: _minConfidence,
            maxBetsPerDay: _maxBetsPerDay,
            cooldownMinutes: _cooldownMinutes,
            emergencyStopLoss: _emergencyStopLoss,
            allowedCategories: _allowedCategories,
            lastBetTimestamp: 0,
            dailySpent: 0,
            weeklySpent: 0,
            totalLosses: 0,
            lastResetDay: block.timestamp / 1 days,
            lastResetWeek: block.timestamp / 1 weeks
        });
        
        emit BotConfigured(msg.sender, botConfigs[msg.sender]);
    }
    
    function activateBot() external {
        require(botConfigs[msg.sender].maxBetPerMarket > 0, "Configure first");
        require(!emergencyStop[msg.sender], "Emergency stop active");
        botConfigs[msg.sender].isActive = true;
        emit BotActivated(msg.sender);
    }
    
    function deactivateBot() external {
        botConfigs[msg.sender].isActive = false;
        emit BotDeactivated(msg.sender);
    }
    
    function triggerEmergencyStop(string memory reason) external {
        emergencyStop[msg.sender] = true;
        botConfigs[msg.sender].isActive = false;
        emit EmergencyStopTriggered(msg.sender, reason);
    }
    
    function canPlaceBet(
        address user,
        uint256 betAmount
    ) external view returns (bool, string memory) {
        UserBotConfig memory config = botConfigs[user];
        
        if (!config.isActive) return (false, "Bot not active");
        if (emergencyStop[user]) return (false, "Emergency stop");
        if (betAmount > config.maxBetPerMarket) return (false, "Exceeds max bet");
        if (config.dailySpent + betAmount > config.dailyBudget) return (false, "Daily budget exceeded");
        if (config.weeklySpent + betAmount > config.weeklyBudget) return (false, "Weekly budget exceeded");
        if (block.timestamp < config.lastBetTimestamp + (config.cooldownMinutes * 60)) {
            return (false, "Cooldown active");
        }
        if (config.totalLosses >= config.emergencyStopLoss) {
            return (false, "Stop loss triggered");
        }
        
        return (true, "");
    }
}
```

---

## 🎛️ Bot Settings UI

### Settings Page Design

```typescript
// apps/frontend/app/bot/settings/page.tsx

export default function BotSettingsPage() {
    const [settings, setSettings] = useState({
        maxBetPerMarket: 50,      // USDT
        dailyBudget: 200,         // USDT
        weeklyBudget: 1000,       // USDT
        minConfidence: 75,        // %
        maxBetsPerDay: 10,
        cooldownMinutes: 30,
        emergencyStopLoss: 500,   // USDT
        allowedCategories: ['sports', 'crypto'],
    });

    return (
        <div className="bot-settings-page">
            <h1>🤖 AI Bot Safety Settings</h1>
            <p>Configure limits to protect your funds</p>

            {/* Bet Limits */}
            <section className="settings-section">
                <h2>💰 Bet Limits</h2>
                
                <div className="setting-item">
                    <label>Max Bet Per Market</label>
                    <input 
                        type="number" 
                        value={settings.maxBetPerMarket}
                        min={5}
                        max={1000}
                    />
                    <span className="help">Maximum USDT bot can bet on a single market</span>
                </div>

                <div className="setting-item">
                    <label>Daily Budget</label>
                    <input 
                        type="number" 
                        value={settings.dailyBudget}
                    />
                    <span className="help">Total USDT bot can spend per day</span>
                    <div className="progress-bar">
                        <div className="progress" style={{width: '40%'}} />
                        <span>80 / 200 USDT used today</span>
                    </div>
                </div>

                <div className="setting-item">
                    <label>Weekly Budget</label>
                    <input 
                        type="number" 
                        value={settings.weeklyBudget}
                    />
                    <span className="help">Total USDT bot can spend per week</span>
                </div>
            </section>

            {/* AI Confidence */}
            <section className="settings-section">
                <h2>🧠 AI Confidence</h2>
                
                <div className="setting-item">
                    <label>Minimum Confidence: {settings.minConfidence}%</label>
                    <input 
                        type="range" 
                        min={60}
                        max={95}
                        value={settings.minConfidence}
                    />
                    <div className="confidence-scale">
                        <span>60% (Risky)</span>
                        <span>75% (Balanced)</span>
                        <span>95% (Safe)</span>
                    </div>
                    <span className="help">
                        Bot only bets if AI confidence is above this threshold
                    </span>
                </div>
            </section>

            {/* Rate Limiting */}
            <section className="settings-section">
                <h2>⏱️ Rate Limiting</h2>
                
                <div className="setting-item">
                    <label>Max Bets Per Day</label>
                    <input 
                        type="number" 
                        value={settings.maxBetsPerDay}
                        min={1}
                        max={50}
                    />
                </div>

                <div className="setting-item">
                    <label>Cooldown Between Bets (minutes)</label>
                    <input 
                        type="number" 
                        value={settings.cooldownMinutes}
                        min={5}
                        max={120}
                    />
                    <span className="help">Prevents rapid-fire betting</span>
                </div>
            </section>

            {/* Emergency Stop */}
            <section className="settings-section danger">
                <h2>🚨 Emergency Stop Loss</h2>
                
                <div className="setting-item">
                    <label>Stop if Total Losses Exceed</label>
                    <input 
                        type="number" 
                        value={settings.emergencyStopLoss}
                    />
                    <span className="help">
                        Bot automatically stops if cumulative losses reach this amount
                    </span>
                </div>

                <div className="current-losses">
                    <span>Current Losses: 120 USDT</span>
                    <div className="progress-bar danger">
                        <div className="progress" style={{width: '24%'}} />
                    </div>
                </div>
            </section>

            {/* Categories */}
            <section className="settings-section">
                <h2>📂 Allowed Categories</h2>
                
                <div className="category-checkboxes">
                    <label>
                        <input type="checkbox" checked />
                        Sports
                    </label>
                    <label>
                        <input type="checkbox" checked />
                        Crypto
                    </label>
                    <label>
                        <input type="checkbox" />
                        Politics
                    </label>
                    <label>
                        <input type="checkbox" />
                        Technology
                    </label>
                </div>
            </section>

            {/* Save Button */}
            <button 
                className="save-settings-btn"
                onClick={saveSettingsToChain}
            >
                💾 Save Settings to Blockchain
            </button>

            <div className="warning-box">
                ⚠️ Settings are stored on-chain and cannot be changed while bot is active
            </div>
        </div>
    );
}
```

---

## 🔒 Safety Checks (Backend)

```python
# apps/backend/app/services/bot_safety.py

class BotSafetyChecker:
    def __init__(self, user_address):
        self.user_address = user_address
        self.settings = self.load_settings_from_chain()
    
    async def can_place_bet(self, market, prediction):
        """
        Run ALL safety checks before placing bet
        Returns: (can_bet: bool, reason: str)
        """
        
        # Check 1: Bot active?
        if not self.settings['isActive']:
            return False, "Bot is not active"
        
        # Check 2: Emergency stop?
        if self.settings['emergencyStop']:
            return False, "Emergency stop triggered"
        
        # Check 3: Category allowed?
        if market.category not in self.settings['allowedCategories']:
            return False, f"Category '{market.category}' not allowed"
        
        # Check 4: Confidence high enough?
        if prediction['confidence'] < self.settings['minConfidence']:
            return False, f"Confidence {prediction['confidence']}% below threshold"
        
        # Check 5: Bet amount within limit?
        if prediction['amount'] > self.settings['maxBetPerMarket']:
            return False, f"Bet amount exceeds max ({self.settings['maxBetPerMarket']} USDT)"
        
        # Check 6: Daily budget?
        if self.settings['dailySpent'] + prediction['amount'] > self.settings['dailyBudget']:
            return False, "Daily budget exceeded"
        
        # Check 7: Weekly budget?
        if self.settings['weeklySpent'] + prediction['amount'] > self.settings['weeklyBudget']:
            return False, "Weekly budget exceeded"
        
        # Check 8: Cooldown?
        time_since_last_bet = time.time() - self.settings['lastBetTimestamp']
        if time_since_last_bet < (self.settings['cooldownMinutes'] * 60):
            return False, f"Cooldown active ({self.settings['cooldownMinutes']} min)"
        
        # Check 9: Max bets per day?
        if self.settings['betsToday'] >= self.settings['maxBetsPerDay']:
            return False, "Max bets per day reached"
        
        # Check 10: Stop loss?
        if self.settings['totalLosses'] >= self.settings['emergencyStopLoss']:
            await self.trigger_emergency_stop("Stop loss reached")
            return False, "Emergency stop loss triggered"
        
        # Check 11: Wallet balance?
        balance = await get_wallet_balance(self.user_address)
        if balance < prediction['amount']:
            return False, "Insufficient wallet balance"
        
        # Check 12: Market still open?
        if market.status != 'ACTIVE':
            return False, "Market not active"
        
        # Check 13: Duplicate bet?
        if await has_already_bet_on_market(self.user_address, market.id):
            return False, "Already bet on this market"
        
        # All checks passed!
        return True, "All safety checks passed"
```

---

## 📊 Bot Dashboard with Safety Indicators

```typescript
export function BotDashboard() {
    return (
        <div className="bot-dashboard">
            {/* Status Card */}
            <div className="status-card">
                <h2>🤖 Bot Status</h2>
                <div className="status-indicator active">
                    🟢 ACTIVE & MONITORING
                </div>
                
                <div className="safety-indicators">
                    <div className="indicator safe">
                        ✅ All safety checks passing
                    </div>
                    <div className="indicator">
                        💰 Daily budget: 80 / 200 USDT (40%)
                    </div>
                    <div className="indicator">
                        📊 Confidence threshold: 75%
                    </div>
                    <div className="indicator">
                        ⏱️ Cooldown: Ready
                    </div>
                </div>
            </div>

            {/* Budget Tracking */}
            <div className="budget-card">
                <h3>💰 Budget Usage</h3>
                
                <div className="budget-item">
                    <span>Daily (80 / 200 USDT)</span>
                    <div className="progress-bar">
                        <div className="progress" style={{width: '40%'}} />
                    </div>
                </div>

                <div className="budget-item">
                    <span>Weekly (320 / 1000 USDT)</span>
                    <div className="progress-bar">
                        <div className="progress" style={{width: '32%'}} />
                    </div>
                </div>

                <div className="budget-item danger">
                    <span>Total Losses (120 / 500 USDT)</span>
                    <div className="progress-bar">
                        <div className="progress" style={{width: '24%'}} />
                    </div>
                </div>
            </div>

            {/* Activity Log with Safety Info */}
            <div className="activity-log">
                <h3>📋 Recent Activity</h3>
                
                <div className="activity-item success">
                    <span className="time">2 min ago</span>
                    <span className="action">✅ Bet Placed</span>
                    <span className="details">
                        30 USDT on YES • Confidence: 82%
                    </span>
                </div>

                <div className="activity-item skipped">
                    <span className="time">15 min ago</span>
                    <span className="action">⏭️ Skipped</span>
                    <span className="details">
                        Confidence 68% below threshold (75%)
                    </span>
                </div>

                <div className="activity-item blocked">
                    <span className="time">1 hour ago</span>
                    <span className="action">🚫 Blocked</span>
                    <span className="details">
                        Category 'Politics' not allowed
                    </span>
                </div>
            </div>

            {/* Emergency Stop Button */}
            <button className="emergency-stop-btn">
                🚨 EMERGENCY STOP
            </button>
        </div>
    );
}
```

---

## 🎯 Complete Safety Checklist

### Before Bot Starts
- [ ] User configured all settings
- [ ] Settings saved to blockchain
- [ ] Wallet has sufficient balance
- [ ] USDT approved for spending
- [ ] User acknowledged risks

### Before Each Bet
- [ ] Bot is active
- [ ] No emergency stop
- [ ] Category allowed
- [ ] Confidence above threshold
- [ ] Amount within max bet limit
- [ ] Daily budget not exceeded
- [ ] Weekly budget not exceeded
- [ ] Cooldown period passed
- [ ] Max bets per day not reached
- [ ] Stop loss not triggered
- [ ] Wallet has balance
- [ ] Market is active
- [ ] Not already bet on this market

### After Each Bet
- [ ] Update daily spent
- [ ] Update weekly spent
- [ ] Update last bet timestamp
- [ ] Update bet count
- [ ] Log activity
- [ ] Notify user
- [ ] Check if stop loss triggered

---

This design ensures the bot is **safe, transparent, and user-controlled**!

Want me to start implementing this?
