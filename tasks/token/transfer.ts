import { task } from "hardhat/config";
import { Contract } from "ethers";
const fs = require('fs');
const dotenv = require('dotenv');

task("Transfer", "Transfer task", async (args, hre) => {
    console.log("Begin Capture task");
    
    const network = hre.network.name;
    console.log(network);

    const [...addr] = await hre.ethers.getSigners();

    const token = await hre.ethers.getContractAt("CoinDAO", process.env.TOKEN_ADDR as string);

    console.log("transfer begin");
    await token.transfer(addr[1].address, hre.ethers.utils.parseEther('1000'));
    console.log("transfer end");
});