const { getNamedAccounts, ethers, deployments } = require("hardhat");
const { assert, expect } = require("chai");
const { developmentChain } = require("../../helper-hardhat-config");

!developmentChain.includes(network.name)
  ? describe.skip
  : describe("FundMe", async function () {
      let fundMe;
      let signer;
      let mockV3Aggregator;
      const sendValue = ethers.parseEther("1");

      beforeEach(async function () {
        // deployer = (await getNamedAccounts()).deployer;
        // await deployments.fixture("all");
        // fundMe = await ethers.getContract("FundMe", deployer);
        const accounts = await ethers.getSigners();
        signer = accounts[0];
        await deployments.fixture(["all"]);

        const fundMeDeployment = await deployments.get("FundMe");
        fundMe = await ethers.getContractAt(
          fundMeDeployment.abi,
          fundMeDeployment.address,
          signer
        );
        //mockV3Aggregator = await ethers.getContract("MockV3Aggregator", deployer);

        const MockV3AggregatorDeployment = await deployments.get(
          "MockV3Aggregator"
        );
        mockV3Aggregator = await ethers.getContractAt(
          MockV3AggregatorDeployment.abi,
          MockV3AggregatorDeployment.address,
          signer
        );
      });

      describe("constructor", async function () {
        it("set aggregator address correctly", async function () {
          const response = await fundMe.getPriceFeed();
          assert.equal(response, mockV3Aggregator.target);
        });
      });

      describe("fund", async function () {
        it("Fails if you dont send enough eth", async function () {
          await expect(fundMe.fund()).to.be.revertedWith(
            "Didn't send enough gas"
          );
        });

        it("fails if you don't send enough eth", async function () {
          await fundMe.fund({ value: sendValue });
          const response = await fundMe.getAddressToAmt(signer.address);
          assert.equal(response.toString(), sendValue.toString());
        });

        it("updated the amount funded data structure", async function () {
          await fundMe.fund({ value: sendValue });
          const funder = await fundMe.getFunders(0);
          assert.equal(funder, signer.address);
        });
      });

      describe("withdraw", async function () {
        beforeEach(async function () {
          await fundMe.fund({ value: sendValue });
        });

        it("withdraw ETH froma single founder", async function () {
          //Arrange
          const startingFundMeBalance = await ethers.provider.getBalance(
            fundMe.target
          );
          const startingSignerBalance = await ethers.provider.getBalance(
            signer.address
          );

          //Act
          const transactionResponse = await fundMe.withdraw();
          const transactionReceipt = await transactionResponse.wait(1);

          const { gasUsed, gasPrice } = transactionReceipt;
          const gascost = gasUsed * gasPrice;

          const endingFundMeBalance = await ethers.provider.getBalance(
            fundMe.target
          );
          const endingSignerBalance = await ethers.provider.getBalance(
            signer.address
          );
          //Assert
          assert.equal(endingFundMeBalance, 0);
          assert.equal(
            startingFundMeBalance + startingSignerBalance,
            endingSignerBalance + gascost
          );
        });

        it("allow us to withdraw with multiple getFunder", async function () {
          const accounts = await ethers.getSigners();
          for (i = 1; i < 6; i++) {
            const fundMeConnectedContract = await fundMe.connect(accounts[i]);
            await fundMeConnectedContract.fund({ value: sendValue });
          }
          const startingFundMeBalance = await ethers.provider.getBalance(
            fundMe.target
          );
          const startingSignerBalance = await ethers.provider.getBalance(
            signer.address
          );

          //Act
          const transactionResponse = await fundMe.withdraw();
          const transactionReceipt = await transactionResponse.wait(1);

          const { gasUsed, gasPrice } = transactionReceipt;
          const gascost = gasUsed * gasPrice;

          const endingSignerBalance = await ethers.provider.getBalance(
            signer.address
          );
          const endingFundMeBalance = await ethers.provider.getBalance(
            fundMe.target
          );

          assert.equal(endingFundMeBalance, 0);
          assert.equal(
            startingFundMeBalance + startingSignerBalance,
            endingSignerBalance + gascost
          );

          //make sure that getFunder are reset properly
          await expect(fundMe.getFunders(0)).to.be.reverted;

          for (i = 1; i < 6; i++) {
            assert.equal(await fundMe.getAddressToAmt(accounts[i].address), 0);
          }
        });
        it("only allow owner to withdraw", async function () {
          const accounts = await ethers.getSigners();
          const attacker = accounts[1];
          const attackerConnectedContract = await fundMe.connect(attacker);

          await expect(
            attackerConnectedContract.withdraw()
          ).to.be.revertedWithCustomError(fundMe, "FundMe__NotOwner()");
        });

        it("cheaper withdraw ", async function () {
          const accounts = await ethers.getSigners();
          for (i = 1; i < 6; i++) {
            const fundMeConnectedContract = await fundMe.connect(accounts[i]);
            await fundMeConnectedContract.fund({ value: sendValue });
          }
          const startingFundMeBalance = await ethers.provider.getBalance(
            fundMe.target
          );
          const startingSignerBalance = await ethers.provider.getBalance(
            signer.address
          );

          //Act
          const transactionResponse = await fundMe.cheaperWithdraw();
          const transactionReceipt = await transactionResponse.wait(1);

          const { gasUsed, gasPrice } = transactionReceipt;
          const gascost = gasUsed * gasPrice;

          const endingSignerBalance = await ethers.provider.getBalance(
            signer.address
          );
          const endingFundMeBalance = await ethers.provider.getBalance(
            fundMe.target
          );

          assert.equal(endingFundMeBalance, 0);
          assert.equal(
            startingFundMeBalance + startingSignerBalance,
            endingSignerBalance + gascost
          );

          //make sure that getFunder are reset properly
          await expect(fundMe.getFunders(0)).to.be.reverted;

          for (i = 1; i < 6; i++) {
            assert.equal(await fundMe.getAddressToAmt(accounts[1].address), 0);
          }
        });
      });
    });
