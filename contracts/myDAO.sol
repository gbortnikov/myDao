// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

import "hardhat/console.sol";

contract MyDAO is AccessControl{
    uint256 private minQorum;
    uint256 private period;

    struct Proposal {
        string name;
        bytes32 callData;
        address recipient;
    }

    constructor (uint256 _minQorum, uint256 _period) {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        minQorum = _minQorum;
        period = _period;
    }

    function addProposal() external {

    }

    function getMinQorum() external view returns(uint256) {
        return minQorum;
    }

    function setMinQorum(uint256 _minQorum) external onlyRole(DEFAULT_ADMIN_ROLE){
        minQorum = _minQorum;
    }

    function getPeriod() external view returns(uint256) {
        return period;
    }

    function setPeriod(uint256 _period) external onlyRole(DEFAULT_ADMIN_ROLE){
        period = _period;
    }

}
