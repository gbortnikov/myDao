// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

import "hardhat/console.sol";

contract MyDAO is AccessControl{
    uint256 private proposalId;
    uint256 private minQorum;
    uint256 private period;

    struct Proposal {
        string name;
        bytes callData;
        address recipient;
    }

    constructor (uint256 _minQorum, uint256 _period) {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        minQorum = _minQorum;
        period = _period;
    }

    mapping(uint256 => Proposal) proposals;

    function addProposal(string memory _name, bytes memory _callData, address _recipient) external {
        proposals[proposalId] = Proposal(_name, _callData, _recipient);
        proposalId++;
    }

    function callTest(bytes memory _callData) external {
        address(this).call(_callData);
    }

    function getProposalInfo(uint256 _proposalId) external view returns(
        string memory,
        bytes memory,
        address
    ) {
        Proposal storage proposal = proposals[_proposalId]; 
        return (
            proposal.name,
            proposal.callData,
            proposal.recipient
        );
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
