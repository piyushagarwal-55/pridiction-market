// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title BotSettings
 * @dev Store AI bot configuration on-chain for transparency and safety
 * 
 * Safety Features:
 * - Max bet limits per market
 * - Daily and weekly budget caps
 * - Minimum AI confidence threshold
 * - Rate limiting (cooldown, max bets per day)
 * - Emergency stop loss
 * - Category whitelist
 */

contract BotSettings is Ownable, ReentrancyGuard {
    // ============================================================================
    // STRUCTS
    // ============================================================================

    struct UserBotConfig {
        bool isActive;
        uint256 maxBetPerMarket;      // Max USDT per single bet (6 decimals)
        uint256 dailyBudget;          // Max USDT per day
        uint256 weeklyBudget;         // Max USDT per week
        uint256 minConfidence;        // Min AI confidence (0-100)
        uint256 maxBetsPerDay;        // Max number of bets per day
        uint256 cooldownMinutes;      // Minutes between bets
        uint256 emergencyStopLoss;    // Stop if losses exceed this
        uint256 lastBetTimestamp;     // Last bet timestamp
        uint256 dailySpent;           // Spent today
        uint256 weeklySpent;          // Spent this week
        uint256 totalLosses;          // Cumulative losses
        uint256 betsToday;            // Bets placed today
        uint256 lastResetDay;         // Last daily reset
        uint256 lastResetWeek;        // Last weekly reset
    }

    // ============================================================================
    // STATE VARIABLES
    // ============================================================================

    mapping(address => UserBotConfig) public botConfigs;
    mapping(address => string[]) public allowedCategories;
    mapping(address => bool) public emergencyStop;
    mapping(address => mapping(string => bool)) public hasPlacedBet; // user => marketId => placed

    // ============================================================================
    // EVENTS
    // ============================================================================

    event BotConfigured(
        address indexed user,
        uint256 maxBetPerMarket,
        uint256 dailyBudget,
        uint256 weeklyBudget,
        uint256 minConfidence
    );
    
    event BotActivated(address indexed user, uint256 timestamp);
    event BotDeactivated(address indexed user, uint256 timestamp);
    
    event BetRecorded(
        address indexed user,
        string marketId,
        uint256 amount,
        uint256 timestamp
    );
    
    event EmergencyStopTriggered(
        address indexed user,
        string reason,
        uint256 timestamp
    );
    
    event BudgetReset(
        address indexed user,
        string resetType,
        uint256 timestamp
    );

    // ============================================================================
    // CONSTRUCTOR
    // ============================================================================

    constructor() Ownable(msg.sender) {}

    // ============================================================================
    // CONFIGURATION
    // ============================================================================

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
        require(_weeklyBudget >= _dailyBudget, "Weekly budget too low");
        require(_maxBetsPerDay > 0 && _maxBetsPerDay <= 50, "Max bets 1-50");
        require(_cooldownMinutes >= 5 && _cooldownMinutes <= 120, "Cooldown 5-120 min");
        require(_allowedCategories.length > 0, "Need at least 1 category");

        UserBotConfig storage config = botConfigs[msg.sender];
        
        config.maxBetPerMarket = _maxBetPerMarket;
        config.dailyBudget = _dailyBudget;
        config.weeklyBudget = _weeklyBudget;
        config.minConfidence = _minConfidence;
        config.maxBetsPerDay = _maxBetsPerDay;
        config.cooldownMinutes = _cooldownMinutes;
        config.emergencyStopLoss = _emergencyStopLoss;
        
        // Reset counters if first time
        if (config.lastResetDay == 0) {
            config.lastResetDay = block.timestamp / 1 days;
            config.lastResetWeek = block.timestamp / 1 weeks;
        }

        // Update categories
        delete allowedCategories[msg.sender];
        for (uint i = 0; i < _allowedCategories.length; i++) {
            allowedCategories[msg.sender].push(_allowedCategories[i]);
        }

        emit BotConfigured(
            msg.sender,
            _maxBetPerMarket,
            _dailyBudget,
            _weeklyBudget,
            _minConfidence
        );
    }

    // ============================================================================
    // BOT CONTROL
    // ============================================================================

    function activateBot() external {
        require(botConfigs[msg.sender].maxBetPerMarket > 0, "Configure first");
        require(!emergencyStop[msg.sender], "Emergency stop active");
        
        botConfigs[msg.sender].isActive = true;
        
        emit BotActivated(msg.sender, block.timestamp);
    }

    function deactivateBot() external {
        botConfigs[msg.sender].isActive = false;
        
        emit BotDeactivated(msg.sender, block.timestamp);
    }

    function triggerEmergencyStop(string memory reason) external {
        emergencyStop[msg.sender] = true;
        botConfigs[msg.sender].isActive = false;
        
        emit EmergencyStopTriggered(msg.sender, reason, block.timestamp);
    }

    function clearEmergencyStop() external {
        emergencyStop[msg.sender] = false;
    }

    // ============================================================================
    // BET VALIDATION
    // ============================================================================

    function canPlaceBet(
        address user,
        string memory marketId,
        string memory category,
        uint256 betAmount,
        uint256 aiConfidence
    ) external view returns (bool, string memory) {
        UserBotConfig memory config = botConfigs[user];

        // Check 1: Bot active?
        if (!config.isActive) {
            return (false, "Bot not active");
        }

        // Check 2: Emergency stop?
        if (emergencyStop[user]) {
            return (false, "Emergency stop triggered");
        }

        // Check 3: Already bet on this market?
        if (hasPlacedBet[user][marketId]) {
            return (false, "Already bet on this market");
        }

        // Check 4: Category allowed?
        bool categoryAllowed = false;
        string[] memory categories = allowedCategories[user];
        for (uint i = 0; i < categories.length; i++) {
            if (keccak256(bytes(categories[i])) == keccak256(bytes(category))) {
                categoryAllowed = true;
                break;
            }
        }
        if (!categoryAllowed) {
            return (false, "Category not allowed");
        }

        // Check 5: Confidence high enough?
        if (aiConfidence < config.minConfidence) {
            return (false, "Confidence below threshold");
        }

        // Check 6: Bet amount within limit?
        if (betAmount > config.maxBetPerMarket) {
            return (false, "Exceeds max bet per market");
        }

        // Check 7: Reset daily/weekly if needed
        uint256 currentDay = block.timestamp / 1 days;
        uint256 currentWeek = block.timestamp / 1 weeks;

        uint256 dailySpent = config.dailySpent;
        uint256 weeklySpent = config.weeklySpent;
        uint256 betsToday = config.betsToday;

        if (currentDay > config.lastResetDay) {
            dailySpent = 0;
            betsToday = 0;
        }
        if (currentWeek > config.lastResetWeek) {
            weeklySpent = 0;
        }

        // Check 8: Daily budget?
        if (dailySpent + betAmount > config.dailyBudget) {
            return (false, "Daily budget exceeded");
        }

        // Check 9: Weekly budget?
        if (weeklySpent + betAmount > config.weeklyBudget) {
            return (false, "Weekly budget exceeded");
        }

        // Check 10: Cooldown?
        if (block.timestamp < config.lastBetTimestamp + (config.cooldownMinutes * 60)) {
            return (false, "Cooldown active");
        }

        // Check 11: Max bets per day?
        if (betsToday >= config.maxBetsPerDay) {
            return (false, "Max bets per day reached");
        }

        // Check 12: Stop loss?
        if (config.totalLosses >= config.emergencyStopLoss) {
            return (false, "Stop loss triggered");
        }

        return (true, "All checks passed");
    }

    // ============================================================================
    // BET RECORDING
    // ============================================================================

    function recordBet(
        string memory marketId,
        string memory category,
        uint256 amount,
        uint256 aiConfidence
    ) external nonReentrant {
        (bool canBet, string memory reason) = this.canPlaceBet(
            msg.sender,
            marketId,
            category,
            amount,
            aiConfidence
        );
        
        require(canBet, reason);

        UserBotConfig storage config = botConfigs[msg.sender];

        // Reset counters if needed
        uint256 currentDay = block.timestamp / 1 days;
        uint256 currentWeek = block.timestamp / 1 weeks;

        if (currentDay > config.lastResetDay) {
            config.dailySpent = 0;
            config.betsToday = 0;
            config.lastResetDay = currentDay;
            emit BudgetReset(msg.sender, "daily", block.timestamp);
        }
        if (currentWeek > config.lastResetWeek) {
            config.weeklySpent = 0;
            config.lastResetWeek = currentWeek;
            emit BudgetReset(msg.sender, "weekly", block.timestamp);
        }

        // Update counters
        config.dailySpent += amount;
        config.weeklySpent += amount;
        config.betsToday += 1;
        config.lastBetTimestamp = block.timestamp;
        
        // Mark market as bet on
        hasPlacedBet[msg.sender][marketId] = true;

        emit BetRecorded(msg.sender, marketId, amount, block.timestamp);
    }

    function recordLoss(uint256 lossAmount) external {
        UserBotConfig storage config = botConfigs[msg.sender];
        config.totalLosses += lossAmount;

        // Auto-trigger emergency stop if stop loss reached
        if (config.totalLosses >= config.emergencyStopLoss) {
            emergencyStop[msg.sender] = true;
            config.isActive = false;
            emit EmergencyStopTriggered(
                msg.sender,
                "Stop loss reached",
                block.timestamp
            );
        }
    }

    // ============================================================================
    // GETTERS
    // ============================================================================

    function getBotConfig(address user) external view returns (
        bool isActive,
        uint256 maxBetPerMarket,
        uint256 dailyBudget,
        uint256 weeklyBudget,
        uint256 minConfidence,
        uint256 maxBetsPerDay,
        uint256 cooldownMinutes,
        uint256 emergencyStopLoss
    ) {
        UserBotConfig memory config = botConfigs[user];
        return (
            config.isActive,
            config.maxBetPerMarket,
            config.dailyBudget,
            config.weeklyBudget,
            config.minConfidence,
            config.maxBetsPerDay,
            config.cooldownMinutes,
            config.emergencyStopLoss
        );
    }

    function getBotStats(address user) external view returns (
        uint256 dailySpent,
        uint256 weeklySpent,
        uint256 totalLosses,
        uint256 betsToday,
        uint256 lastBetTimestamp,
        bool emergencyStopActive
    ) {
        UserBotConfig memory config = botConfigs[user];
        
        // Adjust for resets
        uint256 currentDay = block.timestamp / 1 days;
        uint256 currentWeek = block.timestamp / 1 weeks;

        uint256 _dailySpent = config.dailySpent;
        uint256 _weeklySpent = config.weeklySpent;
        uint256 _betsToday = config.betsToday;

        if (currentDay > config.lastResetDay) {
            _dailySpent = 0;
            _betsToday = 0;
        }
        if (currentWeek > config.lastResetWeek) {
            _weeklySpent = 0;
        }

        return (
            _dailySpent,
            _weeklySpent,
            config.totalLosses,
            _betsToday,
            config.lastBetTimestamp,
            emergencyStop[user]
        );
    }

    function getAllowedCategories(address user) external view returns (string[] memory) {
        return allowedCategories[user];
    }

    function isBotActive(address user) external view returns (bool) {
        return botConfigs[user].isActive && !emergencyStop[user];
    }
}
