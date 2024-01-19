const { getNamedAccounts, network } = require("hardhat");
const { developmentChain } = require("../../helper-hardhat-config");
const { assert } = require("chai");

developmentChain.includes(network.name)
  ? describe.skip
  : describe("FundMe", async function () {
      let fundMe;
      let signer;
      const sendValue = ethers.parseEther("0.1");
      beforeEach(async function () {
        signer = await getNamedAccounts().signer;
        const fundMeDeployment = await deployments.get("FundMe");
        fundMe = await ethers.getContractAt(
          fundMeDeployment.abi,
          fundMeDeployment.address,
          signer
        );
      });

      it("allows people to fund and withdraw", async function () {
        await fundMe.fund({ value: sendValue });
        const transactionResponse = await fundMe.withdraw();

        const endingFundMeBalance = await ethers.provider.getBalance(
          fundMe.target
        );

        assert.equal(endingFundMeBalance, "0");
      });
    });
