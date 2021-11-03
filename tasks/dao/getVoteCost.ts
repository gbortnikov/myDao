import { task } from "hardhat/config";
import { Contract } from "ethers";
const fs = require('fs');
const dotenv = require('dotenv');

task("GetVoteCost", "GetVoteCost task", async (args, hre) => {    
    const network = hre.network.name;
    console.log(network);

    const [...addr] = await hre.ethers.getSigners();

    const myDAO = await hre.ethers.getContractAt("MyDAO", process.env.DAO_ADDR as string);

    console.log("GetVoteCost begin");
    let voteCost = await myDAO.getVoteCost();
    console.log(voteCost.toString());
    
    console.log("GetVoteCost end");
});