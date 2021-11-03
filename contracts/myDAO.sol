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
    uint256 private voteCost;

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
        uint256 votesFor; //votes for making a decision (true vote)
        uint256 totalVote;
        uint256 timeBegin;
        uint256 timeEnd;
        uint256 minQorum;
        uint256 roundResult;
        uint256 voteCost;
    }

    constructor (uint256 _minQorum, uint256 _periodInDays, uint256 _voteCost,address _tokenAddress) {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        minQorum = _minQorum;
        period = _periodInDays * 86400;//86400 - number of seconds in one day
        voteCost = _voteCost;
        token = IERC20(_tokenAddress);
    }

    mapping(uint256 => Proposal) private proposals;
    mapping(address => User) private users;
    
    

    function addProposal(string memory _name, bytes memory _callData, address _recipient) external {
        require(proposals[proposalId].state == State.Undefined, "addProposal:: State is not inderfined");
        Proposal storage proposal = proposals[proposalId];
        proposal.name = _name;
        proposal.callData = _callData;
        proposal.recipient = _recipient;
        proposal.timeBegin = block.timestamp;
        proposal.timeEnd = proposal.timeBegin + period;
        proposal.minQorum = minQorum;
        proposal.state = State.Active;
        proposalId++;
    }

    function deposit (uint256 _amount) external {
        token.safeTransferFrom(msg.sender, address(this), _amount);
        users[msg.sender].amount = _amount;
    }

    function vote(bool _solution, uint256 _proposalId) external {
        Proposal storage proposal = proposals[_proposalId];
        require(proposal.state == State.Active, "vote:: proposals do not have status Active");
        require(!proposal.voters[msg.sender].voted, "vote:: user has already voted in this poll");
        require(users[msg.sender].amount > voteCost, "vote:: the user does not have enough tokens on the account");
        proposal.voters[msg.sender].voted = true;
        proposal.voteCost = voteCost;
        proposal.voters[msg.sender].amount = proposal.voteCost;
        proposal.totalVote += proposal.voteCost;
        uint256 votesFor = _solution ? proposal.voteCost : 0;
        proposal.votesFor += votesFor;
        users[msg.sender].amount -= proposal.voteCost;
    }


    function finishVote(uint256 _proposalId) external {
        Proposal storage proposal = proposals[_proposalId];
        require(proposal.state == State.Active, "finishVote:: proposals do not have status Active");
        require(proposal.timeEnd < block.timestamp, "finishVote:: time for voting is not over yet");
        proposal.roundResult = proposal.votesFor*100/proposal.totalVote;
        if(proposal.roundResult > proposal.minQorum) {
            address(this).call(proposal.callData);
        }
        proposal.state = State.Finished;
    }

    function withdraw() external {
        for (uint256 i = 0; i < proposalId; i++) {
            require(proposals[i].state == State.Finished, "withdraw:: not all proposal finished");
            if(proposals[i].state == State.Finished) {
                users[msg.sender].amount += proposals[i].voters[msg.sender].amount;
            }
        }
        token.transfer(msg.sender, users[msg.sender].amount);
        users[msg.sender].amount = 0;
    }

    function getUserBalance() external view returns(uint256) {
        return users[msg.sender].amount;
    }

    function getProposalInfo(uint256 _proposalId) external view returns(
        string memory,
        bytes memory,
        address,
        State,
        uint256,
        uint256,
        uint256,
        uint256,
        uint256,
        uint256
    ) {
        Proposal storage proposal = proposals[_proposalId]; 
        return (
            proposal.name,
            proposal.callData,
            proposal.recipient,
            proposal.state,
            proposal.votesFor,
            proposal.totalVote,
            proposal.timeBegin,
            proposal.timeEnd,
            proposal.minQorum,
            proposal.roundResult
        );
    }

    function getUserProposalInfoFrom(uint256 _proposalId, address userAddress) external view returns (
        bool,
        uint256
    ) {
        User storage voter = proposals[_proposalId].voters[userAddress]; 
        return (
            voter.voted,
            voter.amount
        );
    }

    function getVoteCost() external view  returns(uint256){
        return voteCost;
    }

    function setVoteCost(uint256 _voteCost) external  onlyRole(DEFAULT_ADMIN_ROLE){
        voteCost = _voteCost;
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
        period = _period;//use seconds for rinkeby test 
        // period = _period * 86400;

    }

}
