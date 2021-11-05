// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

import "hardhat/console.sol";  // не используется!!!!
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol"; // не используется!!!!
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";// не используется!!!!
import "hardhat/console.sol";      // не используется!!!! дважды 
import "./coinDAO.sol";             // не используется!!!! когда отдаешь на проверку работу надо чистить код 

/// @title MyDaO
/// @author Lenarqa
/// @notice You can use this for creating dao 
/// @dev All function calls are currently implemented without side effects

contract MyDAO is AccessControl{
    using SafeERC20 for IERC20;
    
    IERC20 private token;                   //TODO: переменные поумолчани private. если бы ты их сделал паблик то избавился бы от геторов
    uint256 private proposalId;
    uint256 private minQorum;
    uint256 private period;
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

    mapping(uint256 => Proposal) private proposals;
    mapping(address => User) private users;
    mapping(address => uint256) private usersDeposit;

    /// @notice MyDAO constructor, sets default values
    /// @param _minQorum the minimum percentage that a vote must overcome to win
    /// @param _periodInDays number of voting days
    /// @param _voteCost voting cost
    /// @param _tokenAddress token address
    constructor (uint256 _minQorum, uint256 _periodInDays, uint256 _voteCost, address _tokenAddress) {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        minQorum = _minQorum;
        period = _periodInDays * 86400;//86400 - number of seconds in one day
        voteCost = _voteCost;
        token = IERC20(_tokenAddress);
    }

    /// @notice addProposal create new proposal
    /// @param _name name of the vote
    /// @param _callData the called function as a hash
    /// @param _recipient the address of the contract that will call callData
    function addProposal(string memory _name, bytes memory _callData, address _recipient) external {
        require(proposals[proposalId].state == State.Undefined, "addProposal:: State is not inderfined");       //TODO: proposalId++ оно всегда будет проходить, лишний код
        require(_recipient != address(0), "addProposal:: recipient = 0");
        Proposal storage proposal = proposals[proposalId];
        proposal.name = _name;
        proposal.callData = _callData;
        proposal.recipient = _recipient;
        proposal.timeBegin = block.timestamp;                   //TODO можно не записывать достаточно указать в event, которого здесь нет 
        proposal.timeEnd = proposal.timeBegin + period;
        proposal.minQorum = minQorum;
        proposal.state = State.Active;
        proposalId++;
    }

    /// @notice deposit creates a deposit for the user
    /// @param _amount the number of tokens that the user sends to the deposit
    function deposit (uint256 _amount) external {           //TODO: есть грубая ошибка,из-за которой пользоваться этой функцией нельзя. 
        token.safeTransferFrom(msg.sender, address(this), _amount);
        usersDeposit[msg.sender] = _amount;
        //TODO:EVENT?
    }

    /// @notice vote voting function
    /// @param _solution decision for or against from the user
    /// @param _proposalId id voting in which the user wants to participate
    function vote(bool _solution, uint256 _proposalId) external {
        Proposal storage proposal = proposals[_proposalId];
        require(proposal.state == State.Active, "vote:: proposals do not have status Active");
        require(!proposal.voters[msg.sender].voted, "vote:: user has already voted in this poll");
        require(usersDeposit[msg.sender] > voteCost, "vote:: the user does not have enough tokens on the account");     
        //TODO: не понимаю что такое voteCost, пользователь голосуют всем своим балансом. Надо просто проверить , что его баланс больше нуля
        proposal.voters[msg.sender].voted = true;
        proposal.voteCost = voteCost;   //TODO: вот это вообще не понимаю зачем перезаписывать одно и то же число 
        proposal.voters[msg.sender].amount = proposal.voteCost; 
        //TODO: в принципе это можно даже не записывать достаточно засунуть в евент его баланс, которым он проголосовал. Где евент?
        proposal.totalVote += proposal.voteCost;    // заменить на его баланс
        uint256 votesFor = _solution ? proposal.voteCost : 0;
        proposal.votesFor += votesFor;      
        usersDeposit[msg.sender] -= proposal.voteCost;      // токены не одноразовые, списывать с баланса не надо
        /* Пользователь может голосовать только всеми своими токенами.
        Если идут несколько голосований параллельно то он может участвовать во всех голосованиях и в каждом всеми своими токенами
        */
    }

    /// @notice finishVote finished vote
    /// @param _proposalId id voting in which the user wants to finish
    function finishVote(uint256 _proposalId) external {
        Proposal storage proposal = proposals[_proposalId];
        require(proposal.state == State.Active, "finishVote:: proposals do not have status Active");
        require(proposal.timeEnd < block.timestamp, "finishVote:: time for voting is not over yet");
        proposal.roundResult = proposal.votesFor*100/proposal.totalVote;
        //TODO: minQuorum это минимально число участнииков не процент
        if(proposal.roundResult > proposal.minQorum) {//TODO: minQ'U'orum
        //TODO: if(proposal.votesFor*100/proposal.totalVote > 50)
            // address(this).call(proposal.callData);
            // require(proposal.recipient.call(proposal.callData, "lee"));  //TODO: если это не используется то надо удалять 
            (bool success, bytes memory data) = proposal.recipient.call(proposal.callData); 
            //TODO: зачем это (bool success, bytes memory data) если оно не используется
        }
        proposal.state = State.Finished;
        //TODO: а если байт код был битый и вызов функции не отработал? должно быть в proposal.state и proposal.successfully 
        //TODO:где евент?
    }

    /// @notice withdraw the function will return the deposit to the user
    function withdraw() external {      //TODO: если я хочу вывести не все ?
    // нет защиты от реентерабельных вызовов. https://docs.openzeppelin.com/contracts/2.x/api/utils#ReentrancyGuard
    
        for (uint256 i = 0; i < proposalId; i++) {
            require(proposals[i].state == State.Finished, "withdraw:: not all proposal finished");
            //TODO: если началось голосование, а пользователь в нем не участвует, он все равно не может вывести свои токены. Почему?
            if(proposals[i].state == State.Finished) {
                usersDeposit[msg.sender] += proposals[i].voters[msg.sender].amount;

            }
        }
        token.transfer(msg.sender, usersDeposit[msg.sender]);
        //TODO: нет обертки вокруг операций ERC20, которые вызывают сбой (когда контракт токена возвращает false) safeTransfer
        
        usersDeposit[msg.sender] = 0;
        // event????????????
    }

    /// @notice getUserBalance the function will return user deposit balance
    /// @return user deposit balance
    function getUserBalance() external view returns(uint256) {      //TODO: если бы мапа была публичной можно было бы не делать гетер
        return usersDeposit[msg.sender];
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
            proposal.minQorum,
            proposal.roundResult
        );
    }

    /// @notice getUserProposalInfoFrom the function will return information about user in current proposal
    /// @param _proposalId proposal id
    /// @param _userAddress user address
    /// @return user info in current proposal
    function getUserProposalInfoFrom(uint256 _proposalId, address _userAddress) external view returns (
        bool,
        uint256
    ) {
     //TODO:почему нельзя было засунуть всю структуру в returns( User memory)
        User storage voter = proposals[_proposalId].voters[_userAddress]; 
        return (
            voter.voted,
            voter.amount
        );
    }

    /// @notice getVoteCost the function will return vote cost
    /// @return return vote cost
    function getVoteCost() external view  returns(uint256){
        return voteCost;
    }

    /// @notice setVoteCost the function will set new vote cost
    /// @param _voteCost new vote cost
    function setVoteCost(uint256 _voteCost) external  onlyRole(DEFAULT_ADMIN_ROLE){ //TODO: лучше добавить еще одну роль ADMIN
        voteCost = _voteCost;
    }

    /// @notice getMinQorum the function will rerurn new minimum qorum
    /// @return return minQorum
    function getMinQorum() external view returns(uint256) {
        return minQorum;
    }

    /// @notice setMinQorum the function will set new min qorum
    /// @param _minQorum new min qorum
    function setMinQorum(uint256 _minQorum) external onlyRole(DEFAULT_ADMIN_ROLE){
        minQorum = _minQorum;
    }

    /// @notice getPeriod the function will rerurn period
    /// @return return period
    function getPeriod() external view returns(uint256) {
        return period;
    }

    /// @notice setPeriod the function will set new period in seconds, for test in rinkeby
    /// @param _period new vote cost
    function setPeriod(uint256 _period) external onlyRole(DEFAULT_ADMIN_ROLE){
        period = _period;//use seconds for rinkeby test 
        // period = _period * 86400;
    }

    /// @notice testCallSignature the function for test call function
    /// @param _addr the address of the contract that will call the function
    /// @param _signature hash of the called function
    function testCallSignature(address _addr, bytes memory _signature) public payable{ // todo: если бы эта функция попала в мэйн .........
        (bool success, bytes memory data) = _addr.call(_signature);
    }

}
