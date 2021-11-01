// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

import "hardhat/console.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import "./coinDAO.sol";

import "hardhat/console.sol";

contract MyDAO is AccessControl{
    using SafeERC20 for IERC20;
    uint256 private proposalId;
    uint256 private minQorum;
    uint256 private period;
    IERC20 private token;

    enum State {
        Undefined,
        Active,
        Finished
    }

    struct User {
        bool voted;
        uint256 amount;
    }

    struct Proposal {
        string name;
        bytes callData;
        address recipient;
        State state;
        mapping(address => User) voters;
        uint256 timeBegin;
        uint256 timeEnd;
    }

    constructor (uint256 _minQorum, uint256 _period, address _tokenAddress) {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        minQorum = _minQorum;
        period = _period;
        token = IERC20(_tokenAddress);
    }

    mapping(uint256 => Proposal) public proposals;
    mapping(address => User) public users;
    
    

    function addProposal(string memory _name, bytes memory _callData, address _recipient) external {
        require(proposals[proposalId].state == State.Undefined, "addProposal:: State is not inderfined");
        Proposal storage proposal = proposals[proposalId];
        proposal.name = _name;
        proposal.callData = _callData;
        proposal.recipient = _recipient;
        proposal.state = State.Active;
        // proposals[] = Proposal(_name, _callData, _recipient, State.Active, address(0));
        proposalId++;
    }

    function deposit (uint256 _amount) external {
        require(_amount > 0, "deposit:: amount <= 0");
        token.safeTransferFrom(msg.sender, address(this), _amount);
        users[msg.sender].amount = _amount;
    }

    function vote(bool _solution, uint256 _proposalId) external {
        console.log("vote");
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
