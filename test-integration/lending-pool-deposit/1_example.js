// Util classes
const BigNumber = require("bignumber.js");
const { zerocollateral, tokens } = require("../../scripts/utils/contracts");
const { lendingPool } = require('../../test/utils/events');
const { toDecimals } = require('../../test/utils/consts');
const assert = require("assert");

module.exports = async ({accounts, getContracts, timer}) => {
  console.log('Integration Test Example.');
  const senderTxConfig = await accounts.getTxConfigAt(1);
  const tokenName = 'dai';
  const dai = await getContracts.getDeployed(tokens.get(tokenName));
  const zdai = await getContracts.getDeployed(zerocollateral.ztoken(tokenName));
  const amountWei = toDecimals(100, 18);
  await dai.mintTo(senderTxConfig.from, amountWei, senderTxConfig);

  const lendingPoolZDai = await getContracts.getDeployed(zerocollateral.lendingPool(tokenName));
  const lendingToken = await lendingPoolZDai.lendingToken();
  assert(lendingToken === dai.address, "Lending token and token are not equal.");

  const initialZdaiSenderBalance = await zdai.balanceOf(senderTxConfig.from);

  console.log(`Depositing ${tokenName} into the lending pool...`);
  await dai.approve(
    lendingPoolZDai.address,
    amountWei.toString(),
    senderTxConfig
  );
  const depositResult = await lendingPoolZDai.deposit(amountWei.toString(), senderTxConfig);

  lendingPool
    .tokenDeposited(depositResult)
    .emitted(senderTxConfig.from, amountWei);
  const finalZdaiSenderBalance = await zdai.balanceOf(senderTxConfig.from);
  assert.equal(
    BigNumber(finalZdaiSenderBalance.toString()).minus(BigNumber(initialZdaiSenderBalance.toString())),
    amountWei.toString()
  );
};
