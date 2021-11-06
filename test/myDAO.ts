import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { Contract, ContractFactory } from "ethers";
import "@nomiclabs/hardhat-web3";
import {web3} from "hardhat";

const { expect } = require('chai');
const { ethers } = require('hardhat');


describe('Контракт моста', () => {
    let Token: ContractFactory;
    let token: Contract;  
    let MyDAO: ContractFactory;
    let dao: Contract;  
    let SayHello: ContractFactory;
    let sayHello: Contract;  
    let owner: SignerWithAddress; 
    let addr1: SignerWithAddress; 
    let addr2: SignerWithAddress;


    beforeEach(async () => {
        [owner, addr1, addr2] = await ethers.getSigners();
        
        Token = await ethers.getContractFactory('CoinDAO');
        token = await Token.deploy(ethers.utils.parseEther('1000000000'));

        MyDAO = await ethers.getContractFactory('MyDAO');
        dao = await MyDAO.deploy(2, 3, token.address);

        SayHello = await ethers.getContractFactory('SayHello');
        sayHello = await SayHello.deploy();
    });

    describe('1) Деплой', () => { 
        it('1.1) Контракт должен присвоить правильный minQorum', async () => {
            expect(await dao.minQuorum()).to.equal(2);
        });

        it('1.2) Контракт должен присвоить правильный period', async () => {
            expect(await dao.period()).to.equal(3*86400);
        });
    });

    describe('2) Функция Proposal', () => { 

        it('2.1) Контракт должен добавить все данные в proposals', async () => {
            let callData = web3.eth.abi.encodeFunctionCall({
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

            await dao.addProposal("Функция hello", callData, sayHello.address);
            let proposalInfo = await dao.getProposalInfo(0);
            // console.log(proposalInfo);
            
            expect(proposalInfo[0]).to.equal("Функция hello");
            expect(proposalInfo[1]).to.equal(callData);
            expect(proposalInfo[2]).to.equal(sayHello.address);
        });

    });

    describe('3) Функция deposit', () => { 
        
        it('3.1) У пользователя должны списаться токены', async () => {
            await token.transfer(addr1.address, ethers.utils.parseEther("1001"));
            await token.connect(addr1).approve(dao.address, ethers.utils.parseEther("1001"));
            
            await dao.connect(addr1).deposit(ethers.utils.parseEther("1000"));
            expect(await token.balanceOf(addr1.address)).to.equal(ethers.utils.parseEther("1"));
        });

        it('3.2) У пользователь не может задепозитить больше токенов чем у него есть на балансе', async () => {
            await token.transfer(addr1.address, ethers.utils.parseEther("1001"));
            await token.connect(addr1).approve(dao.address, ethers.utils.parseEther("1001"));
            await expect(dao.connect(addr1).deposit(ethers.utils.parseEther("1002"))).to.be.revertedWith("deposit:: user does not have enough money in the account"); 
        });

    });

    describe('4) Функция vote', () => { 
        
        it('4.1) Нельзя голосовать если голосование не активно', async () => {
            await expect(dao.connect(addr1).vote(1, 0)).to.be.revertedWith("vote:: proposals do not have status Active"); 
        });

        it('4.2) Один и тот же пользователь не может голосовать дважды в одном голосовании', async () => {
            let callData = web3.eth.abi.encodeFunctionCall({
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
            await dao.addProposal("Функция hello", callData, sayHello.address);

            await token.transfer(addr1.address, ethers.utils.parseEther("1001"));
            await token.connect(addr1).approve(dao.address, ethers.utils.parseEther("1001"));
            await dao.connect(addr1).deposit(ethers.utils.parseEther("1000"));

            await dao.connect(addr1).vote(1, 0);
            await expect(dao.connect(addr1).vote(1, 0)).to.be.revertedWith("vote:: user has already voted in this poll"); 
        });

        it('4.3) Пользователь не может голосавать если у него нет токенов', async () => {
            let callData = web3.eth.abi.encodeFunctionCall({
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
            await dao.addProposal("Функция hello", callData, addr1.address);
            await expect(dao.connect(addr1).vote(1, 0)).to.be.revertedWith("vote:: the user does not have enough tokens on the account"); 
        });

        it('4.4) В голосовании должна появиться информация о пользователе', async () => {
            let callData = web3.eth.abi.encodeFunctionCall({
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
            
            await dao.addProposal("Функция hello", callData, sayHello.address);

            await token.transfer(addr1.address, ethers.utils.parseEther("1001"));
            await token.connect(addr1).approve(dao.address, ethers.utils.parseEther("1001"));
            await dao.connect(addr1).deposit(ethers.utils.parseEther("1000"));
            await dao.connect(addr1).vote(1, 0);

            let userSolution = await dao.getUserVoteInfoFromProposal(0, addr1.address);
            expect(userSolution).to.equal(true);
        });
    });
    
    describe('5) Функция finishVote', () => { 
        
        it('5.1) Нельзя завершить неактивное голосование', async () => {
            await expect(dao.connect(addr1).finishVote(0)).to.be.revertedWith("finishVote:: proposals do not have status Active"); 
        });
        

        it('5.2) Нельзя завершить голосование у которого еще не закончилось время', async () => {
            let callData = web3.eth.abi.encodeFunctionCall({
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

            await dao.addProposal("Функция hello", callData, sayHello.address);

            await token.transfer(addr1.address, ethers.utils.parseEther("1001"));
            await token.connect(addr1).approve(dao.address, ethers.utils.parseEther("1001"));
            await dao.connect(addr1).deposit(ethers.utils.parseEther("1000"));
            await dao.connect(addr1).vote(1, 0);
            
            
            await expect(dao.connect(addr1).finishVote(0)).to.be.revertedWith("finishVote:: time for voting is not over yet"); 
        });

        it('5.3) Нельзя завершить голосование если минимальное количество участников не пройдено', async () => {
            let callData = web3.eth.abi.encodeFunctionCall({
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

            await dao.addProposal("Функция hello", callData, addr1.address);

            // проголосовал за
            await token.transfer(addr1.address, ethers.utils.parseEther("1001"));
            await token.connect(addr1).approve(dao.address, ethers.utils.parseEther("1001"));
            await dao.connect(addr1).deposit(ethers.utils.parseEther("1000"));
            await dao.connect(addr1).vote(1, 0);

            await ethers.provider.send("evm_increaseTime", [3*86401]);

            await expect(dao.connect(addr1).finishVote(0)).to.be.revertedWith("finishVote:: not enough users voted"); 
        });

        it('5.4) Фунция должна рассчитать количество в процентах голосов за принятие решения', async () => {
            let callData = web3.eth.abi.encodeFunctionCall({
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

            await dao.addProposal("Функция hello", callData, sayHello.address);

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
            expect(proposalInfo[9]).to.equal(66);
        });
    });

    describe('6) Функция withraw', () => { 
        
        it('6.1) Пользователь не может вывести больше токенов чем у него в депозите', async () => {
            let callData = web3.eth.abi.encodeFunctionCall({
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
            await token.transfer(addr1.address, ethers.utils.parseEther("1001"));
            await token.connect(addr1).approve(dao.address, ethers.utils.parseEther("1001"));
            await dao.connect(addr1).deposit(ethers.utils.parseEther("1000"));

            await expect(dao.connect(addr1).withdraw(ethers.utils.parseEther("2000"))).to.be.revertedWith("withraw:: the user does not have so many tokens in the deposit"); 
        });

        it('6.2) Пользователь не может забрать amount если не все голосования завершены', async () => {
            let callData = web3.eth.abi.encodeFunctionCall({
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

            await dao.addProposal("Функция hello", callData, sayHello.address);

            await token.transfer(addr1.address, ethers.utils.parseEther("1001"));
            await token.connect(addr1).approve(dao.address, ethers.utils.parseEther("1001"));
            await dao.connect(addr1).deposit(ethers.utils.parseEther("1000"));
            await dao.connect(addr1).vote(1, 0);

            let proposalInfo = await dao.getProposalInfo(0);
            // console.log(proposalInfo.toString());
            
            // await dao.connect(addr1).withdraw(ethers.utils.parseEther("900"));  

            await expect(dao.connect(addr1).withdraw(ethers.utils.parseEther("900"))).to.be.revertedWith("withraw:: not all proposals is finished");  
        });

        it('6.3) По завершению голосования пользователь может забрать все свои токены', async () => {
            
            let callData = web3.eth.abi.encodeFunctionCall({
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

            await dao.addProposal("Функция hello", callData, sayHello.address);

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

            await dao.connect(addr1).withdraw(ethers.utils.parseEther("900"));
            let balance = await token.balanceOf(addr1.address);
            
            expect(balance).to.equal(ethers.utils.parseEther("901"));
        });

        it('6.4) Функция должна вызвать callData, переменная name должна присвоиться', async () => {

            let callData = web3.eth.abi.encodeFunctionCall({
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

            await dao.addProposal("Функция hello", callData, sayHello.address);

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
            await dao.connect(addr1).withdraw(ethers.utils.parseEther("1000"));

            let name = await sayHello.getName();
            expect(name).to.equal("Hello World!");
            
        });

        it('6.5) Если голосование проиграно то name не должна иметь значения', async () => {
            let callData = web3.eth.abi.encodeFunctionCall({
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

            await dao.addProposal("Функция hello", callData, sayHello.address);

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
             await dao.connect(owner).vote(0, 0);
            
            await ethers.provider.send("evm_increaseTime", [3*86401]);
            
            await dao.connect(addr1).finishVote(0);
            await dao.connect(addr1).withdraw(ethers.utils.parseEther("1000"));
 
            let name = await sayHello.getName();
            expect(name).to.equal("");
            
        });

    });
});


