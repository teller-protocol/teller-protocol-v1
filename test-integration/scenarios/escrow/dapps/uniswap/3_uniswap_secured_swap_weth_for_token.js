const BigNumber = require("bignumber.js");
const { teller, tokens } = require("../../../../../scripts/utils/contracts");
const {
  loans: loansActions,
  escrow: escrowActions
} = require("../../../../utils/actions");
const { takeOutNewLoan } = require("../../../../utils/takeOutNewLoan");
const { toDecimals } = require("../../../../../test/utils/consts");
const {
  tokens: tokensAssertions
} = require('../../../../utils/assertions')

module.exports = async (testContext) => {
  const { processArgs, getContracts, accounts } = testContext

  const collTokenName = "ETH";
  const sourceTokenName = "DAI"

  const verbose = processArgs.getValue("verbose");

  const contracts = await getContracts.getAllDeployed({ teller, tokens }, sourceTokenName, collTokenName);

  const borrower = await accounts.getAt(1);
  const initialOraclePrice = toDecimals("0.00295835", 18); // 1 token = 0.00295835 ether = 5000000000000000 wei
  const decimals = parseInt(await contracts.token.decimals());
  const lendingPoolDepositAmountWei = toDecimals(4000, decimals);
  const amountWei = toDecimals(100, decimals);
  const maxAmountWei = toDecimals(200, decimals);
  const durationInDays = 5;
  const signers = await accounts.getAllAt(12, 13);
  const collateralNeeded = "320486794520547945";
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

  const weth = await getContracts.getDeployed(tokens.get('WETH'))

  const tokensPath = [ contracts.token, weth ]
  const minDestinationBalance1 = '100000000000000000'
  const destinationBalance1 = await escrowActions.dapp.uniswap.swap(contracts, context,
    { tokensPath, sourceAmount: loan.borrowedAmount.toString(), minDestination: minDestinationBalance1 }
  )

  tokensPath.reverse()
  const minDestinationBalance2 = '1'
  await escrowActions.dapp.uniswap.swap(contracts, context,
    { tokensPath, sourceAmount: destinationBalance1, minDestination: minDestinationBalance2 }
  )
};