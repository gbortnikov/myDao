import { task } from "hardhat/config";
const fs = require('fs');
const dotenv = require('dotenv');

task("totalSupply", "token total supply", async (args, hre) => {
    console.log("Begin Capture task");
    
    const network = hre.network.name;
    console.log(network);

    const [...addr] = await hre.ethers.getSigners();

    const token = await hre.ethers.getContractAt("CoinDAO", process.env.TOKEN_ADDR as string);

    console.log("totalSupply begin");
    let totalSupply = await token.totalSupply();
    console.log(totalSupply.toString());
    console.log("totalSupply end");
});