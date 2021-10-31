import { config as dotenvConfig } from 'dotenv';
import '@nomiclabs/hardhat-waffle';
import "@nomiclabs/hardhat-ethers";
// import "./tasks/index.ts";
import "@nomiclabs/hardhat-web3";

dotenvConfig();

module.exports = {
    solidity: "0.8.4",
    
    networks: {
        rinkeby: {
            url: process.env.INFURA_API_KEY,
            accounts: {mnemonic: process.env.MNEMONIC},
            gas: 2100000,
            gasPrice: 120000000000, // gwei
        },

        bsctestnet: {
            url: "https://data-seed-prebsc-1-s1.binance.org:8545",
            chainId: 97,
            gas: 2100000,
            gasPrice: 10000000000,
            accounts: {mnemonic: process.env.MNEMONIC},
          },
      
    },
};