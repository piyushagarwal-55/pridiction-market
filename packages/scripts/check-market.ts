import hre from "hardhat";
const { ethers } = hre;

async function main() {
  console.log("📊 Checking market state...\n");

  const predictionMarketAddress = "0x7d42BDDc69f58E5C6FF1852Afd6B4c2303227D7B";
  const PredictionMarket = await ethers.getContractFactory("PredictionMarket");
  const market = PredictionMarket.attach(predictionMarketAddress);

  const [signer] = await ethers.getSigners();
  console.log("Checking from address:", signer.address);

  // Get market data
  const marketData = await market.market();
  console.log("\n📈 Market Data:");
  console.log("   ID:", marketData.id);
  console.log("   Question:", marketData.question);
  console.log("   Yes Pool:", ethers.formatUnits(marketData.yesPool, 6), "USDT");
  console.log("   No Pool:", ethers.formatUnits(marketData.noPool, 6), "USDT");
  console.log("   Total Pool:", ethers.formatUnits(marketData.yesPool + marketData.noPool, 6), "USDT");
  console.log("   Status:", marketData.status.toString());

  // Get wallet bet data
  const walletTotalBets = await market.getWalletTotalBets(signer.address);
  console.log("\n💰 Your Wallet:");
  console.log("   Total Bets:", ethers.formatUnits(walletTotalBets, 6), "USDT");
  console.log("   Bet Count:", (await market.betCountPerWallet(signer.address)).toString());

  // Calculate pool cap
  const totalPool = marketData.yesPool + marketData.noPool;
  const POOL_CAP_PERCENT = 10n;
  const MAX_BET = 5000n * 10n**6n;
  
  const maxWalletExposure = totalPool > 0n
    ? (totalPool * POOL_CAP_PERCENT) / 100n
    : MAX_BET * 10n;

  console.log("\n🔒 Pool Cap Limits:");
  console.log("   Max Wallet Exposure:", ethers.formatUnits(maxWalletExposure, 6), "USDT");
  console.log("   Your Current Exposure:", ethers.formatUnits(walletTotalBets, 6), "USDT");
  console.log("   Remaining Capacity:", ethers.formatUnits(maxWalletExposure - walletTotalBets, 6), "USDT");

  // Get all bets
  const userBetsData = await market.getUserBets(signer.address);
  console.log("\n📜 Your Bet History:");
  if (userBetsData.length === 0) {
    console.log("   No bets placed yet");
  } else {
    userBetsData.forEach((bet: any, i: number) => {
      console.log(`   Bet ${i + 1}:`, {
        choice: bet.choice === 0n ? "YES" : "NO",
        amount: ethers.formatUnits(bet.amount, 6) + " USDT",
        timestamp: new Date(Number(bet.timestamp) * 1000).toLocaleString()
      });
    });
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  });
