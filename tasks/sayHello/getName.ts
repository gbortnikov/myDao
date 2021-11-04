import { task } from "hardhat/config";
import { Contract } from "ethers";
const fs = require('fs');
const dotenv = require('dotenv');

task("GetName", "GetName task", async (args, hre) => {    
    const network = hre.network.name;
    console.log(network);

    const [...addr] = await hre.ethers.getSigners();

    const sayHello = await hre.ethers.getContractAt("SayHello", process.env.SAY_HELLO_ADDR as string);

    console.log("GetName begin");
    let name = await sayHello.getName();
    console.log(name);
    console.log("GetName end");
});