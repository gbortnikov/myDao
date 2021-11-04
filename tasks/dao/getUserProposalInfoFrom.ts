import { task } from "hardhat/config";
import { Contract } from "ethers";
const fs = require('fs');
const dotenv = require('dotenv');

task("GetUserProposalInfoFrom", "GetUserProposalInfoFrom task", async (args, hre) => {    
    const network = hre.network.name;
    console.log(network);

    const [...addr] = await hre.ethers.getSigners();

    const myDAO = await hre.ethers.getContractAt("MyDAO", process.env.DAO_ADDR as string);

    console.log("GetUserProposalInfoFrom begin");
    let userFromProposalInfo = await myDAO.getUserProposalInfoFrom(0, addr[1].address);
    console.log(userFromProposalInfo.toString());
    
    console.log("GetUserProposalInfoFrom end");
});