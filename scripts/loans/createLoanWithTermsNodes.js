// Smart contracts
const LoanTermsSignatureValidator = artifacts.require(
  './mock/util/LoanTermsSignatureValidator.sol'
);

// Util classes
const ethUtil = require('ethereumjs-util');
const axios = require('axios');

const { hashLoanTermsRequest } = require('../../test/utils/hashes');
const { tokens: tokensActions } = require('../../test-integration/utils/actions');
const assert = require('assert');
const { teller, tokens } = require('../utils/contracts');
const { loans: readParams } = require('../utils/cli-builder');
const ProcessArgs = require('../utils/ProcessArgs');
const Timer = require('../utils/Timer');
const Accounts = require('../utils/Accounts');
const { NULL_ADDRESS, toDecimals } = require('../../test/utils/consts');
const { default: BigNumber } = require('bignumber.js');
const {
  COLL_TOKEN_NAME,
  TOKEN_NAME,
  BORROWER_INDEX,
  DURATION_DAYS,
  AMOUNT,
  NONCE,
  COLL_AMOUNT,
} = require('../utils/cli/names');
const processArgs = new ProcessArgs(readParams.setLoanTerms().argv);

const createArrowheadCRARequest = (url, params) => {
  return {
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    method: 'post',
    url: url,
    data: {
      jsonrpc: '2.0',
      method: 'arrowheadCRA',
      id: 1,
      params: params,
    },
  };
};

const callAllNodeArrowheadCRAEndpoints = async (urls, arrowheadCRARequest) => {
  const responses = [];
  for (const nodeUrl of urls) {
    console.log(`Calling node ${nodeUrl}`);
    const result = await axios(createArrowheadCRARequest(nodeUrl, arrowheadCRARequest));
    responses.push(result.data.result);
  }
  return responses;
};

const fromArrowheadCRAToLoanRequest = (
  arrowheadCRARequest,
  consensusAddress,
  requestNonce
) => ({
  borrower: arrowheadCRARequest.ethereumWallet,
  recipient: NULL_ADDRESS,
  consensusAddress: consensusAddress,
  requestNonce: requestNonce,
  amount: arrowheadCRARequest.requestedLoanSize,
  duration: arrowheadCRARequest.loanTermLength,
  requestTime: arrowheadCRARequest.requestTime,
});

const validateNodeResponses = async (responses, { allContracts, chainId }) => {
  const consensusAddress = await allContracts.loans.loanTermsConsensus();
  for (const response of responses) {
    console.log(`Validating chain id...`);
    assert(
      response.chainId.toString() === chainId.toString(),
      `Response chain id ${response.chainId} (from node) does not match to ${chainId}.`
    );
    console.log(`Validating consensus address...`);
    assert(
      response.consensusAddress === consensusAddress,
      `Consensus address ${response.consensusAddress} (from node) does not match to ${consensusAddress}.`
    );
    const isSigner = await allContracts.loanTermsConsensus.isSigner(response.signer);
    console.log(`Validating signer address...`);
    assert(
      isSigner.toString() === 'true',
      `Signer address ${response.signer} has not the signer role.`
    );
    const { v, r, s } = ethUtil.fromRpcSig(response.signature);
    response.rsvSignature = {
      v: v,
      r: ethUtil.bufferToHex(r),
      s: ethUtil.bufferToHex(s),
    };
  }
  return responses;
};

const mapNodeResponseToLoanResponse = (responses) => {
  return responses.map((response) => ({
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
    },
  }));
};

const getNodeUrls = (nodes) =>
  Object.entries(nodes).map((entry, index) => {
    const [key, value] = entry;
    console.log(`Getting URL for node ${key}: ${value}`);
    return value;
  });

