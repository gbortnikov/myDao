import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { Contract, ContractFactory } from "ethers";

import "@nomiclabs/hardhat-web3";

const { expect } = require('chai');
const { ethers } = require('hardhat');


describe('Контракт моста', () => {
    let Token: ContractFactory;
    let token: Contract;  
    let SayHello: ContractFactory;
    let sayHello: Contract;  
    let owner: SignerWithAddress; 
    let addr1: SignerWithAddress; 
    let addr2: SignerWithAddress;


    beforeEach(async () => {
        [owner, addr1, addr2] = await ethers.getSigners();

        SayHello = await ethers.getContractFactory('SayHello');
        sayHello = await SayHello.deploy();
    });

    describe('1) Функция hello', () => { 
        it('1.1) Контракт должен сказать привет', async () => {
            sayHello.hello("Lenarqa");
        });
    });

});

