const BigNumber = require("bignumber.js");

const { teller, tokens } = require("../../../../../scripts/utils/contracts");
const {
  loans: loansActions,
  escrow: escrowActions
} = require("../../../../utils/actions");
const { takeOutNewLoan } = require("../../../../utils/takeOutNewLoan");
const { toDecimals, toBytes32 } = require("../../../../../test/utils/consts");

module.exports = async (testContext) => {
  const { processArgs, getContracts, accounts, web3 } = testContext

  const collTokenName = "ETH";
  const sourceTokenName = "DAI"

  const verbose = processArgs.getValue("verbose");

  const contracts = await getContracts.getAllDeployed({ teller, tokens }, sourceTokenName, collTokenName);
  const { token, settings } = contracts

  const borrower = await accounts.getAt(1);
  const initialOraclePrice = toDecimals("0.00295835", 18); // 1 token = 0.00295835 ether = 5000000000000000 wei
  const decimals = parseInt(await token.decimals());
  const lendingPoolDepositAmountWei = toDecimals(4000, decimals);
  const amountWei = toDecimals(100, decimals);
  const maxAmountWei = toDecimals(200, decimals);
  const durationInDays = 5;
  const signers = await accounts.getAllAt(12, 13);
  const collateralNeeded = "320486794520547945";
  const secured = false
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

  const destinationToken = await getContracts.getDeployed(tokens.get('USDC'))

  const tokensPath = [ token, destinationToken ]
  const sourceAmount = loan.borrowedAmount.toString()
  const minDestinationBalance = '100000000000000000'
  await escrowActions.dapp.uniswap.swap(contracts, context,
    { tokensPath, sourceAmount, minDestination: minDestinationBalance, shouldFail: true, expectedRevertReason: 'DAPP_UNSECURED_NOT_ALLOWED' }
  )
};