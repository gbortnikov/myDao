import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { Contract, ContractFactory } from "ethers";

import "@nomiclabs/hardhat-web3";

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

});

