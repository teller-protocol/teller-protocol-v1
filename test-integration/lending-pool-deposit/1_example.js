// Util classes
const BigNumber = require("bignumber.js");
const {zerocollateral, tokens} = require("../../scripts/utils/contracts");
const assert = require("assert");

module.exports = async ({accounts, getContracts, timer}) => {
  console.log('Integration Test Example.');
  const sender = accounts[1];
  const senderTxConfig = { from: sender };
  const dai = await getContracts.getDeployed(tokens.Dai);
  const amount = 100;
  const amountBigNumber = new BigNumber(amount).times(
    new BigNumber(10).pow(18)
  );
  await dai.mintTo(sender, amountBigNumber, senderTxConfig);

  const lendingPoolZDai = await getContracts.getDeployed(
    zerocollateral.ZDai_LendingPool
  );

  const lendingToken = await lendingPoolZDai.lendingToken();

  assert(lendingToken === dai.address,"Lending token and token are not equal.");

  await dai.approve(
    lendingPoolZDai.address,
    amountBigNumber.toString(),
    senderTxConfig
  );
  await lendingPoolZDai.deposit(amountBigNumber.toString(), {from: sender});
};
