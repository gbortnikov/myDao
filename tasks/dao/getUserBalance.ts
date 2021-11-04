import { task } from "hardhat/config";
import { Contract } from "ethers";
const fs = require('fs');
const dotenv = require('dotenv');

task("GetUserBalance", "GetUserBalance task", async (args, hre) => {    
    const network = hre.network.name;
    console.log(network);

    const [...addr] = await hre.ethers.getSigners();

    const myDAO = await hre.ethers.getContractAt("MyDAO", process.env.DAO_ADDR as string);

    console.log("GetUserBalance begin");
    let balance = await myDAO.connect(addr[1]).getUserBalance();
    console.log(balance.toString());
    
    console.log("GetUserBalance end");
});