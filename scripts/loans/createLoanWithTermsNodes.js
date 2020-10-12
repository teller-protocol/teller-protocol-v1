// Smart contracts
const SignatureValidator = artifacts.require("./mock/util/SignatureValidator.sol");

// Util classes
const ethUtil = require('ethereumjs-util')
const axios = require('axios');

const { hashLoanTermsRequest } = require('../../test/utils/hashes');
const {
    tokens: tokensActions,
} = require('../../test-integration/utils/actions');
const assert = require('assert');
const { teller, tokens } = require("../utils/contracts");
const { loans: readParams } = require("../utils/cli-builder");
const ProcessArgs = require('../utils/ProcessArgs');
const Timer = require('../utils/Timer');
const Accounts = require('../utils/Accounts');
const { NULL_ADDRESS, toDecimals } = require('../../test/utils/consts');
const { default: BigNumber } = require("bignumber.js");
const { COLL_TOKEN_NAME, TOKEN_NAME, BORROWER_INDEX, DURATION_DAYS, AMOUNT, NONCE, COLL_AMOUNT } = require('../utils/cli/names');
const processArgs = new ProcessArgs(readParams.setLoanTerms().argv);

const nodeUrls = [
    'https://node-saxle.layr1.com',
    //'https://node-tpscrpt.layr1.com',
];

