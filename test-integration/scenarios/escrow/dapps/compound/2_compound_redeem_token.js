const BigNumber = require("bignumber.js");

const { teller, tokens, ctokens } = require("../../../../../scripts/utils/contracts");
const {
  loans: loansActions,
  escrow: escrowActions
} = require("../../../../utils/actions");
const { takeOutNewLoan } = require("../../../../utils/takeOutNewLoan");
const { toDecimals } = require("../../../../../test/utils/consts");

module.exports = async (testContext) => {
  const { processArgs, getContracts, accounts } = testContext

  const collTokenName = "ETH";
  const sourceTokenName = "DAI"

  const verbose = processArgs.getValue("verbose");

  const contracts = await getContracts.getAllDeployed({ teller, tokens }, sourceTokenName, collTokenName);
  const { token } = contracts

  const borrower = await accounts.getAt(1);
  const initialOraclePrice = toDecimals("0.00295835", 18); // 1 token = 0.00295835 ether = 5000000000000000 wei
  const decimals = parseInt(await token.decimals());
  const lendingPoolDepositAmountWei = toDecimals(4000, decimals);
  const amountWei = toDecimals(100, decimals);
  const maxAmountWei = toDecimals(200, decimals);
  const durationInDays = 5;
  const signers = await accounts.getAllAt(12, 13);
  const collateralNeeded = "320486794520547945";
  const secured = true
  const borrowerTxConfig = { from: borrower };
  const borrowerTxConfigWithValue = {
    ...borrowerTxConfig,
    value: collateralNeeded
  };
  const lenderTxConfig = await accounts.getTxConfigAt(0);

  const loan = await takeOutNewLoan(contracts, { testContext }, {
    borrower,
    borrowerTxConfig,
    borrowerTxConfigWithValue,
    initialOraclePrice,
    lenderTxConfig,
    lendingPoolDepositAmountWei,
    amountWei,
    maxAmountWei,
    secured,
    durationInDays,
    signers
  });

  const context = {
    txConfig: borrowerTxConfig,
    testContext
  }

  contracts.escrow = await loansActions.getEscrow(contracts, context,
    { loanId: loan.id }
  )

  contracts.cToken = await getContracts.getDeployed(ctokens.fromTokenName(sourceTokenName))

  const borrowedAmount = loan.borrowedAmount.toString()
  await escrowActions.dapp.compound.lend(contracts, context,
    { amount: borrowedAmount }
  )

  const cTokenDecimals = await contracts.cToken.decimals.call()
  const cTokenAmount = new BigNumber(1).times(new BigNumber(10).pow(cTokenDecimals.toString()))
  await escrowActions.dapp.compound.redeem(contracts, context,
    { amount: cTokenAmount.toString() }
  )
};