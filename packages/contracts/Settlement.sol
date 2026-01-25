// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@chainlink/contracts/src/v0.8/shared/access/ConfirmedOwner.sol";
import "./MarketManager.sol";

contract Settlement is ConfirmedOwner {
    
    MarketManager public immutable marketManager;
    
    mapping(bytes32 => string) public requestToMarketId;
    mapping(string => bytes32) public marketRequests;
    
    uint256 private oracleUpdateFee;
    
    event SettlementRequested(bytes32 indexed requestId, string marketId);
    event MarketSettled(bytes32 indexed requestId, string marketId, string result);
    
    constructor(
        address _marketManager
    ) ConfirmedOwner(msg.sender) {
        marketManager = MarketManager(_marketManager);
        oracleUpdateFee = 0.2 * 10**18; // 0.2 LINK
    }
    
    function requestSettlement(
        string memory _marketId
    ) external returns (bytes32 requestId) {
        // Generate a unique request ID
        requestId = keccak256(abi.encodePacked(_marketId, block.timestamp, msg.sender));
        
        requestToMarketId[requestId] = _marketId;
        marketRequests[_marketId] = requestId;
        
        emit SettlementRequested(requestId, _marketId);
        return requestId;
    }
    
    function fulfill(bytes32 _requestId, string memory _result) external onlyOwner {
        string memory marketId = requestToMarketId[_requestId];
        require(bytes(marketId).length > 0, "Invalid request ID");
        
        marketManager.settleMarket(marketId, _result);
        emit MarketSettled(_requestId, marketId, _result);
    }
    
    function updateFee(uint256 _fee) external onlyOwner {
        oracleUpdateFee = _fee;
    }
}