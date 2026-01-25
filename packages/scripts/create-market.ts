import hre from "hardhat";
const { ethers } = hre;

async function main() {
  console.log("🎯 Creating prediction market on-chain...\n");

  // Get the deployed contract address from env
  const predictionMarketAddress = process.env.PREDICTION_MARKET_ADDRESS || "0x7d42BDDc69f58E5C6FF1852Afd6B4c2303227D7B";
  
  console.log("📍 PredictionMarket address:", predictionMarketAddress);

  // Get the contract
  const PredictionMarket = await ethers.getContractFactory("PredictionMarket");
  const market = PredictionMarket.attach(predictionMarketAddress);

  // Check if market already exists
  try {
    const marketExists = await market.marketExists();
    if (marketExists) {
      console.log("⚠️  Market already exists on-chain!");
      const existingMarket = await market.market();
      console.log("\n📊 Existing Market:");
      console.log("   ID:", existingMarket.id);
      console.log("   Question:", existingMarket.question);
      console.log("   Yes Pool:", ethers.formatUnits(existingMarket.yesPool, 6), "USDT");
      console.log("   No Pool:", ethers.formatUnits(existingMarket.noPool, 6), "USDT");
      console.log("   Status:", existingMarket.status);
      return;
    }
  } catch (error) {
    console.log("📝 No market exists yet, creating...");
  }

  // Market details
  const marketId = "eden-haus-hackathon";
  const question = "Will Eden Haus win the Cronos x402 Hackathon?";
  const endTime = Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60); // 30 days from now

  console.log("\n📝 Market Details:");
  console.log("   ID:", marketId);
  console.log("   Question:", question);
  console.log("   End Time:", new Date(endTime * 1000).toLocaleString());

  // Create the market
  console.log("\n⏳ Creating market on-chain...");
  const tx = await market.createMarket(marketId, question, endTime);
  
  console.log("📤 Transaction sent:", tx.hash);
  console.log("⏳ Waiting for confirmation...");
  
  const receipt = await tx.wait();
  
  console.log("✅ Market created successfully!");
  console.log("   Block:", receipt.blockNumber);
  console.log("   Gas used:", receipt.gasUsed.toString());

  // Verify the market was created
  const createdMarket = await market.market();
  console.log("\n✅ Verified Market on-chain:");
  console.log("   ID:", createdMarket.id);
  console.log("   Question:", createdMarket.question);
  console.log("   Yes Pool:", ethers.formatUnits(createdMarket.yesPool, 6), "USDT");
  console.log("   No Pool:", ethers.formatUnits(createdMarket.noPool, 6), "USDT");
  console.log("   Status:", createdMarket.status);
  console.log("   Start Time:", new Date(Number(createdMarket.startTime) * 1000).toLocaleString());
  console.log("   End Time:", new Date(Number(createdMarket.endTime) * 1000).toLocaleString());

  console.log("\n🎉 Done! Users can now place bets on this market.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  });
