// Util classes
const BigNumber = require("bignumber.js");
const { teller, tokens } = require("../../scripts/utils/contracts");
const { lendingPool } = require('../../test/utils/events');
const { toDecimals } = require('../../test/utils/consts');
const assert = require("assert");

module.exports = async ({processArgs, accounts, getContracts, timer}) => {
  console.log('Integration Test Example.');
  const senderTxConfig = await accounts.getTxConfigAt(1);
  const tokenName = processArgs.getValue('testTokenName');
  const dai = await getContracts.getDeployed(tokens.get(tokenName));
  const tdai = await getContracts.getDeployed(teller.ttoken(tokenName));
  const amountWei = toDecimals(100, 18);
  await dai.mint(senderTxConfig.from, amountWei, senderTxConfig);

  const lendingPoolTDai = await getContracts.getDeployed(teller.eth().lendingPool(tokenName));
  const lendingToken = await lendingPoolTDai.lendingToken();
  assert(lendingToken === dai.address, "Lending token and token are not equal.");

  const initialTdaiSenderBalance = await tdai.balanceOf(senderTxConfig.from);

  console.log(`Depositing ${tokenName} into the lending pool...`);
  await dai.approve(
    lendingPoolTDai.address,
    amountWei.toString(),
    senderTxConfig
  );
  const depositResult = await lendingPoolTDai.deposit(amountWei.toString(), senderTxConfig);

  lendingPool
    .tokenDeposited(depositResult)
    .emitted(senderTxConfig.from, amountWei);
  const finalTdaiSenderBalance = await tdai.balanceOf(senderTxConfig.from);
  assert.equal(
    BigNumber(finalTdaiSenderBalance.toString()).minus(BigNumber(initialTdaiSenderBalance.toString())),
    amountWei.toString()
  );
};
