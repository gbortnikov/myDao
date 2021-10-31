// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

// import "hardhat/console.sol";

contract MyDAO is AccessControl{

    constructor (uint256 _chainId) {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

}
