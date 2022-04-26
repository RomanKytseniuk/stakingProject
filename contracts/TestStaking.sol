// SPDX-License-Identifier: MIT
pragma solidity 0.8.13;

import "../node_modules/@openzeppelin/contracts/access/Ownable.sol";
import "../node_modules/@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../node_modules/@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";


contract TestStaking is Ownable {
    // ========== Storages ========== //

    mapping(address => mapping(address => uint256)) public stakingBalances;
    mapping(address => address) public tokenPriceFeedMapping;
    mapping(address => uint256) private rewardsAmount;
    mapping(address => uint256) private lockTime;
    mapping(address => bool) isAllowed;

    // ========== Tokens ========== //

    IERC20 public depositToken;
    IERC20 public rewardToken;

    constructor(address _depositToken, address _rewardToken) {
        depositToken = IERC20(_depositToken);
        rewardToken = IERC20(_rewardToken);
    }
    // ========== set Price Feed contract ========== //

    function setPriceFeedContract(address _token, address _priceFeed) public onlyOwner {
        tokenPriceFeedMapping[_token] = _priceFeed;
    }

    // ========== token price ========== //

    function getTokenValue(address _token) public view returns (uint256) {
        address priceFeedAddress = tokenPriceFeedMapping[_token];
        AggregatorV3Interface priceFeed = AggregatorV3Interface(priceFeedAddress);
        (,int256 price,,,)= priceFeed.latestRoundData();
        return (uint256(price)/100000000);
    }

    // ========== function to stake tokens ========== //
    function stakeTokens(uint256 _amount,address _token, uint256 _days) public {
        require(_days > 0 && _days < 365, "Min time lock = 1 day | Max 1 year");
        require(_amount > 0, " Amount cannot be 0");
        require(tokenIsAllowed(_token), "token isn`t allowed");

    //  1 day = 86400 
        uint256 period = _days * 86400; 

        rewardsAmount[msg.sender] = (getTokenValue(_token) * _amount * _days) / 10000;
        IERC20(_token).transferFrom(msg.sender, address(this), _amount);
        stakingBalances[_token][msg.sender] =
            stakingBalances[_token][msg.sender] +
            _amount;
        lockTime[msg.sender] = block.timestamp + period;
    }
    // ========== withdraw function ========== //
    
    function withdraw(address _token) public {
        uint256 rewardBalance = rewardsAmount[msg.sender];
        uint256 balance = stakingBalances[_token][msg.sender];

        require(rewardBalance > 0, "rewardbalance cannot be 0");
        require(stakingBalances[_token][msg.sender] > 0, "balance cannot be 0");
        require(
            block.timestamp > lockTime[msg.sender],
            "lock time has not expired"
        );

        stakingBalances[_token][msg.sender] = 0;
        rewardsAmount[msg.sender] = 0;

        IERC20(rewardToken).transfer(msg.sender, rewardBalance);
        IERC20(_token).transfer(msg.sender, balance);
    }

    // ========== check user amount function ========== //
    function rewardsAmountFunction(address _user)public view returns (uint) {
        return rewardsAmount[_user];
    }
    // ========== add token allowance ========== //
        function addAllowedTokens(address _token) public onlyOwner {
        require(!isAllowed[_token]);
        isAllowed[_token] = true;
    }
    // ========== check token allowance ========== //
    function tokenIsAllowed(address _token) public view returns (bool) {
        return isAllowed[_token];
    }
}
