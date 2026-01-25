import * as fs from "fs";
import hre from "hardhat";
import * as path from "path";

const { ethers } = hre;

async function main() {
    console.log("\n🚀 Deploying PredictionMarket Contracts");
    console.log("═".repeat(60));

    // Get deployment parameters from environment
    const GNOSIS_SAFE_ADDRESS = process.env.GNOSIS_SAFE_ADDRESS;
    let USDT_ADDRESS = process.env.USDT_ADDRESS;

    // Validation
    if (!GNOSIS_SAFE_ADDRESS) {
        throw new Error("❌ GNOSIS_SAFE_ADDRESS is required in .env file");
    }

    if (!ethers.isAddress(GNOSIS_SAFE_ADDRESS)) {
        throw new Error("❌ GNOSIS_SAFE_ADDRESS is not a valid Ethereum address");
    }

    // Get deployer account
    const [deployer] = await ethers.getSigners();
    console.log(`\n📋 Deployment Configuration:`);
    console.log(`   Network:           ${hre.network.name}`);
    console.log(`   Deployer:          ${deployer.address}`);

    // Get deployer balance
    const balance = await ethers.provider.getBalance(deployer.address);
    console.log(`   Balance:           ${ethers.formatEther(balance)} MON`);

    if (balance === 0n) {
        throw new Error("❌ Deployer account has no balance. Fund your account with testnet MON.");
    }

    // Deploy Mock USDT if not provided
    if (!USDT_ADDRESS || USDT_ADDRESS === "0x0000000000000000000000000000000000000000") {
        console.log("\n1️⃣  Deploying Mock USDT contract...");
        const MockUSDT = await ethers.getContractFactory("MockUSDT");
        const mockUSDT = await MockUSDT.deploy();
        await mockUSDT.waitForDeployment();
        USDT_ADDRESS = await mockUSDT.getAddress();
        console.log(`   ✅ Mock USDT deployed at: ${USDT_ADDRESS}`);
    }

    console.log(`\n   Gnosis Safe:       ${GNOSIS_SAFE_ADDRESS}`);
    console.log(`   USDT Address:      ${USDT_ADDRESS}`);

    // Deploy PredictionMarket contract
    console.log("\n2️⃣  Deploying PredictionMarket contract...");
    console.log("   Compiling...");

    const PredictionMarket = await ethers.getContractFactory("PredictionMarket");

    console.log("   Deploying...");
    const predictionMarket = await PredictionMarket.deploy(
        GNOSIS_SAFE_ADDRESS,
        USDT_ADDRESS
    );

    console.log("   Waiting for confirmation...");
    const deploymentTx = await predictionMarket.deploymentTransaction();

    if (!deploymentTx) {
        throw new Error("❌ Deployment transaction not found");
    }

    const receipt = await deploymentTx.wait(1);

    if (!receipt || receipt.status === 0) {
        throw new Error("❌ Contract deployment failed");
    }

    const contractAddress = await predictionMarket.getAddress();

    console.log(`   ✅ Deployed at: ${contractAddress}`);
    console.log(`   Transaction:   ${receipt.hash}`);
    console.log(`   Gas used:      ${receipt.gasUsed.toString()}`);

    // Verify deployment on chain
    console.log("\n2️⃣  Verifying contract on chain...");
    const code = await ethers.provider.getCode(contractAddress);

    if (code === "0x") {
        throw new Error("❌ No contract code found at deployment address");
    }

    console.log("   ✅ Contract code verified");

    // Read contract details
    console.log("\n3️⃣  Verifying constructor parameters...");

    // Try to read stored values if contract has getters
    try {
        const storedGnosisSafe = await predictionMarket.gnosisSafe();
        const storedUSDT = await predictionMarket.usdt();

        console.log(`   ✅ Gnosis Safe stored: ${storedGnosisSafe}`);
        console.log(`   ✅ USDT stored:       ${storedUSDT}`);

        if (storedGnosisSafe.toLowerCase() !== GNOSIS_SAFE_ADDRESS.toLowerCase()) {
            console.warn("   ⚠️  WARNING: Gnosis Safe address mismatch");
        }

        if (storedUSDT.toLowerCase() !== USDT_ADDRESS.toLowerCase()) {
            console.warn("   ⚠️  WARNING: USDT address mismatch");
        }
    } catch (error) {
        console.log("   ℹ️  Could not verify stored values (contract may not expose getters)");
    }

    // Generate environment variables for frontend
    console.log("\n4️⃣  Generating environment variables...");

    const envVars = {
        NEXT_PUBLIC_CONTRACT_ADDRESS: contractAddress,
        NEXT_PUBLIC_USDT_ADDRESS: USDT_ADDRESS,
        NEXT_PUBLIC_GNOSIS_SAFE_ADDRESS: GNOSIS_SAFE_ADDRESS,
    };

    console.log("\n📝 Add these to your /apps/web/.env.local:");
    console.log("─".repeat(60));
    Object.entries(envVars).forEach(([key, value]) => {
        console.log(`${key}=${value}`);
    });
    console.log("─".repeat(60));

    // Save deployment info to file
    const deploymentInfo = {
        network: hre.network.name,
        chainId: (await ethers.provider.getNetwork()).chainId,
        contractAddress,
        gnosisSafe: GNOSIS_SAFE_ADDRESS,
        usdtAddress: USDT_ADDRESS,
        deployedBy: deployer.address,
        deploymentTx: receipt.hash,
        deploymentBlock: receipt.blockNumber,
        timestamp: new Date().toISOString(),
    };

    const deploymentPath = path.join(__dirname, "..", "deployment.json");
    fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));

    console.log(`\n💾 Full deployment info saved to: ${deploymentPath}`);

    // Final summary
    console.log("\n🎉 DEPLOYMENT SUCCESSFUL!");
    console.log("═".repeat(60));
    console.log(`Contract Address:      ${contractAddress}`);
    console.log(`Network:               ${hre.network.name}`);
    console.log(`Deployment Block:      ${receipt.blockNumber}`);
    console.log(`Transaction Hash:      ${receipt.hash}`);
    console.log("═".repeat(60));

    // Mainnet warning
    if (hre.network.name === "cronos" || hre.network.name === "mainnet") {
        console.log("\n⚠️  MAINNET DEPLOYMENT DETECTED");
        console.log("   Please verify contract details before proceeding");
    }

    console.log("\n✅ Next steps:");
    console.log("   1. Copy the environment variables above to /apps/web/.env.local");
    console.log("   2. Update your homepage to link to /predict route");
    console.log("   3. Test betting on testnet first");
    console.log("   4. Deploy to production\n");
}

main()
    .then(() => {
        process.exit(0);
    })
    .catch((error) => {
        console.error("\n❌ Deployment failed:");
        console.error(error.message || error);
        process.exit(1);
    });