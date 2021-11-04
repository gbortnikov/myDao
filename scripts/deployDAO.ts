import { Contract } from "ethers";
import hre, { ethers } from "hardhat";
const network = hre.network.name;
const fs = require('fs');
const dotenv = require('dotenv');


async function main() {
    const network = hre.network.name;
    console.log(network);

    const MyDAO = await hre.ethers.getContractFactory("MyDAO");
    let myDAO = await MyDAO.deploy(51, 3, ethers.utils.parseEther('100'), process.env.TOKEN_ADDR);

    console.log(`Smart contract has been deployed to: ${myDAO.address}`);
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });