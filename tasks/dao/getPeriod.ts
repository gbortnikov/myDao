import { task } from "hardhat/config";
import { Contract } from "ethers";
const fs = require('fs');
const dotenv = require('dotenv');

task("GetPeriod", "GetPeriod task", async (args, hre) => {    
    const network = hre.network.name;
    console.log(network);

    const [...addr] = await hre.ethers.getSigners();

    const myDAO = await hre.ethers.getContractAt("MyDAO", process.env.DAO_ADDR as string);

    console.log("GetPeriod begin");
    let period = await myDAO.getPeriod();
    console.log(period.toString());
    
    console.log("GetPeriod end");
});