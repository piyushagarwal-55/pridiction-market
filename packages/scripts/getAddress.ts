import hre from "hardhat";

const { ethers } = hre;

async function main() {
    const wallet = new ethers.Wallet("0x61dbad316e3f6503dfde8776427a2b9b51852d8944f2be986799b53a618f1e5d");
    console.log("Wallet Address:", wallet.address);
}

main();
