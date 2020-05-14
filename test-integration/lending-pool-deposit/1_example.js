// Util classes
const BigNumber = require("bignumber.js");
const {zerocollateral, tokens} = require("../../scripts/utils/contracts");
const { lendingPool } = require('../../test/utils/events');
const assert = require("assert");

module.exports = async ({accounts, getContracts, timer}) => {
  console.log('Integration Test Example.');
  const sender = accounts[1];
  const senderTxConfig = { from: sender };
  const dai = await getContracts.getDeployed(tokens.Dai);
  const zdai = await getContracts.getDeployed(zerocollateral.ZDai);
  const amount = 100;
  const amountWei = new BigNumber(amount).times(new BigNumber(10).pow(18));
  await dai.mintTo(sender, amountWei, senderTxConfig);

  const lendingPoolZDai = await getContracts.getDeployed(zerocollateral.ZDai_LendingPool);
  const lendingToken = await lendingPoolZDai.lendingToken();

  assert(lendingToken === dai.address,"Lending token and token are not equal.");

  await dai.approve(
    lendingPoolZDai.address,
    amountWei.toString(),
    senderTxConfig
  );
  const depositResult = await lendingPoolZDai.deposit(amountWei.toString(), {from: sender});

  lendingPool
    .tokenDeposited(depositResult)
    .emitted(sender, amountWei);
  const zdaiSenderBalance = await zdai.balanceOf(sender);
  assert.equal(zdaiSenderBalance.toString(), amountWei.toString());
};
