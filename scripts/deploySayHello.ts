import { Contract } from "ethers";
import hre, { ethers } from "hardhat";
const network = hre.network.name;
const fs = require('fs');
const dotenv = require('dotenv');


async function main() {
    const network = hre.network.name;
    console.log(network);

    const SayHello = await hre.ethers.getContractFactory("SayHello");
    let sayHello = await SayHello.deploy();

    console.log(`Smart contract has been deployed to: ${sayHello.address}`);
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });