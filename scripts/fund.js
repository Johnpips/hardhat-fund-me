const { getNamedAccounts } = require("hardhat");

async function main() {
  const { signer } = await getNamedAccounts();
  const fundMeDeployment = await deployments.get("FundMe");
  fundMe = await ethers.getContractAt(
    fundMeDeployment.abi,
    fundMeDeployment.address,
    signer
  );
  console.log("funding contract....");
  const transactionResponse = await fundMe.fund({
    value: ethers.parseEther("0.1"),
  });
  await transactionResponse.wait(1);
  console.log("funded!!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
