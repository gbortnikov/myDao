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
        dao = await MyDAO.deploy(51, 3, ethers.utils.parseEther('100'), token.address);

        // await token.grantRole(token.MINTER_ROLE(), bridgeETH.address);
        // await token.grantRole(token.BURNER_ROLE(), bridgeETH.address);
    });

    describe('1) Деплой', () => { 
        it('1.1) Контракт должен присвоить правильный minQorum', async () => {
            expect(await dao.getMinQorum()).to.equal(51);
        });

        it('1.2) Контракт должен присвоить правильный period', async () => {
            expect(await dao.getPeriod()).to.equal(3*86400);
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

    });

    describe('4) Функция vote', () => { 
        
        it('4.1) Нельзя голосовать если голосование не активно', async () => {
            await expect(dao.connect(addr1).vote(1, 0)).to.be.revertedWith("vote:: proposals do not have status Active"); 
        });

        it('4.2) Один и тот же пользователь не может голосовать дважды в одном голосовании', async () => {
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

            await token.transfer(addr1.address, ethers.utils.parseEther("1001"));
            await token.connect(addr1).approve(dao.address, ethers.utils.parseEther("1001"));
            await dao.connect(addr1).deposit(ethers.utils.parseEther("1000"));

            await dao.connect(addr1).vote(1, 0);
            await expect(dao.connect(addr1).vote(1, 0)).to.be.revertedWith("vote:: user has already voted in this poll"); 
        });

        it('4.3) Пользователь не может голосавать если у него недостаточно токенов в депозите', async () => {
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

            await token.transfer(addr1.address, ethers.utils.parseEther("99"));
            await token.connect(addr1).approve(dao.address, ethers.utils.parseEther("99"));
            await dao.connect(addr1).deposit(ethers.utils.parseEther("99"));

            await expect(dao.connect(addr1).vote(1, 0)).to.be.revertedWith("vote:: the user does not have enough tokens on the account"); 
        });

        it('4.4) В голосовании должна появиться информация о пользователе', async () => {
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

            await token.transfer(addr1.address, ethers.utils.parseEther("1001"));
            await token.connect(addr1).approve(dao.address, ethers.utils.parseEther("1001"));
            await dao.connect(addr1).deposit(ethers.utils.parseEther("1000"));
            await dao.connect(addr1).vote(1, 0);

            let userInfo = await dao.getUserProposalInfoFrom(0, addr1.address);
            expect(userInfo[0]).to.equal(true);
            expect(userInfo[1]).to.equal(ethers.utils.parseEther("100"));
        });
    });
    
    describe('5) Функция finishVote', () => { 
        
        it('5.1) Нельзя завершить неактивное голосование', async () => {
            await expect(dao.connect(addr1).finishVote(0)).to.be.revertedWith("finishVote:: proposals do not have status Active"); 
        });

        it('5.2) Нельзя завершить голосование у которого еще не закончилось время', async () => {
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

            await token.transfer(addr1.address, ethers.utils.parseEther("1001"));
            await token.connect(addr1).approve(dao.address, ethers.utils.parseEther("1001"));
            await dao.connect(addr1).deposit(ethers.utils.parseEther("1000"));
            await dao.connect(addr1).vote(1, 0);
            
            await expect(dao.connect(addr1).finishVote(0)).to.be.revertedWith("finishVote:: time for voting is not over yet"); 
        });

        it('5.3) Фунция должна рассчитать количество в процентах голосов за принятие решения', async () => {
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

            // проголосовал за
            await token.transfer(addr1.address, ethers.utils.parseEther("1001"));
            await token.connect(addr1).approve(dao.address, ethers.utils.parseEther("1001"));
            await dao.connect(addr1).deposit(ethers.utils.parseEther("1000"));
            await dao.connect(addr1).vote(1, 0);

            // проголосовал против
            await token.transfer(addr2.address, ethers.utils.parseEther("1001"));
            await token.connect(addr2).approve(dao.address, ethers.utils.parseEther("1001"));
            await dao.connect(addr2).deposit(ethers.utils.parseEther("1000"));
            await dao.connect(addr2).vote(0, 0);

            // проголосовал за
            await token.transfer(owner.address, ethers.utils.parseEther("1001"));
            await token.connect(owner).approve(dao.address, ethers.utils.parseEther("1001"));
            await dao.connect(owner).deposit(ethers.utils.parseEther("1000"));
            await dao.connect(owner).vote(1, 0);
            
            await ethers.provider.send("evm_increaseTime", [3*86401]);
            
            await dao.connect(addr1).finishVote(0);

            let proposalInfo = await dao.getProposalInfo(0);
            // console.log(proposalInfo.toString());
            expect(proposalInfo[9]).to.equal(66);
        });
    });

    describe('6) Функция withraw', () => { 
        
        it('6.1) Пользователь не может забрать amount если не все голосования завершены', async () => {
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
            await expect(dao.connect(addr1).withdraw()).to.be.revertedWith("withdraw:: not all proposal finished"); 
        });

        it('6.2) По завершению голосования пользователь может забрать все свои токены', async () => {
            let userInfo;
            let balance;

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

            // проголосовал за
            await token.transfer(addr1.address, ethers.utils.parseEther("1001"));
            await token.connect(addr1).approve(dao.address, ethers.utils.parseEther("1001"));
            await dao.connect(addr1).deposit(ethers.utils.parseEther("1000"));
            await dao.connect(addr1).vote(1, 0);

            
            await ethers.provider.send("evm_increaseTime", [3*86401]);
            
            await dao.connect(addr1).finishVote(0);

            let proposalInfo = await dao.getProposalInfo(0);
            // console.log(proposalInfo.toString());
            
            // userInfo = await dao.connect(addr1).getUserBalance();
            // console.log("UserInfo before - ", userInfo.toString());
            // balance = await token.balanceOf(addr1.address);
            // console.log("balance before withdraw - ", balance.toString())

            await dao.connect(addr1).withdraw();

            // userInfo = await dao.connect(addr1).getUserBalance();
            // console.log("UserInfo after withdraw - ",userInfo.toString());
            balance = await token.balanceOf(addr1.address);
            // console.log("balance after withdraw - ", balance.toString());

            expect(balance.toString()).to.equal(ethers.utils.parseEther("1001"));
            
        });

    });
});


