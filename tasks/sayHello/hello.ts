import { task } from "hardhat/config";
import { Contract } from "ethers";
const fs = require('fs');
const dotenv = require('dotenv');

task("Hello", "Hello task", async (args, hre) => {    
    const network = hre.network.name;
    console.log(network);

    const [...addr] = await hre.ethers.getSigners();

    const sayHello = await hre.ethers.getContractAt("SayHello", process.env.SAY_HELLO_ADDR as string);

    console.log("Hello begin");
    await sayHello.hello("Lenar");
    
    console.log("Hello end");
});