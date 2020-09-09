// Smart contracts

// Util classes
const BigNumber = require('bignumber.js');
const assert = require('assert');
const { teller, tokens } = require("../utils/contracts");
const { loans: readParams } = require("../utils/cli-builder");
const ProcessArgs = require('../utils/ProcessArgs');
const Accounts = require('../utils/Accounts');
const { toDecimals, DEFAULT_DECIMALS } = require('../../test/utils/consts');
const { COLL_TOKEN_NAME, TOKEN_NAME, SENDER_INDEX, BORROWER_INDEX, AMOUNT } = require('../utils/cli/names');
const processArgs = new ProcessArgs(readParams.depositCollateralLast().argv);

module.exports = async (callback) => {
    try {
        const accounts = new Accounts(web3);
        const appConf = processArgs.getCurrentConfig();
        const { toTxUrl } = appConf.networkConfig;

        const collateralTokenName = processArgs.getValue(COLL_TOKEN_NAME.name);
        const tokenName = processArgs.getValue(TOKEN_NAME.name);
        const senderIndex = processArgs.getValue(SENDER_INDEX.name);
        const borrowerIndex = processArgs.getValue(BORROWER_INDEX.name);
        const collateralAmount = processArgs.getValue(AMOUNT.name);

        const getContracts = processArgs.createGetContracts(artifacts);
        const loansInstance = await getContracts.getDeployed(teller.custom(collateralTokenName).loans(tokenName));

        let collateralTokenDecimals = DEFAULT_DECIMALS;
        if (collateralTokenName !== 'ETH') {
            const collateralTokenInstance = await getContracts.getDeployed(tokens.get(collateralTokenName));
            collateralTokenDecimals = await collateralTokenInstance.decimals();
        }
        const collateralAmountWithDecimals = toDecimals(collateralAmount, collateralTokenDecimals.toString()).toFixed(0);

        const borrower = await accounts.getAt(borrowerIndex);
        const sender = await accounts.getAt(senderIndex);
        const borrowerLoanIDs = await loansInstance.getBorrowerLoans(borrower);
        if(borrowerLoanIDs.length === 0) {
            throw new Error(`Borrower ${borrower} has not borrowed loans.`);
        }
        const loanId = borrowerLoanIDs[borrowerLoanIDs.length - 1];

        console.log(`Loan ID:       ${loanId}`);
        console.log(`Borrower:      ${borrowerIndex} => ${borrower}`);
        console.log(`Sender:        ${senderIndex} => ${sender}`);
        console.log(`Collateral:    ${collateralAmount} => ${collateralAmountWithDecimals} ${collateralTokenName}`);

        if(collateralTokenName !== 'ETH') {
            console.log(`Approving tokens...`);
            const collateralTokenInstance = await getContracts.getDeployed(tokens.get(collateralTokenName));
            const currentSenderTokenBalance = await collateralTokenInstance.balanceOf(sender);
            assert(
                BigNumber(currentSenderTokenBalance.toString()).gte(BigNumber(collateralAmountWithDecimals.toString())),
                'Sender: Not enough token balance'
            );
            await collateralTokenInstance.approve(loansInstance.address, collateralAmountWithDecimals, { from: sender });
        }
        const result = await loansInstance.depositCollateral(
            borrower,
            loanId,
            collateralAmountWithDecimals,
            {
                from: sender,
                value: collateralTokenName === 'ETH' ? collateralAmountWithDecimals : '0',
            }
        );
        console.log(toTxUrl(result));

        console.log('>>>> The script finished successfully. <<<<');
        callback();
    } catch (error) {
        console.log(error);
        callback(error);
    }
};