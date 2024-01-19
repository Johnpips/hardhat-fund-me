const { getNamedAccounts } = require("hardhat");

async function main() {
  const { signer } = await getNamedAccounts();
  const fundMeDeployment = await deployments.get("FundMe");
  fundMe = await ethers.getContractAt(
    fundMeDeployment.abi,
    fundMeDeployment.address,
    signer
  );

  console.log("withdrawing");
  const transactionResponse = await fundMe.withdraw();
  await transactionResponse.wait(1);
  console.log("Got it back");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
