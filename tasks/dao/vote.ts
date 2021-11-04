import { task } from "hardhat/config";
import { Contract } from "ethers";
const fs = require('fs');
const dotenv = require('dotenv');

task("Vote", "Vote task", async (args, hre) => {    
    const network = hre.network.name;
    console.log(network);

    const [...addr] = await hre.ethers.getSigners();

    const myDAO = await hre.ethers.getContractAt("MyDAO", process.env.DAO_ADDR as string);

    console.log("Vote begin");
    await myDAO.connect(addr[1]).vote(1, 0);
    // await myDAO.connect(addr[2]).vote(0, 0);
    console.log("Vote end");
});