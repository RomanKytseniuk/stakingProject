// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../node_modules/@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "../node_modules/@openzeppelin/contracts/access/Ownable.sol";

contract TestToken is Ownable, ERC20("TestToken" , "TET") {
    function mint(address _to, uint256 _amount) public onlyOwner{
        _mint(_to,_amount* 1e18);
    }
}