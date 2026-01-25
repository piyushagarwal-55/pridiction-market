const hre = require("hardhat");

async function main() {
    console.log("🤖 Deploying BotSettings contract...");

    const [deployer] = await hre.ethers.getSigners();
    console.log("Deploying with account:", deployer.address);

    const balance = await hre.ethers.provider.getBalance(deployer.address);
    console.log("Account balance:", hre.ethers.formatEther(balance), "ETH");

    // Deploy BotSettings
    const BotSettings = await hre.ethers.getContractFactory("BotSettings");
    const botSettings = await BotSettings.deploy();
    await botSettings.waitForDeployment();

    const botSettingsAddress = await botSettings.getAddress();
    console.log("✅ BotSettings deployed to:", botSettingsAddress);

    // Save address to file
    const fs = require('fs');
    const addresses = {
        botSettings: botSettingsAddress,
        network: hre.network.name,
        deployer: deployer.address,
        deployedAt: new Date().toISOString()
    };

    fs.writeFileSync(
        './deployed-bot-settings.json',
        JSON.stringify(addresses, null, 2)
    );

    console.log("\n📝 Deployment Summary:");
    console.log("├─ BotSettings:", botSettingsAddress);
    console.log("├─ Network:", hre.network.name);
    console.log("└─ Deployer:", deployer.address);

    console.log("\n🎉 Deployment complete!");
    console.log("\nNext steps:");
    console.log("1. Update CONTRACT_ADDRESSES in frontend config");
    console.log("2. Verify contract on explorer (optional)");
    console.log("3. Test bot settings configuration");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
