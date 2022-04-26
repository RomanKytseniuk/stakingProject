const TestStaking = artifacts.require("TestStaking");
const TestToken = artifacts.require("TestToken");
const RewardToken = artifacts.require("RewardToken");

module.exports = async function (deployer) {
	await deployer.deploy(TestToken);
	await deployer.deploy(RewardToken);
	await deployer.deploy(TestStaking, TestToken.address, RewardToken.address);
};
