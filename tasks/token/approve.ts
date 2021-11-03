import { task } from "hardhat/config";
import { Contract } from "ethers";
const fs = require('fs');
const dotenv = require('dotenv');

task("Approve", "Approve task", async (args, hre) => {    
    const network = hre.network.name;
    console.log(network);

    const [...addr] = await hre.ethers.getSigners();

    const token = await hre.ethers.getContractAt("CoinDAO", process.env.TOKEN_ADDR as string);

    console.log("Approve begin");
    await token.connect(addr[1]).approve(process.env.DAO_ADDR, hre.ethers.utils.parseEther('1000'));
    // let allowance = await token.allowance(addr[0].address, process.env.DAO_ADDR);
    // console.log(allowance.toString());
    
    console.log("Approve end");
});