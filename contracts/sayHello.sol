// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;


import "hardhat/console.sol";

contract SayHello {
    string name;
    event helloEvent(string name);
    
    function hello(string memory _name) external {
        name = _name;
        emit helloEvent(_name);
    }

    function getName() external view returns(string memory) {
        return name;
    }
}
