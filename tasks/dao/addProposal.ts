import { task } from "hardhat/config";
import { Contract } from "ethers";
// import {web3} from "hardhat";

const fs = require('fs');
const dotenv = require('dotenv');

task("AddProposal", "AddProposal task", async (args, hre) => {    
    const network = hre.network.name;
    console.log(network);

    const [...addr] = await hre.ethers.getSigners();

    const myDAO = await hre.ethers.getContractAt("MyDAO", process.env.DAO_ADDR as string);

    let callData = hre.web3.eth.abi.encodeFunctionSignature({
        name: "hello",
        type: "function",
        inputs: [
            {
            "internalType": "string",
            "name": "_name",
            "type": "string"
            }
        ]
    });

    console.log("AddProposal begin");
    await myDAO.connect(addr[1]).addProposal("Функция hello", callData, addr[1].address);
    console.log("AddProposal end");
});