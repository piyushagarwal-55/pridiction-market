import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-verify";
import "@typechain/hardhat";
import { HardhatUserConfig } from "hardhat/config";
import { config as dotenvConfig } from "dotenv";
import { resolve } from "path";

// Load environment variables
dotenvConfig({ path: resolve(__dirname, ".env") });

const config: HardhatUserConfig = {
    solidity: {
        version: "0.8.24",
        settings: {
            optimizer: {
                enabled: true,
                runs: 200
            },
            viaIR: true
        }
    },
    networks: {
        // Monad Testnet (Primary)
        "monad-testnet": {
            url: process.env.MONAD_RPC_URL || "https://testnet-rpc.monad.xyz",
            accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
            chainId: 10143,
            gasPrice: "auto"
        },
        // Cronos networks (backup/alternative)
        cronos: {
            url: process.env.CRONOS_RPC_URL || "https://evm.cronos.org",
            accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
            chainId: 25
        },
        "cronos-testnet": {
            url: process.env.CRONOS_TESTNET_RPC_URL || "https://evm-t3.cronos.org",
            accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
            chainId: 338
        },
        hardhat: {
            chainId: 1337
        }
    },
    typechain: {
        outDir: "typechain-types",
        target: "ethers-v6"
    },
    paths: {
        sources: "./contracts",
        tests: "./test",
        cache: "./cache",
        artifacts: "./artifacts"
    },
    etherscan: {
        apiKey: process.env.CRONOSCAN_API_KEY
    }
};

export default config;
