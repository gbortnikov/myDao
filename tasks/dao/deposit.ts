import { task } from "hardhat/config";
import { Contract } from "ethers";
const fs = require('fs');
const dotenv = require('dotenv');

task("Deposit", "Deposit task", async (args, hre) => {    
    const network = hre.network.name;
    console.log(network);

    const [...addr] = await hre.ethers.getSigners();

    const myDAO = await hre.ethers.getContractAt("MyDAO", process.env.DAO_ADDR as string);

    console.log("Deposit begin");
    await myDAO.connect(addr[1]).deposit(hre.ethers.utils.parseEther('1000'));
    console.log("Deposit end");
});