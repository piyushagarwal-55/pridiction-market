const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");

describe("MarketManager", function () {
    async function deployContracts() {
        const [owner, user] = await ethers.getSigners();

        const PositionToken = await ethers.getContractFactory("PositionToken");
        const positionToken = await PositionToken.deploy();
        await positionToken.waitForDeployment();

        const MarketManager = await ethers.getContractFactory("MarketManager");
        const marketManager = await MarketManager.deploy(await positionToken.getAddress());
        await marketManager.waitForDeployment();

        return { marketManager, positionToken, owner, user };
    }

    describe("Market Creation", function () {
        it("Should create market", async function () {
            const { marketManager } = await loadFixture(deployContracts);

            const marketId = "test-001";
            await marketManager.createMarket(
                marketId,
                "soccer",
                "Next goal",
                ethers.parseEther("1.0"),
                Math.floor(Date.now() / 1000) + 3600,
                ethers.ZeroAddress
            );

            const market = await marketManager.markets(marketId);
            expect(market.id).to.equal(marketId);
            expect(market.sport).to.equal("soccer");
        });
    });

    describe("Position Opening", function () {
        it("Should open position", async function () {
            const { marketManager, positionToken, user } = await loadFixture(deployContracts);

            const marketId = "test-position";
            await marketManager.createMarket(
                marketId,
                "soccer",
                "Test market",
                ethers.parseEther("1.0"),
                Math.floor(Date.now() / 1000) + 3600,
                ethers.ZeroAddress
            );

            const stake = ethers.parseEther("0.01");
            const odds = ethers.parseEther("1.9");
            const tx = await marketManager.connect(user).openPosition(
                "quote-123",
                marketId,
                "home",
                stake,
                odds,
                { value: ethers.parseEther("0.02038") }
            );

            await expect(tx).to.emit(marketManager, "PositionOpened");

            expect(await positionToken.balanceOf(user.address, 1)).to.equal(1);
        });
    });
});