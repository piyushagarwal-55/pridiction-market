// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

contract PositionToken is ERC1155, Ownable, ReentrancyGuard, Pausable {
    mapping(uint256 => bool) public settled;
    mapping(uint256 => uint256) public payouts; // tokenId => payout per token
    
    event PositionRedeemed(uint256 indexed tokenId, address indexed holder, uint256 payout);
    
    constructor() 
        ERC1155("sportsbook://{marketId}/{positionId}")
        Ownable(msg.sender)
    {}
    
    function mint(
        address to,
        uint256 id,
        uint256 amount,
        bytes memory data
    ) external onlyOwner {
        _mint(to, id, amount, data);
    }
    
    function redeem(uint256 id, uint256 amount) external whenNotPaused nonReentrant {
        require(balanceOf(msg.sender, id) >= amount, "Insufficient balance");
        require(settled[id], "Position not settled");
        
        uint256 payout = (payouts[id] * amount);
        require(payout > 0, "No payout available");
        
        _burn(msg.sender, id, amount);
        payable(msg.sender).transfer(payout);
        
        emit PositionRedeemed(id, msg.sender, payout);
    }
    
    function settlePositionBatch(
        uint256[] calldata tokenIds,
        uint256[] calldata payoutsWei
    ) external onlyOwner {
        require(tokenIds.length == payoutsWei.length, "Array length mismatch");
        
        for (uint256 i = 0; i < tokenIds.length; i++) {
            settled[tokenIds[i]] = true;
            payouts[tokenIds[i]] = payoutsWei[i];
        }
    }
    
    function _update(
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory values
    ) internal virtual override {
        // Lock transfers until settled
        for (uint256 i = 0; i < ids.length; i++) {
            require(settled[ids[i]] || from == address(0), "Position locked");
        }
        super._update(from, to, ids, values);
    }
}