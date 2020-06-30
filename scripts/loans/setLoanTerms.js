// Smart contracts

// Util classes
const assert = require('assert');
const { zerocollateral, tokens } = require("../../scripts/utils/contracts");
const { loans: readParams } = require("../utils/cli-builder");
const ProcessArgs = require('../utils/ProcessArgs');
const Timer = require('../utils/Timer');
const Accounts = require('../utils/Accounts');
const { createLoanTermsRequest, createSignedLoanTermsResponse } = require('../../test/utils/loan-terms-helper');
const { NULL_ADDRESS, ONE_DAY, toDecimals } = require('../../test/utils/consts');
const { default: BigNumber } = require("bignumber.js");
const processArgs = new ProcessArgs(readParams.setLoanTerms().argv);

module.exports = async (callback) => {
    try {
        const timer = new Timer(web3);
        const accounts = new Accounts(web3);
        const appConf = processArgs.getCurrentConfig();
        const { toTxUrl } = appConf.networkConfig;
        const currentTimestamp = await timer.getCurrentTimestamp();

        const collateralTokenName = processArgs.getValue('collTokenName');
        const tokenName = processArgs.getValue('tokenName');
        const borrowerIndex = processArgs.getValue('borrowerIndex');
        const recipientIndex = processArgs.getValue('recipientIndex');
        const durationInDays = processArgs.getValue('durationDays');
        const amount = processArgs.getValue('amount');
        const collateralAmount = processArgs.getValue('collAmount');
        const nonce = processArgs.getValue('nonce');

        const getContracts = processArgs.createGetContracts(artifacts);
        const loansInstance = await getContracts.getDeployed(zerocollateral.custom(collateralTokenName).loans(tokenName));
        const tokenInstance = await getContracts.getDeployed(tokens.get(tokenName));
        const tokenDecimals = await tokenInstance.decimals();

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
            requestTime: Math.round(currentTimestamp / 1000),
            caller: loansInstance.address,
        };
        const loanTermsRequest = createLoanTermsRequest(loanTermsRequestInfo);

        const maxLoanAmountResponse = toDecimals(amount, tokenDecimals.toString()).toFixed(0);
        const loanResponseInfo1 = {
            signer: signer1,
            responseTime: Math.round(currentTimestamp / 1000) + 30,
            interestRate: 4000,
            collateralRatio: 6000,
            maxLoanAmount: maxLoanAmountResponse,
            signerNonce: nonce
        };
        const signedResponse1 = await createSignedLoanTermsResponse(web3, loanTermsRequest, loanResponseInfo1);
        
        const loanResponseInfo2 = {
            signer: signer2,
            responseTime: Math.round(currentTimestamp / 1000) + 65,
            interestRate: 4000,
            collateralRatio: 6000,
            maxLoanAmount: maxLoanAmountResponse,
            signerNonce: nonce
        };
        const signedResponse2 = await createSignedLoanTermsResponse(web3, loanTermsRequest, loanResponseInfo2);

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
        const result = await loansInstance.setLoanTerms(
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
        console.log();
        console.log(`Loan ID created: ${lastLoanID}`);
        console.log();
        console.log('To take out the loan, execute: ');
        const truffleCommand = 'truffle exec ./scripts/loans/takeOutLoan.js';
        console.log(`${truffleCommand} --network ${processArgs.network()} --loanID ${lastLoanID} --tokenName ${tokenName} --collTokenName ${collateralTokenName} --senderIndex ${borrowerIndex} --amount ${amount}`);

        console.log(toTxUrl(result));

        console.log('>>>> The script finished successfully. <<<<');
        callback();
    } catch (error) {
        console.log(error);
        callback(error);
    }
};