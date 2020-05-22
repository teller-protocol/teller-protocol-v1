// Util classes
const BigNumber = require("bignumber.js");
const { zerocollateral, tokens } = require("../../scripts/utils/contracts");
const { lendingPool } = require('../../test/utils/events');
const { toDecimals } = require('../../test/utils/consts');
const assert = require("assert");

module.exports = async ({accounts, getContracts, timer}) => {
  console.log('Integration Test Example.');
  const sender = await accounts.getAt(1);
  const senderTxConfig = { from: sender };
  const dai = await getContracts.getDeployed(tokens.get('Dai'));
  const zdai = await getContracts.getDeployed(zerocollateral.ztoken('Dai'));
  const amountWei = toDecimals(100, 18);
  await dai.mintTo(sender, amountWei, senderTxConfig);

  const lendingPoolZDai = await getContracts.getDeployed(zerocollateral.lendingPool('dai'));
  const lendingToken = await lendingPoolZDai.lendingToken();
  assert(lendingToken === dai.address, "Lending token and token are not equal.");

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
