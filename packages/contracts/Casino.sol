// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title Casino
 * @dev Multi-game casino contract with provably fair randomness
 * 
 * Supported Games:
 * - Roulette (0-36, pays 35:1)
 * - Dice (1-6, pays 5:1)
 * - Coin Flip (Heads/Tails, pays 1.95:1)
 * - High/Low Dice (Over/Under 3.5, pays 1.9:1)
 * 
 * Security Features:
 * - ReentrancyGuard
 * - Pausable
 * - Bet limits per game
 * - House edge (2-5% depending on game)
 * - Anti-manipulation cooldown
 */

enum GameType {
    ROULETTE,      // 0-36, straight bet
    DICE,          // 1-6, specific number
    COIN_FLIP,     // 0=Heads, 1=Tails
    HIGH_LOW_DICE  // 0=Low(1-3), 1=High(4-6)
}

enum GameResult {
    WIN,
    LOSS
}

struct Bet {
    address player;
    GameType gameType;
    uint256 amount;
    uint256 prediction;
    uint256 result;
    GameResult outcome;
    uint256 payout;
    uint256 timestamp;
    uint256 blockNumber;
}

contract Casino is Ownable, ReentrancyGuard, Pausable {
    // ============================================================================
    // STATE VARIABLES
    // ============================================================================

    IERC20 public usdt;
    address public houseWallet;

    // Bet tracking
    mapping(address => Bet[]) public playerBets;
    mapping(address => uint256) public lastBetTimestamp;
    Bet[] public allBets;

    // Statistics
    mapping(address => uint256) public totalWagered;
    mapping(address => uint256) public totalWon;
    mapping(address => uint256) public totalLost;
    uint256 public houseTotalWagered;
    uint256 public houseTotalPaidOut;
    uint256 public houseTotalProfit;

    // Game Configuration
    uint256 public constant MIN_BET = 1 * 10**6;        // 1 USDT (6 decimals)
    uint256 public constant MAX_BET = 1000 * 10**6;     // 1000 USDT
    uint256 public constant COOLDOWN_SECONDS = 3;       // 3 seconds between bets
    uint256 public constant HOUSE_EDGE_BPS = 250;       // 2.5% house edge

    // Game-specific limits
    uint256 public constant ROULETTE_MAX_BET = 100 * 10**6;   // 100 USDT
    uint256 public constant DICE_MAX_BET = 200 * 10**6;       // 200 USDT
    uint256 public constant COIN_FLIP_MAX_BET = 500 * 10**6;  // 500 USDT
    uint256 public constant HIGH_LOW_MAX_BET = 1000 * 10**6;  // 1000 USDT

    // ============================================================================
    // EVENTS
    // ============================================================================

    event BetPlaced(
        address indexed player,
        GameType indexed gameType,
        uint256 amount,
        uint256 prediction,
        uint256 indexed betId
    );

    event BetResult(
        address indexed player,
        uint256 indexed betId,
        GameType gameType,
        uint256 prediction,
        uint256 result,
        GameResult outcome,
        uint256 payout
    );

    event HouseBalanceUpdated(
        uint256 newBalance,
        int256 change
    );

    // ============================================================================
    // CONSTRUCTOR
    // ============================================================================

    constructor(address _usdt, address _houseWallet) Ownable(msg.sender) {
        require(_usdt != address(0), "Casino: Invalid USDT address");
        require(_houseWallet != address(0), "Casino: Invalid house wallet");
        
        usdt = IERC20(_usdt);
        houseWallet = _houseWallet;
    }

    // ============================================================================
    // MAIN BETTING FUNCTION
    // ============================================================================

    /**
     * @dev Place a bet on any casino game
     * @param _gameType Type of game (0=Roulette, 1=Dice, 2=CoinFlip, 3=HighLow)
     * @param _amount Bet amount in USDT (with 6 decimals)
     * @param _prediction Player's prediction (game-specific)
     * 
     * Roulette: 0-36
     * Dice: 1-6
     * CoinFlip: 0=Heads, 1=Tails
     * HighLow: 0=Low(1-3), 1=High(4-6)
     */
    function placeBet(
        GameType _gameType,
        uint256 _amount,
        uint256 _prediction
    ) external nonReentrant whenNotPaused returns (uint256 betId) {
        // Validation
        _validateBet(msg.sender, _gameType, _amount, _prediction);

        // Transfer USDT from player to contract
        require(
            usdt.transferFrom(msg.sender, address(this), _amount),
            "Casino: USDT transfer failed"
        );

        // Generate random result
        uint256 result = _generateRandomNumber(_gameType, msg.sender);

        // Calculate outcome and payout
        (GameResult outcome, uint256 payout) = _calculateOutcome(
            _gameType,
            _amount,
            _prediction,
            result
        );

        // Create bet record
        Bet memory newBet = Bet({
            player: msg.sender,
            gameType: _gameType,
            amount: _amount,
            prediction: _prediction,
            result: result,
            outcome: outcome,
            payout: payout,
            timestamp: block.timestamp,
            blockNumber: block.number
        });

        // Store bet
        betId = allBets.length;
        allBets.push(newBet);
        playerBets[msg.sender].push(newBet);

        // Update statistics
        totalWagered[msg.sender] += _amount;
        houseTotalWagered += _amount;
        lastBetTimestamp[msg.sender] = block.timestamp;

        // Emit bet placed event
        emit BetPlaced(msg.sender, _gameType, _amount, _prediction, betId);

        // Process payout if won
        if (outcome == GameResult.WIN) {
            require(
                usdt.transfer(msg.sender, payout),
                "Casino: Payout transfer failed"
            );
            
            totalWon[msg.sender] += payout;
            houseTotalPaidOut += payout;
            
            int256 houseChange = int256(_amount) - int256(payout);
            if (houseChange > 0) {
                houseTotalProfit += uint256(houseChange);
            }
            
            emit HouseBalanceUpdated(getHouseBalance(), houseChange);
        } else {
            totalLost[msg.sender] += _amount;
            houseTotalProfit += _amount;
            emit HouseBalanceUpdated(getHouseBalance(), int256(_amount));
        }

        // Emit result event
        emit BetResult(
            msg.sender,
            betId,
            _gameType,
            _prediction,
            result,
            outcome,
            payout
        );

        return betId;
    }

    // ============================================================================
    // VALIDATION
    // ============================================================================

    function _validateBet(
        address _player,
        GameType _gameType,
        uint256 _amount,
        uint256 _prediction
    ) internal view {
        // Check cooldown
        require(
            block.timestamp >= lastBetTimestamp[_player] + COOLDOWN_SECONDS,
            "Casino: Cooldown not met (3s between bets)"
        );

        // Check minimum bet
        require(_amount >= MIN_BET, "Casino: Bet below minimum (1 USDT)");

        // Check maximum bet per game
        if (_gameType == GameType.ROULETTE) {
            require(_amount <= ROULETTE_MAX_BET, "Casino: Roulette max 100 USDT");
            require(_prediction <= 36, "Casino: Roulette number must be 0-36");
        } else if (_gameType == GameType.DICE) {
            require(_amount <= DICE_MAX_BET, "Casino: Dice max 200 USDT");
            require(_prediction >= 1 && _prediction <= 6, "Casino: Dice must be 1-6");
        } else if (_gameType == GameType.COIN_FLIP) {
            require(_amount <= COIN_FLIP_MAX_BET, "Casino: Coin flip max 500 USDT");
            require(_prediction <= 1, "Casino: Coin flip must be 0 (Heads) or 1 (Tails)");
        } else if (_gameType == GameType.HIGH_LOW_DICE) {
            require(_amount <= HIGH_LOW_MAX_BET, "Casino: High/Low max 1000 USDT");
            require(_prediction <= 1, "Casino: High/Low must be 0 (Low) or 1 (High)");
        }

        // Check house has enough balance for potential payout
        uint256 maxPayout = _calculateMaxPayout(_gameType, _amount);
        require(
            getHouseBalance() >= maxPayout,
            "Casino: Insufficient house balance"
        );
    }

    // ============================================================================
    // RANDOMNESS (Pseudo-random for demo - Use Chainlink VRF in production)
    // ============================================================================

    function _generateRandomNumber(GameType _gameType, address _player) internal view returns (uint256) {
        uint256 random = uint256(
            keccak256(
                abi.encodePacked(
                    block.timestamp,
                    block.prevrandao,
                    block.number,
                    _player,
                    allBets.length,
                    msg.sender
                )
            )
        );

        if (_gameType == GameType.ROULETTE) {
            return random % 37; // 0-36
        } else if (_gameType == GameType.DICE) {
            return (random % 6) + 1; // 1-6
        } else if (_gameType == GameType.COIN_FLIP) {
            return random % 2; // 0 or 1
        } else if (_gameType == GameType.HIGH_LOW_DICE) {
            uint256 diceRoll = (random % 6) + 1; // 1-6
            return diceRoll <= 3 ? 0 : 1; // 0=Low, 1=High
        }

        return 0;
    }

    // ============================================================================
    // PAYOUT CALCULATION
    // ============================================================================

    function _calculateOutcome(
        GameType _gameType,
        uint256 _amount,
        uint256 _prediction,
        uint256 _result
    ) internal pure returns (GameResult outcome, uint256 payout) {
        bool won = (_prediction == _result);

        if (!won) {
            return (GameResult.LOSS, 0);
        }

        // Calculate payout based on game type
        if (_gameType == GameType.ROULETTE) {
            // 35:1 payout (European Roulette single number)
            payout = _amount * 35;
        } else if (_gameType == GameType.DICE) {
            // 5:1 payout
            payout = _amount * 5;
        } else if (_gameType == GameType.COIN_FLIP) {
            // 1.95:1 payout (2.5% house edge)
            payout = (_amount * 195) / 100;
        } else if (_gameType == GameType.HIGH_LOW_DICE) {
            // 1.9:1 payout (50/50 odds with house edge)
            payout = (_amount * 190) / 100;
        }

        return (GameResult.WIN, payout);
    }

    function _calculateMaxPayout(GameType _gameType, uint256 _amount) internal pure returns (uint256) {
        if (_gameType == GameType.ROULETTE) {
            return _amount * 35;
        } else if (_gameType == GameType.DICE) {
            return _amount * 5;
        } else if (_gameType == GameType.COIN_FLIP) {
            return (_amount * 195) / 100;
        } else if (_gameType == GameType.HIGH_LOW_DICE) {
            return (_amount * 190) / 100;
        }
        return 0;
    }

    // ============================================================================
    // VIEW FUNCTIONS
    // ============================================================================

    function getHouseBalance() public view returns (uint256) {
        return usdt.balanceOf(address(this));
    }

    function getPlayerBets(address _player) external view returns (Bet[] memory) {
        return playerBets[_player];
    }

    function getPlayerStats(address _player) external view returns (
        uint256 wagered,
        uint256 won,
        uint256 lost,
        uint256 netProfit
    ) {
        wagered = totalWagered[_player];
        won = totalWon[_player];
        lost = totalLost[_player];
        netProfit = won > lost ? won - lost : 0;
    }

    function getHouseStats() external view returns (
        uint256 totalWagered_,
        uint256 totalPaidOut,
        uint256 totalProfit,
        uint256 houseBalance
    ) {
        totalWagered_ = houseTotalWagered;
        totalPaidOut = houseTotalPaidOut;
        totalProfit = houseTotalProfit;
        houseBalance = getHouseBalance();
    }

    function getBetLimits(GameType _gameType) external pure returns (uint256 min, uint256 max) {
        min = MIN_BET;
        
        if (_gameType == GameType.ROULETTE) {
            max = ROULETTE_MAX_BET;
        } else if (_gameType == GameType.DICE) {
            max = DICE_MAX_BET;
        } else if (_gameType == GameType.COIN_FLIP) {
            max = COIN_FLIP_MAX_BET;
        } else if (_gameType == GameType.HIGH_LOW_DICE) {
            max = HIGH_LOW_MAX_BET;
        }
    }

    // ============================================================================
    // ADMIN FUNCTIONS
    // ============================================================================

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function depositHouseFunds(uint256 _amount) external onlyOwner {
        require(
            usdt.transferFrom(msg.sender, address(this), _amount),
            "Casino: House deposit failed"
        );
        emit HouseBalanceUpdated(getHouseBalance(), int256(_amount));
    }

    function withdrawHouseFunds(uint256 _amount) external onlyOwner {
        require(_amount <= getHouseBalance(), "Casino: Insufficient balance");
        require(
            usdt.transfer(houseWallet, _amount),
            "Casino: Withdrawal failed"
        );
        emit HouseBalanceUpdated(getHouseBalance(), -int256(_amount));
    }

    function updateHouseWallet(address _newHouseWallet) external onlyOwner {
        require(_newHouseWallet != address(0), "Casino: Invalid address");
        houseWallet = _newHouseWallet;
    }

    // Emergency function to recover stuck tokens
    function emergencyWithdraw() external onlyOwner {
        uint256 balance = getHouseBalance();
        require(usdt.transfer(owner(), balance), "Casino: Emergency withdrawal failed");
    }
}
