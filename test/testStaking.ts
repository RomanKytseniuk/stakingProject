const truffleAssert = require("truffle-assertions");
const { ethers, upgrades } = require("hardhat");
const { assert } = require("hardhat");
const { web3 } = require("hardhat");
const { artifacts } = require("hardhat");
const { time } = require("@openzeppelin/test-helpers");

// ========= import artifacts ========= //
const AgregatorTestPrice = artifacts.require("AgregatorTestPrice");
const TestStaking = artifacts.require("TestStaking");
const TestToken = artifacts.require("TestToken");
const RewardToken = artifacts.require("RewardToken");

//  ======== 1e18 ========= //
const bn1e18 = web3.utils.toBN(1e18);

describe("TestStaking", () => {
	let accounts: any;
	let owner: any;
	let payer: any;
	let testTokenInstance: any;
	let rewardTokenInstance: any;
	let testStakingInstance: any;
	let tokenPrice: any;

	beforeEach(async function () {
		accounts = await web3.eth.getAccounts();

		owner = accounts[0];
		payer = accounts[1];

		tokenPrice = await AgregatorTestPrice.new();

		testTokenInstance = await TestToken.new();
		rewardTokenInstance = await RewardToken.new();

		testStakingInstance = await TestStaking.new(
			testTokenInstance.address,
			rewardTokenInstance.address
		);

		rewardTokenInstance.mint(testStakingInstance.address, bn1e18.muln(1000), {
			from: owner,
		});

		testTokenInstance.mint(payer, 10, { from: owner });
		testStakingInstance.addAllowedTokens(testTokenInstance.address, {
			from: owner,
		});
		await testStakingInstance.setPriceFeedContract(
			testTokenInstance.address,
			tokenPrice.address,
			{ from: owner }
		);
	});

	describe("stakeTokens", function () {
		it("user Balance should be > 0", async () => {
			const payerAmount = await testTokenInstance.balanceOf(payer);

			assert.equal(
				true,
				web3.utils.toBN(payerAmount).eq(web3.utils.toBN(10e18))
			);
		});
		it("should return token value", async () => {
			const price = await testStakingInstance.getTokenValue(
				testTokenInstance.address
			);

			assert.equal(
				true,
				web3.utils
					.toBN(price)
					.eq(web3.utils.toBN(214713221102546).div(web3.utils.toBN(100000000)))
			);
		});

		it("Should stake token", async () => {
			const payerAmountBefore = await testTokenInstance.balanceOf(payer);
			const StakingAmountBefore = await testTokenInstance.balanceOf(
				testStakingInstance.address
			);
			const days = 3;

			await testTokenInstance.approve(
				testStakingInstance.address,
				web3.utils.toBN(10e18),
				{ from: payer }
			);

			await testStakingInstance.stakeTokens(
				web3.utils.toBN(10e18),
				testTokenInstance.address,
				days,
				{ from: payer }
			);

			const StakingAmountAfter = await testTokenInstance.balanceOf(
				testStakingInstance.address
			);

			assert.equal(
				true,
				web3.utils
					.toBN(payerAmountBefore)
					.eq(
						web3.utils
							.toBN(StakingAmountAfter)
							.sub(web3.utils.toBN(StakingAmountBefore))
					)
			);
		});

		it("Should withdraw ", async () => {
			const payerRewardAmountBefore = await rewardTokenInstance.balanceOf(
				payer
			);
			const payerAmountBefore = await testTokenInstance.balanceOf(payer);
			const days = 3;
			const period = 86400 * days;

			await testTokenInstance.approve(
				testStakingInstance.address,
				web3.utils.toBN(10e18),
				{ from: payer }
			);
			await testStakingInstance.stakeTokens(
				web3.utils.toBN(10e18),
				testTokenInstance.address,
				days,
				{ from: payer }
			);

			const tokenReward = await testStakingInstance.rewardsAmountFunction(
				payer
			);
			console.log(tokenReward.toString() / 10e18);

			await time.increase(period + 1);

			await testStakingInstance.withdraw(testTokenInstance.address, {
				from: payer,
			});

			const payerRewardAmountAfter = await rewardTokenInstance.balanceOf(payer);
			const payerAmountAfter = await testTokenInstance.balanceOf(payer);
			const StakingAmountAfter = await testTokenInstance.balanceOf(
				testStakingInstance.address
			);

			assert.equal(
				true,
				web3.utils
					.toBN(payerRewardAmountAfter)
					.eq(
						web3.utils
							.toBN(payerRewardAmountBefore)
							.add(web3.utils.toBN(tokenReward))
					)
			);
			assert.equal(
				true,
				web3.utils
					.toBN(StakingAmountAfter)
					.eq(
						web3.utils
							.toBN(payerAmountAfter)
							.sub(web3.utils.toBN(payerAmountBefore))
					)
			);
		});
	});
});
