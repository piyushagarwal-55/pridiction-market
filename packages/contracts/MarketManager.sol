// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./PositionToken.sol";
import "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";

contract MarketManager is ERC1155, Ownable {
    PositionToken public immutable positionToken;
    
    struct Market {
        string id;
        string sport;
        string description;
        uint256 maxStake;
        uint256 expiresAt;
        bool isSettled;
        string result; // "home", "away"
        address oracle;
    }
    
    mapping(string => Market) public markets;
    mapping(string => uint256) public marketExposure; // marketId => total exposure
    string[] public activeMarkets;
    
    uint256 public constant HOUSE_EDGE_BPS = 200; // 2%
    uint256 public constant MIN_STAKE = 0.001 ether;
    
    event MarketCreated(string indexed marketId, string sport, uint256 expiresAt);
    event PositionOpened(
        string indexed marketId, 
        address indexed user, 
        string side, 
        uint256 stake,
        uint256 odds
    );
    event MarketSettled(string indexed marketId, string result);
    
    constructor(address _positionToken) 
        ERC1155("sportsbook://{marketId}/{positionId}")
        Ownable(msg.sender)
    {
        positionToken = PositionToken(_positionToken);
    }
    
    function createMarket(
        string memory _marketId,
        string memory _sport,
        string memory _description,
        uint256 _maxStake,
        uint256 _expiresAt,
        address _oracle
    ) external onlyOwner {
        require(_expiresAt > block.timestamp + 60, "Invalid expiry");
        require(bytes(_marketId).length > 0, "Invalid market ID");
        require(markets[_marketId].expiresAt == 0, "Market exists");
        
        markets[_marketId] = Market({
            id: _marketId,
            sport: _sport,
            description: _description,
            maxStake: _maxStake,
            expiresAt: _expiresAt,
            isSettled: false,
            result: "",
            oracle: _oracle
        });
        
        activeMarkets.push(_marketId);
        emit MarketCreated(_marketId, _sport, _expiresAt);
    }
    
    function openPosition(
        string memory _quoteId,
        string memory _marketId,
        string memory _side,
        uint256 _stake,
        uint256 _odds
    ) external payable {
        Market storage market = markets[_marketId];
        require(!market.isSettled, "Market settled");
        require(block.timestamp < market.expiresAt, "Market expired");
        require(_stake >= MIN_STAKE, "Stake too small");
        require(_stake <= market.maxStake, "Stake too large");
        require(bytes(_side).length > 0, "Invalid side");
        
        // Calculate price with house edge
        uint256 priceWithEdge = (_stake * _odds * (10**18 + HOUSE_EDGE_BPS)) / 10**18;
        require(msg.value >= priceWithEdge, "Insufficient payment");
        
        // Refund excess
        if (msg.value > priceWithEdge) {
            payable(msg.sender).transfer(msg.value - priceWithEdge);
        }
        
        // Track exposure
        marketExposure[_marketId] += _stake;
        
        // Mint position NFT
        uint256 tokenId = uint256(keccak256(abi.encodePacked(_quoteId, msg.sender, block.timestamp)));
        bytes memory positionData = abi.encode(_marketId, _side, _stake, _odds);
        positionToken.mint(msg.sender, tokenId, 1, positionData);
        
        emit PositionOpened(_marketId, msg.sender, _side, _stake, _odds);
    }
    
    function settleMarket(string memory _marketId, string memory _result) external onlyOwner {
        Market storage market = markets[_marketId];
        require(!market.isSettled, "Already settled");
        require(block.timestamp >= market.expiresAt, "Market not expired");
        
        market.isSettled = true;
        market.result = _result;
        
        emit MarketSettled(_marketId, _result);
    }
    
    function getActiveMarkets() external view returns (string[] memory) {
        return activeMarkets;
    }
    
    function getMarket(string memory _marketId) external view returns (Market memory) {
        return markets[_marketId];
    }
}
