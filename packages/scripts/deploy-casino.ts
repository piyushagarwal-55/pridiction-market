/**
 * Deploy Casino Contract
 * 
 * Deploys the Casino contract with MockUSDT integration
 * 
 * Usage:
 * npx hardhat run scripts/deploy-casino.ts --network monad-testnet
 */

const hre = require("hardhat");

async function main() {
  const { ethers } = hre;
  console.log("\n🎰 Deploying Casino Contract...\n");

  const [deployer] = await ethers.getSigners();
  console.log("📝 Deployer address:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Deployer balance:", ethers.formatEther(balance), "ETH\n");

  // Get contract addresses
  const USDT_ADDRESS = process.env.NEXT_PUBLIC_USDT_ADDRESS || "0x8c34Bb925340901683C48BDbDc2D211B9C7c6c21";
  const HOUSE_WALLET = process.env.HOUSE_WALLET_ADDRESS || deployer.address;

  console.log("🔗 Using USDT address:", USDT_ADDRESS);
  console.log("🏠 Using house wallet:", HOUSE_WALLET);

  // Deploy Casino
  console.log("\n📦 Deploying Casino contract...");
  const Casino = await ethers.getContractFactory("Casino");
  const casino = await Casino.deploy(USDT_ADDRESS, HOUSE_WALLET);

  await casino.waitForDeployment();
  const casinoAddress = await casino.getAddress();

  console.log("✅ Casino deployed to:", casinoAddress);

  // Deposit initial house funds (optional)
  console.log("\n💰 Depositing initial house funds...");
  try {
    const USDT = await ethers.getContractAt("MockUSDT", USDT_ADDRESS);
    
    // Mint USDT to deployer for house deposit
    const depositAmount = ethers.parseUnits("10000", 6); // 10,000 USDT
    console.log("🪙 Minting", ethers.formatUnits(depositAmount, 6), "USDT to deployer...");
    const mintTx = await USDT.mint(deployer.address, depositAmount);
    await mintTx.wait();
    console.log("✅ USDT minted");

    // Approve casino to spend
    console.log("🔐 Approving casino to spend USDT...");
    const approveTx = await USDT.approve(casinoAddress, depositAmount);
    await approveTx.wait();
    console.log("✅ Approval complete");

    // Deposit to casino
    console.log("💸 Depositing to casino...");
    const depositTx = await casino.depositHouseFunds(depositAmount);
    await depositTx.wait();
    console.log("✅ House funds deposited");

    const houseBalance = await USDT.balanceOf(casinoAddress);
    console.log("🏦 Casino balance:", ethers.formatUnits(houseBalance, 6), "USDT");
  } catch (error) {
    console.log("⚠️  House funding skipped (optional):", (error as Error).message);
  }

  // Get game limits
  console.log("\n🎮 Casino Game Limits:");
  const games = ["Roulette", "Dice", "Coin Flip", "High/Low Dice"];
  for (let i = 0; i < 4; i++) {
    const limits = await casino.getBetLimits(i);
    console.log(`  ${games[i]}:`, 
      ethers.formatUnits(limits.min, 6), "to",
      ethers.formatUnits(limits.max, 6), "USDT"
    );
  }

  // Verification info
  console.log("\n📋 Deployment Summary:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("Casino Contract:    ", casinoAddress);
  console.log("USDT Token:         ", USDT_ADDRESS);
  console.log("House Wallet:       ", HOUSE_WALLET);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  console.log("📝 Add to .env.production:");
  console.log(`NEXT_PUBLIC_CASINO_ADDRESS=${casinoAddress}\n`);

  console.log("🔍 Verify on explorer:");
  console.log(`https://testnet.monadexplorer.com/address/${casinoAddress}\n`);

  console.log("✅ Casino deployment complete!\n");

  console.log("🎯 Next steps:");
  console.log("1. Add casino address to .env.production");
  console.log("2. Update constants.ts with the new address");
  console.log("3. Test betting on frontend: http://localhost:3000/casino");
  console.log("4. Users need to approve USDT for casino contract\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
