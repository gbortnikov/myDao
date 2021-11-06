// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;


import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";


/// @title MyDaO
/// @author Lenarqa
/// @notice You can use this for creating dao 
/// @dev All function calls are currently implemented without side effects

contract MyDAO is AccessControl, ReentrancyGuard{
    using SafeERC20 for IERC20;
    

    IERC20 public token;
    uint256 public proposalId;
    uint256 public minQuorum;
    uint256 public period;
    uint256 public voteCost;

    enum State {
        Undefined,
        Active,
        Finished,
        BrokenCallData
    }

    struct User {
        uint256 totalVotes;
        mapping(uint256 => uint256) proposalsId;
    }

    struct Proposal {
        string name;
        bytes callData;
        address recipient;
        State state;
        mapping(address => bool) voters;
        uint256 votesFor; //votes for making a decision (true vote)
        uint256 totalVote;
        uint256 timeBegin;
        uint256 timeEnd;
        uint256 minQuorum;
        uint256 voteResult;
        uint256 voteCost;
        bool successfully;
    }

    mapping(uint256 => Proposal) public proposals;
    mapping(address => uint256) public userBalance;
    mapping(address => User) public users;

    event AddProposal(
        uint256 proposalId, 
        string name, 
        bytes callData, 
        address recipient,
        uint256 minQuorum,
        uint256 timeBegin, 
        uint256 timeEnd
    );

    event Deposit(address userAddress, uint256 amount);
    event Vote(uint256 proposalId, address msgSender, bool solution, uint256 userBalance, uint256 totalVote, uint256 time);
    event FinishVote(uint256 proposalId, address msgSender, bool Successfully, uint256 time);
    event Withdraw(address msgSender, uint256 userBalance, uint256 time);

    /// @notice MyDAO constructor, sets default values
    /// @param _minQuorum the minimum percentage that a vote must overcome to win
    /// @param _periodInDays number of voting days
    /// @param _tokenAddress token address
    constructor (uint256 _minQuorum, uint256 _periodInDays, address _tokenAddress) {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        minQuorum = _minQuorum;
        period = _periodInDays * 86400;//86400 - number of seconds in one day
        token = IERC20(_tokenAddress);
    }

    /// @notice addProposal create new proposal
    /// @param _name name of the vote
    /// @param _callData the called function as a hash
    /// @param _recipient the address of the contract that will call callData
    function addProposal(string memory _name, bytes memory _callData, address _recipient) external {

        require(_recipient != address(0), "addProposal:: recipient = 0");
        Proposal storage proposal = proposals[proposalId];
        proposal.name = _name;
        proposal.callData = _callData;
        proposal.recipient = _recipient;

        proposal.minQuorum = minQuorum;
        proposal.timeBegin = block.timestamp;
        proposal.timeEnd = proposal.timeBegin + period;
        proposal.state = State.Active;
        
        emit AddProposal(
            proposalId, 
            proposal.name, 
            proposal.callData, 
            proposal.recipient,
            proposal.minQuorum,
            proposal.timeBegin,
            proposal.timeEnd
        );
        proposalId++;
    }

    /// @notice deposit creates a deposit for the user
    /// @param _amount the number of tokens that the user sends to the deposit

    function deposit (uint256 _amount) external {
        require(_amount > 0, "deposit:: amount < 0");
        require(token.balanceOf(msg.sender) >= _amount, "deposit:: user does not have enough money in the account");
        token.safeTransferFrom(msg.sender, address(this), _amount);
        userBalance[msg.sender] = _amount;
        
        emit Deposit(msg.sender, _amount);
    }

    /// @notice vote voting function
    /// @param _solution decision for or against from the user
    /// @param _proposalId id voting in which the user wants to participate
    function vote(bool _solution, uint256 _proposalId) external {
        Proposal storage proposal = proposals[_proposalId];
        User storage user = users[msg.sender];
        require(proposal.state == State.Active, "vote:: proposals do not have status Active");

        require(!proposal.voters[msg.sender], "vote:: user has already voted in this poll");
        require(userBalance[msg.sender] > 0, "vote:: the user does not have enough tokens on the account");     
        proposal.voters[msg.sender] = true;
        proposal.totalVote += 1;
        uint256 votesFor = _solution ? 1 : 0;
        proposal.votesFor += votesFor;
        
        user.proposalsId[user.totalVotes] = _proposalId;
        user.totalVotes++;

        emit Vote(_proposalId, msg.sender, _solution, userBalance[msg.sender], proposal.totalVote, block.timestamp);
    }

    /// @notice finishVote finished vote
    /// @param _proposalId id voting in which the user wants to finish
    function finishVote(uint256 _proposalId) external {
        Proposal storage proposal = proposals[_proposalId];
        require(proposal.state == State.Active, "finishVote:: proposals do not have status Active");
        require(proposal.timeEnd < block.timestamp, "finishVote:: time for voting is not over yet");

        require(proposal.totalVote >= minQuorum, "finishVote:: not enough users voted"); 
        //я не понял можно ли завершить голосование если minQuorum не преодален, поэтому сделал что нельзя
            // хотя впринципе можно обернуть в if else код с 141 по 150 строчку и если не порог
                // не пройдет то завершать голосование proposal.state = State.Finished, но не присваивать proposal.successfully = true;
        
        if(proposal.votesFor*100/proposal.totalVote > 50) {
            (bool success, bytes memory data) = proposal.recipient.call(proposal.callData);
            proposal.voteResult = proposal.votesFor*100/proposal.totalVote; //оставил чтобы отслеживать результаты в процентах
            if(!success) {
                proposal.state = State.BrokenCallData;
            }else {
                proposal.state = State.Finished;
                proposal.successfully = true;
            }
        }else {
            proposal.state = State.Finished;
            proposal.successfully = true;
        }
        
        emit FinishVote(_proposalId, msg.sender, proposal.successfully, block.timestamp); 
    }

    /// @notice withdraw the function will return the deposit to the user
    function withdraw(uint256 _amount) external nonReentrant() {
        User storage user = users[msg.sender];
        bool isAllProposalEnd = true;
        require(userBalance[msg.sender] >= _amount, "withraw:: the user does not have so many tokens in the deposit");
        for (uint256 i = 0; i < user.totalVotes; i++) { // не придумал как сделать без цикла
            if(proposals[user.proposalsId[i]].state != State.Finished) {
                isAllProposalEnd = false;
            }
        }
        require(isAllProposalEnd != false, "withraw:: not all proposals is finished");
        userBalance[msg.sender] -= _amount;
        token.safeTransfer(msg.sender, _amount);
        emit Withdraw(msg.sender, userBalance[msg.sender], block.timestamp);

    }

    /// @notice getUserBalance the function will return information about proposal
    /// @param _proposalId proposal id
    /// @return proposalInfo
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
            proposal.minQuorum,
            proposal.voteResult
        );
    }

    /// @notice getUserVoteInfoFromProposal the function will return information about user in current proposal
    /// @param _proposalId proposal id
    /// @param _userAddress user address
    /// @return user info in current proposal

    function getUserVoteInfoFromProposal(uint256 _proposalId, address _userAddress) external view returns (bool) {
        Proposal storage proposal = proposals[_proposalId];
        return proposal.voters[_userAddress];

    }
}