module.exports = async (callback) => {
    try {
        const timer = new Timer(web3);
        const accounts = new Accounts(web3);
        const appConf = processArgs.getCurrentConfig();
        const chainId = processArgs.getChainId().toString();
        const { toTxUrl } = appConf.networkConfig;
        const currentTimestamp = await timer.getCurrentTimestamp();
        console.log(`Current timestamp (blockchain):    ${currentTimestamp}`);
        console.log(`Current timestamp :                ${Math.floor(Date.now() / 1000)}`);

        const collateralTokenName = processArgs.getValue(COLL_TOKEN_NAME.name);
        const tokenName = processArgs.getValue(TOKEN_NAME.name);
        const borrowerIndex = processArgs.getValue(BORROWER_INDEX.name);
        //const recipientIndex = processArgs.getValue(RECIPIENT_INDEX.name);
        const durationInDays = processArgs.getValue(DURATION_DAYS.name);
        const amount = processArgs.getValue(AMOUNT.name);
        const collateralAmount = processArgs.getValue(COLL_AMOUNT.name);
        const requestNonce = processArgs.getValue(NONCE.name);

        const getContracts = processArgs.createGetContracts(artifacts);
        const allContracts = await getContracts.getAllDeployed({ teller, tokens }, tokenName, collateralTokenName);
        const { token, collateralToken } = allContracts;
        const tokenInfo = await tokensActions.getInfo({token});
        const collateralTokenInfo = await tokensActions.getInfo({token: collateralToken});

        const consensusAddress = await allContracts.loans.loanTermsConsensus();

        const signatureValidator = await SignatureValidator.at('0xdAdE05d1A7CA9c610a41E7C3E916Ed8edECF6Fcf');

        const getChainIdResult = await signatureValidator.getChainId();
        console.log(`getChainIdResult: ${getChainIdResult}`);
        /*
        let collateralTokenAddress = ETH_ADDRESS;
        let collateralTokenDecimals = 18;
        if (collateralTokenName !== 'ETH') {
            const collateralTokenInstance = await getContracts.getDeployed(tokens.get(collateralTokenName));
            collateralTokenDecimals = await collateralTokenInstance.decimals();
            collateralTokenAddress = collateralTokenInstance.address;
        }
        */
        console.log(`Caller (or loans address): ${allContracts.loans.address}`);
        const networkId = await web3.eth.net.getId();
        console.log(`Network ID:  ${networkId}`);
        const amountWithDecimals = toDecimals(amount, tokenInfo.decimals);
        const collateralAmountWithDecimals = toDecimals(collateralAmount, collateralTokenInfo.decimals);

        const borrower = await accounts.getAt(borrowerIndex);

        const lendingApplication = {
            assetReportSignature: null,
            assetReportStringified: null,
            borrowedAsset: tokenName,
            collateralAsset: collateralTokenName,
            collateralRatioEntered: 15000,
            ethereumWallet: borrower,
            loanTermLength: (parseInt(durationInDays) * 24 * 60 * 60),
            loanUse: "SECURED",
            requestTime: 1602516970, //requestTime: currentTimestamp.toString(),
            requestedLoanSize: amountWithDecimals.toString(),
        };
        //console.log(lendingApplication);
        const loanRequest = {
            borrower: lendingApplication.ethereumWallet,
            recipient: NULL_ADDRESS,
            consensusAddress: consensusAddress,
            requestNonce: requestNonce,
            amount: lendingApplication.requestedLoanSize,
            duration: lendingApplication.loanTermLength,
            requestTime: lendingApplication.requestTime,
        };
        const responses = [];
        for (const nodeUrl of nodeUrls) {
            const response = await axios({
                headers: {
                  'Content-Type': 'application/json',
                  'Accept': 'application/json'
                },
                method: 'post',
                url: nodeUrl,
                data: {
                  jsonrpc: '2.0',
                  method: 'arrowheadCRA',
                  id: 1,
                  params: lendingApplication
                }
              });
            responses.push(response.data.result);
        }

        for (const response of responses) {
            assert(response.consensusAddress === consensusAddress, `Consensus address ${response.consensusAddress} (response) does not match to ${consensusAddress}`);
            const isSigner = await allContracts.loanTermsConsensus.isSigner(response.signer);
            //console.log(`${response.signer} has signer role? ${isSigner}`);
            assert(isSigner.toString() === 'true', `Signer address ${response.signer} has not the signer role.`);
            const { v, r, s } = ethUtil.fromRpcSig(response.signature);
            const sign = {
                v: v,
                r: ethUtil.bufferToHex(r),
                s: ethUtil.bufferToHex(s),
            };
            response.rsvSignature = sign;
        }
        console.log(responses);
        
        if(collateralTokenName !== 'ETH') {
            console.log(`Approving tokens...`);
            //const collateralTokenInstance = await getContracts.getDeployed(tokens.get(collateralTokenName));
            const currentSenderTokenBalance = await collateralToken.balanceOf(borrower);
            assert(
                BigNumber(currentSenderTokenBalance.toString()).gte(BigNumber(collateralAmountWithDecimals.toString())),
                `Borrower: Not enough ${collateralTokenInfo.symbol} token balance`
            );
            await collateralTokenInstance.approve(allContracts.loans.address, collateralAmountWithDecimals, { from: borrower });
        }
        const signedResponses = responses.map(response => ({
            ...response,
            signer: response.signer,
            consensusAddress: response.consensusAddress,
            responseTime: response.responseTime,
            interestRate: response.interestRate,
            collateralRatio: response.collateralRatio,
            maxLoanAmount: response.maxLoanAmount,
            signature: {
                signerNonce: response.signerNonce,
                v: response.rsvSignature.v,
                r: response.rsvSignature.r,
                s: response.rsvSignature.s,
            }
        }));

        for (const signedResponse of signedResponses) {
            const validatorResponse = await signatureValidator.createLoanWithTerms(
                allContracts.loans.address,
                loanRequest,
                signedResponse
            );
            const { validResponse, signer, requestHash, responseHash } = validatorResponse;
            console.log(`Validator hash request:    ${requestHash}`);
            console.log(`Response hash request:     ${signedResponse.requestHash}`);

            const internalHashRequest = ethUtil.bufferToHex(hashLoanTermsRequest(loanRequest, allContracts.loans.address, chainId))
            const internalHashRequest2 = hashLoanTermsRequest(loanRequest, allContracts.loans.address, chainId).toString('hex');
            console.log(`internal hash request: ${internalHashRequest}`)
            console.log(`internal hash request2:${internalHashRequest2}`)
            
            //console.log(`Validator hash response:    ${responseHash}`);
            //console.log(`Response hash response:     ${signedResponse.responseHash}`);
            console.log(validatorResponse);
        }
        /*
        const result = await allContracts.loans.createLoanWithTerms(
            loanRequest,
            signedResponses,
            collateralAmountWithDecimals,
            {
              from: borrower,
              value: collateralTokenName === 'ETH' ? collateralAmountWithDecimals : '0',
            }
        );
        console.log(toTxUrl(result));

        const loanIDs = await allContracts.loans.getBorrowerLoans(borrower);
        const lastLoanID = loanIDs[loanIDs.length - 1];
        console.log(`Total Loans: ${loanIDs.length}`);
        console.log();
        console.log(`Loan ID created: ${lastLoanID}`);
        console.log();
        console.log('To take out the loan, execute: ');
*/

        /*
        const truffleCommand = 'truffle exec ./scripts/loans/takeOutLoan.js';
        console.log(`${truffleCommand} --network ${processArgs.network()} --loanId ${lastLoanID} --tokenName ${tokenName} --collTokenName ${collateralTokenName} --senderIndex ${borrowerIndex} --amount ${amount}`);

        console.log();
        console.log('To view loan info, execute: ');
        console.log(`truffle exec ./scripts/loans/getLoan.js --network ${processArgs.network()} --loanId ${lastLoanID} --tokenName ${tokenName} --collTokenName ${collateralTokenName}`);
        
        
        */

        console.log('>>>> The script finished successfully. <<<<');
        callback();
    } catch (error) {
        console.log(error);
        callback(error);
    }
};