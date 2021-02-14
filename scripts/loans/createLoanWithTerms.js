// Smart contracts

// Util classes
const assert = require('assert');
const { teller, tokens } = require("../utils/contracts");
const { loans: readParams } = require("../utils/cli-builder");
const ProcessArgs = require('../utils/ProcessArgs');
const Timer = require('../utils/Timer');
const Accounts = require('../utils/Accounts');
const { createLoanTermsRequest, createSignedLoanTermsResponse } = require('../../test-old/utils/loan-terms-helper');
const { NULL_ADDRESS, ONE_DAY, toDecimals } = require('../../test-old/utils/consts');
const { default: BigNumber } = require("bignumber.js");
const { COLL_TOKEN_NAME, TOKEN_NAME, BORROWER_INDEX, RECIPIENT_INDEX, DURATION_DAYS, AMOUNT, NONCE, COLL_AMOUNT } = require('../utils/cli/names');
const processArgs = new ProcessArgs(readParams.setLoanTerms().argv);

module.exports = async (callback) => {
    try {
        const timer = new Timer(web3);
        const accounts = new Accounts(web3);
        const appConf = processArgs.getCurrentConfig();
        const chainId = processArgs.getChainId().toString();
        const { toTxUrl } = appConf.networkConfig;
        const currentTimestamp = await timer.getCurrentTimestamp();
        console.log(`Current timestamp: ${currentTimestamp}`);

        const collateralTokenName = processArgs.getValue(COLL_TOKEN_NAME.name);
        const tokenName = processArgs.getValue(TOKEN_NAME.name);
        const borrowerIndex = processArgs.getValue(BORROWER_INDEX.name);
        const recipientIndex = processArgs.getValue(RECIPIENT_INDEX.name);
        const durationInDays = processArgs.getValue(DURATION_DAYS.name);
        const amount = processArgs.getValue(AMOUNT.name);
        const collateralAmount = processArgs.getValue(COLL_AMOUNT.name);
        const nonce = processArgs.getValue(NONCE.name);

        const getContracts = processArgs.createGetContracts(artifacts);
        const loansInstance = await getContracts.getDeployed(teller.custom(collateralTokenName).loans(tokenName));
        const tokenInstance = await getContracts.getDeployed(tokens.get(tokenName));
        const tokenDecimals = await tokenInstance.decimals();

        const consensusAddress = await loansInstance.loanTermsConsensus();
        let collateralTokenDecimals = 18;
        if (collateralTokenName !== 'ETH') {
            const collateralTokenInstance = await getContracts.getDeployed(tokens.get(collateralTokenName));
            collateralTokenDecimals = await collateralTokenInstance.decimals();
        }
        const collateralAmountWithDecimals = toDecimals(collateralAmount, collateralTokenDecimals.toString()).toFixed(0);

        const borrower = await accounts.getAt(borrowerIndex);
        const recipient = await accounts.getAtOrDefault(recipientIndex, NULL_ADDRESS);

        const signer1 = await accounts.getAt(9);
        const signer2 = await accounts.getAt(10);

        const amountWithDecimals = toDecimals(amount, tokenDecimals.toString()).toFixed(0);
        const loanTermsRequestInfo = {
            borrower,
            recipient,
            requestNonce: nonce,
            amount: amountWithDecimals,
            duration: durationInDays * ONE_DAY,
            requestTime: currentTimestamp,
            caller: loansInstance.address,
            consensusAddress,
        };
        const loanTermsRequest = createLoanTermsRequest(loanTermsRequestInfo, chainId);

        const maxLoanAmountResponse = toDecimals(amount, tokenDecimals.toString()).toFixed(0);
        const loanResponseInfo1 = {
            signer: signer1,
            responseTime: currentTimestamp + 30,
            interestRate: 4000,
            collateralRatio: 6000,
            maxLoanAmount: maxLoanAmountResponse,
            signerNonce: nonce,
            consensusAddress,
        };
        const signedResponse1 = await createSignedLoanTermsResponse(web3, loanTermsRequest, loanResponseInfo1, chainId);
        
        const loanResponseInfo2 = {
            signer: signer2,
            responseTime: currentTimestamp + 65,
            interestRate: 4000,
            collateralRatio: 6000,
            maxLoanAmount: maxLoanAmountResponse,
            signerNonce: nonce,
            consensusAddress,
        };
        const signedResponse2 = await createSignedLoanTermsResponse(web3, loanTermsRequest, loanResponseInfo2, chainId);

        if(collateralTokenName !== 'ETH') {
            console.log(`Approving tokens...`);
            const collateralTokenInstance = await getContracts.getDeployed(tokens.get(collateralTokenName));
            const currentSenderTokenBalance = await collateralTokenInstance.balanceOf(borrower);
            assert(
                BigNumber(currentSenderTokenBalance.toString()).gte(BigNumber(collateralAmountWithDecimals.toString())),
                'Borrower: Not enough token balance'
            );
            await collateralTokenInstance.approve(loansInstance.address, collateralAmountWithDecimals, { from: borrower });
        }
        const result = await loansInstance.createLoanWithTerms(
            loanTermsRequest.loanTermsRequest,
            [signedResponse1, signedResponse2],
            collateralAmountWithDecimals,
            {
              from: borrower,
              value: collateralTokenName === 'ETH' ? collateralAmountWithDecimals : '0',
            }
        );

        const loanIDs = await loansInstance.getBorrowerLoans(borrower);
        const lastLoanID = loanIDs[loanIDs.length - 1];
        console.log(`Total Loans: ${loanIDs.length}`);
        console.log();
        console.log(`Loan ID created: ${lastLoanID}`);
        console.log();
        console.log('To take out the loan, execute: ');
        const truffleCommand = 'truffle exec ./scripts/loans/takeOutLoan.js';
        console.log(`${truffleCommand} --network ${processArgs.network()} --loanId ${lastLoanID} --tokenName ${tokenName} --collTokenName ${collateralTokenName} --senderIndex ${borrowerIndex} --amount ${amount}`);

        console.log();
        console.log('To view loan info, execute: ');
        console.log(`truffle exec ./scripts/loans/getLoan.js --network ${processArgs.network()} --loanId ${lastLoanID} --tokenName ${tokenName} --collTokenName ${collateralTokenName}`);
        
        console.log(toTxUrl(result));

        console.log('>>>> The script finished successfully. <<<<');
        callback();
    } catch (error) {
        console.log(error);
        callback(error);
    }
};
