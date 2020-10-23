// Util classes
const {teller, tokens} = require("../../../scripts/utils/contracts");
const {
  loans: loansActions,
  oracles: oraclesActions,
  blockchain: blockchainActions,
  escrow: escrowActions,
} = require("../../utils/actions");
const {
  loans: loansAssertions,
} = require("../../../scripts/utils/assertions");
const {
  toDecimals,
} = require("../../../test/utils/consts");

module.exports = async (testContext) => {
  const {
    processArgs,
    accounts,
    getContracts,
    timer,
  } = testContext;
  console.log("Scenario: Loans#1 - ETH - Take out a loan and repay twice in full successfully.");
  const collTokenName = "ETH";
  const tokenName = processArgs.getValue("testTokenName");
  const verbose = processArgs.getValue("verbose");

  const allContracts = await getContracts.getAllDeployed({ teller, tokens }, tokenName, collTokenName);
  const {
    token,
    collateralToken,
    oracle,
  } = allContracts;

  const borrower = await accounts.getAt(1);
  const lenderTxConfig = await accounts.getTxConfigAt(0);
  const borrowerTxConfig = await accounts.getTxConfigAt(1);

  const currentOraclePrice = toDecimals("0.00295835", 18); // 1 token = 0.00295835 ether = 5000000000000000 wei
  const tokenDecimals = parseInt(await token.decimals());
  const collateralTokenDecimals = parseInt(await collateralToken.decimals());
  const collateralTokenInfo = { decimals: collateralTokenDecimals, name: collTokenName};
  const tokenInfo = { decimals: tokenDecimals, name: tokenName};
  
  const depositFundsAmount = toDecimals(200, tokenDecimals);
  const maxAmountRequestLoanTerms = toDecimals(80, tokenDecimals);
  const amountTakeOut = toDecimals(50, tokenDecimals);
  const amountRepay_1 = toDecimals(25, tokenDecimals);
  const amountRepay_2 = toDecimals(30, tokenDecimals);
  const collateralAmountDepositCollateral = toDecimals(0.2, collateralTokenDecimals);
  const collateralAmountWithdrawCollateral = toDecimals(0.1, collateralTokenDecimals);
  
  const durationInDays = 5;
  const signers = await accounts.getAllAt(12, 13);

  // Sets Initial Oracle Price
  await oraclesActions.setPrice(
    allContracts,
    {txConfig: lenderTxConfig, testContext},
    {price: currentOraclePrice}
  );

  // Deposit tokens on lending pool.
  await loansActions.depositFunds(
    allContracts,
    {txConfig: lenderTxConfig, testContext},
    {amount: depositFundsAmount}
  );

  // Requesting the loan terms.
  const loanTermsRequestTemplate = {
    amount: amountTakeOut,
    durationInDays,
    borrower,
  };
  const loanResponseTemplate = {
    interestRate: 4000,
    collateralRatio: 6000,
    maxLoanAmount: maxAmountRequestLoanTerms,
    signers,
    responseTime: 50,
  };
  const loanInfoRequestLoanTerms = await loansActions.requestLoanTerms(
    allContracts,
    {txConfig: borrowerTxConfig, testContext},
    {loanTermsRequestTemplate, loanResponseTemplate}
  );

  // Depositing collateral.
  await loansActions.depositCollateral(
    {...allContracts, token: undefined},
    {txConfig: borrowerTxConfig, testContext},
    {loanId: loanInfoRequestLoanTerms.id, amount: collateralAmountDepositCollateral}
  );

  await blockchainActions.advanceMinutes({timer}, {testContext}, {minutes: 2});

  // Take out a loan.
  await loansActions.takeOutLoan(
    allContracts,
    {txConfig: borrowerTxConfig, testContext},
    {loanId: loanInfoRequestLoanTerms.id, amount: amountTakeOut}
  );

  await blockchainActions.advanceMinutes({timer}, {testContext}, {minutes: 5});

  await loansActions.getFunds({ token }, { testContext }, { amount: amountRepay_1, to: borrower })
  await loansActions.repay(
    allContracts,
    {txConfig: borrowerTxConfig, testContext},
    {loanId: loanInfoRequestLoanTerms.id, amount: amountRepay_1}
  );

  await loansActions.withdrawCollateral(
    allContracts,
    {txConfig: borrowerTxConfig, testContext},
    {loanId: loanInfoRequestLoanTerms.id, amount: collateralAmountWithdrawCollateral}
  );

  await loansActions.getFunds({ token }, { testContext }, { amount: amountRepay_2, to: borrower })
  await loansActions.repay(
    allContracts,
    {txConfig: borrowerTxConfig, testContext},
    {loanId: loanInfoRequestLoanTerms.id, amount: amountRepay_2}
  );

  await escrowActions.claimTokensByLoanId(
    allContracts,
    {txConfig: borrowerTxConfig, testContext},
    {loanId: loanInfoRequestLoanTerms.id, recipient: borrowerTxConfig.from}
  );

  await loansActions.printLoanInfo(
    allContracts,
    { testContext },
    {
      loanId: loanInfoRequestLoanTerms.id,
      verbose,
      collateralTokenInfo,
      tokenInfo,
      latestAnswer: currentOraclePrice,
      oracleAddress: oracle.address,
    }
  );

  await loansAssertions.assertLoanValues(
    allContracts,
    { testContext },
    {
      id: loanInfoRequestLoanTerms.id,
    }
  );
};
