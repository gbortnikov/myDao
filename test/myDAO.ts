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
        dao = await MyDAO.deploy(100, 3, token.address);

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

        it('2.1) Контракт должен добавить все данные в proposals', async () => {
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

            await dao.addProposal("Функция hello", callData, addr1.address);
            let proposalInfo = await dao.getProposalInfo(0);
            // console.log(proposalInfo[0].toString());
            
            expect(proposalInfo[0]).to.equal("Функция hello");
            expect(proposalInfo[1]).to.equal(callData);
            expect(proposalInfo[2]).to.equal(addr1.address);
        });

    });

    describe('3) Функция deposit', () => { 
        it('3.1) У пользователя должны списаться токены', async () => {
            await token.transfer(addr1.address, ethers.utils.parseEther("1001"));
            await token.connect(addr1).approve(dao.address, ethers.utils.parseEther("1001"));
            
            await dao.connect(addr1).deposit(ethers.utils.parseEther("1000"));
            expect(await token.balanceOf(addr1.address)).to.equal(ethers.utils.parseEther("1"));
        });

        // it('1.2) Контракт должен присвоить правильный period', async () => {
        //     expect(await dao.getPeriod()).to.equal(3);
        // });
    });

});