module.exports = async (callback) => {
  try {
    const timer = new Timer(web3);
    const accounts = new Accounts(web3);
    const appConf = processArgs.getCurrentConfig();
    const chainId = processArgs.getChainId().toString();
    const {
      toTxUrl,
      nodes,
      loanTermsSignatureValidatorAddress,
      network,
    } = appConf.networkConfig;

    assert(
      loanTermsSignatureValidatorAddress,
      `Signature validator address is undefined for the network ${network}.`
    );
    assert(nodes, `Nodes configuration is undefined for the network ${network}.`);
    const currentTimestamp = await timer.getCurrentTimestamp();
    console.log(`Current timestamp (blockchain):    ${currentTimestamp}`);

    const collateralTokenName = processArgs.getValue(COLL_TOKEN_NAME.name);
    const tokenName = processArgs.getValue(TOKEN_NAME.name);
    const borrowerIndex = processArgs.getValue(BORROWER_INDEX.name);
    const durationInDays = processArgs.getValue(DURATION_DAYS.name);
    const amount = processArgs.getValue(AMOUNT.name);
    const collateralAmount = processArgs.getValue(COLL_AMOUNT.name);
    const requestNonce = processArgs.getValue(NONCE.name);

    const getContracts = processArgs.createGetContracts(artifacts);
    const allContracts = await getContracts.getAllDeployed(
      { teller, tokens },
      tokenName,
      collateralTokenName
    );
    const { token, collateralToken } = allContracts;
    const tokenInfo = await tokensActions.getInfo({ token });
    const collateralTokenInfo = await tokensActions.getInfo({ token: collateralToken });

    const consensusAddress = await allContracts.loans.loanTermsConsensus();

    const loanTermsSignatureValidator = await LoanTermsSignatureValidator.at(
      loanTermsSignatureValidatorAddress
    );

    await loanTermsSignatureValidator.mockCallerAddress(allContracts.loans.address);
    const getChainIdResult = await loanTermsSignatureValidator.getChainId();

    const networkId = await web3.eth.net.getId();
    assert(
      networkId.toString() === chainId.toString(),
      `Current chain id ${networkId} (web3) does not match param network id ${chainId} (param)`
    );
    assert(
      networkId.toString() === getChainIdResult.toString(),
      `Current chain id ${networkId} (web3) does not match param network id ${chainId} (signature validaor)`
    );

    const amountWithDecimals = toDecimals(amount, tokenInfo.decimals);
    const collateralAmountWithDecimals = toDecimals(
      collateralAmount,
      collateralTokenInfo.decimals
    );

    const borrower = await accounts.getAt(borrowerIndex);

    const arrowheadCRARequest = {
      assetReportSignature: null,
      assetReportStringified: null,
      borrowedAsset: tokenName,
      collateralAsset: collateralTokenName,
      collateralRatioEntered: 15000,
      ethereumWallet: borrower,
      loanTermLength: parseInt(durationInDays) * 24 * 60 * 60,
      loanUse: 'SECURED',
      // TODO Use web3 timestamp after fixing node validation.
      requestTime: 1602516970, //requestTime: currentTimestamp.toString(),
      requestedLoanSize: amountWithDecimals.toString(),
    };
    const loanRequest = fromArrowheadCRAToLoanRequest(
      arrowheadCRARequest,
      consensusAddress,
      requestNonce
    );

    const responses = await callAllNodeArrowheadCRAEndpoints(
      getNodeUrls(nodes),
      arrowheadCRARequest
    );

    const validatedResponses = await validateNodeResponses(responses, {
      allContracts,
      chainId,
    });

    if (collateralTokenName !== 'ETH') {
      console.log(`Approving tokens...`);
      const currentSenderTokenBalance = await collateralToken.balanceOf(borrower);
      assert(
        BigNumber(currentSenderTokenBalance.toString()).gte(
          BigNumber(collateralAmountWithDecimals.toString())
        ),
        `Borrower: Not enough ${collateralTokenInfo.symbol} token balance`
      );
      await collateralTokenInstance.approve(
        allContracts.loans.address,
        collateralAmountWithDecimals,
        { from: borrower }
      );
    }
    const signedResponses = mapNodeResponseToLoanResponse(validatedResponses);

    const callerAddress = await loanTermsSignatureValidator.callerAddress();
    assert.strictEqual(
      callerAddress,
      allContracts.loans.address,
      'Caller address must be the loans address.'
    );

    for (const signedResponse of signedResponses) {
      const validatorResponse = await loanTermsSignatureValidator.validateSignatureAndHashes(
        loanRequest,
        signedResponse
      );
      const { requestHash } = validatorResponse;
      assert.strictEqual(
        requestHash,
        signedResponse.requestHash,
        'Request hash from Validator (contract) and node response are different.'
      );
      const internalHashRequest = ethUtil.bufferToHex(
        hashLoanTermsRequest(loanRequest, allContracts.loans.address, chainId)
      );
      assert.strictEqual(
        internalHashRequest,
        signedResponse.requestHash,
        'Internal hash (JS) and node response are different.'
      );
    }

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

    const truffleCommand = 'truffle exec ./scripts/loans/takeOutLoan.js';
    console.log(
      `${truffleCommand} --network ${processArgs.network()} --loanId ${lastLoanID} --tokenName ${tokenName} --collTokenName ${collateralTokenName} --senderIndex ${borrowerIndex} --amount ${amount}`
    );

    console.log();
    console.log('To view loan info, execute: ');
    console.log(
      `truffle exec ./scripts/loans/getLoan.js --network ${processArgs.network()} --loanId ${lastLoanID} --tokenName ${tokenName} --collTokenName ${collateralTokenName}`
    );

    console.log('>>>> The script finished successfully. <<<<');
    callback();
  } catch (error) {
    console.log(error);
    callback(error);
  }
};
