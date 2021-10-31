import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { Contract, ContractFactory } from "ethers";

// import "web3";
// import {Web3} from "web3";
// var Web3 = require('web3');
// var web3 = new Web3(Web3.givenProvider || 'ws://some.local-or-remote.node:8546');

import "@nomiclabs/hardhat-web3";
import {web3} from "hardhat";

const { expect } = require('chai');
const { ethers } = require('hardhat');


describe('Контракт моста', () => {
    let Token: ContractFactory;
    let token: Contract;  
    let MyDAO: ContractFactory;
    let dao: Contract;  
    let owner: SignerWithAddress; 
    let addr1: SignerWithAddress; 
    let addr2: SignerWithAddress;


    beforeEach(async () => {
        [owner, addr1, addr2] = await ethers.getSigners();
        
        Token = await ethers.getContractFactory('CoinDAO');
        token = await Token.deploy(ethers.utils.parseEther('1000000000'));

        MyDAO = await ethers.getContractFactory('MyDAO');
        dao = await MyDAO.deploy(100, 3);

        // await token.grantRole(token.MINTER_ROLE(), bridgeETH.address);
        // await token.grantRole(token.BURNER_ROLE(), bridgeETH.address);
    });

    describe('1) Деплой', () => { 
        it('1.1) Контракт должен присвоить правильный minQorum', async () => {
            expect(await dao.getMinQorum()).to.equal(100);
        });

        it('1.2) Контракт должен присвоить правильный period', async () => {
            expect(await dao.getPeriod()).to.equal(3);
        });
    });

    describe('2) Функция Proposal', () => { 
        it('2.1) Шифруем с помощью web3 функцию', async () => {
            let callData = web3.eth.abi.encodeFunctionSignature({
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

            console.log(callData);
        });

        // it('2.2) Контракт должен добавить все данные в proposals', async () => {
        //     await dao.addProposal("Добавить функцию", )
        //     expect(await dao.getMinQorum()).to.equal(100);
        // });

    });

});

