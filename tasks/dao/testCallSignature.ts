import { task } from "hardhat/config";
import { Contract } from "ethers";
const fs = require('fs');
const dotenv = require('dotenv');

task("TestCallSignature", "WithdrawSignature task", async (args, hre) => {    
    const network = hre.network.name;
    console.log(network);

    const [...addr] = await hre.ethers.getSigners();

    const myDAO = await hre.ethers.getContractAt("MyDAO", process.env.DAO_ADDR as string);

    console.log("TestCallSignature begin");


    let callData = hre.web3.eth.abi.encodeFunctionCall({
        name: "hello",
        type: "function",
        inputs: [
            {
            "internalType": "string",
            "name": "_name",
            "type": "string"
            }
        ]
    }, ["Hello World!"]);
    
    console.log(callData);
    
    console.log(process.env.SAY_HELLO_ADDR);
    

    await myDAO.testCallSignature(process.env.SAY_HELLO_ADDR, callData);
    console.log("TestCallSignature end");
});