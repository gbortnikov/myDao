import { Contract } from "ethers";
import hre, { ethers } from "hardhat";
const network = hre.network.name;
const fs = require('fs');
const dotenv = require('dotenv');


async function main() {
    const network = hre.network.name;
    console.log(network);

    const Token = await hre.ethers.getContractFactory("CoinDAO");
    let token = await Token.deploy(hre.ethers.utils.parseEther('1000000000'));

    console.log(`Smart contract has been deployed to: ${token.address}`);
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });