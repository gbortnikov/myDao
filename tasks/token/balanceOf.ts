import { task } from "hardhat/config";
const fs = require('fs');
const dotenv = require('dotenv');

task("BalanceOf", "BalanceOf task", async (args, hre) => {    
    const network = hre.network.name;
    console.log(network);

    const [...addr] = await hre.ethers.getSigners();

    const token = await hre.ethers.getContractAt("CoinDAO", process.env.TOKEN_ADDR as string);

    console.log("BalanceOf begin");
    let balance = await token.balanceOf(addr[0].address);
    console.log(balance.toString());
    
    console.log("BalanceOf end");
});