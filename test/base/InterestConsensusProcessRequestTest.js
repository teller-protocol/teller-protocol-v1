const withData = require('leche').withData;
const { t, getLatestTimestamp, ONE_DAY, THIRTY_DAYS } = require('../utils/consts');
const settingsNames = require('../utils/platformSettingsNames');
const {
  createInterestRequest,
  createUnsignedInterestResponse,
} = require('../utils/structs');
const { createInterestResponseSig, hashInterestRequest } = require('../utils/hashes');
const ethUtil = require('ethereumjs-util');
const { interestConsensus } = require('../utils/events');
const chains = require('../utils/chains');
const { createTestSettingsInstance } = require('../utils/settings-helper');

// Mock contracts
const Mock = artifacts.require('./mock/util/Mock.sol');

// Smart contracts
const Settings = artifacts.require('./base/Settings.sol');
const InterestConsensusMock = artifacts.require('./mock/base/InterestConsensusMock.sol');

contract('InterestConsensusProcessRequestTest', function (accounts) {
  let instance;
  const owner = accounts[0];
  let lenders;
  const nodeOne = accounts[2];
  const nodeTwo = accounts[3];
  const nodeThree = accounts[4];
  const nodeFour = accounts[5];
  const nodeSix = accounts[6];
  const lender = accounts[9];
  const endTime = 34567;
  const requestNonce = 5;

  let currentTime;
  let interestRequest;

  let responseOne = createUnsignedInterestResponse(nodeOne, 0, 35976, 0);
  let responseTwo = createUnsignedInterestResponse(nodeTwo, 0, 34732, 4);
  let responseThree = createUnsignedInterestResponse(nodeThree, 0, 34732, 4);
  let responseFour = createUnsignedInterestResponse(nodeFour, 0, 34000, 0);
  let responseFive = createUnsignedInterestResponse(nodeThree, 0, 34736, 1);
  let responseExpired = createUnsignedInterestResponse(nodeSix, 0, 34736, 1);
  let responseInvalidChainId = createUnsignedInterestResponse(nodeThree, 0, 34736, 2);

  beforeEach('Setup the response times and signatures', async () => {
    instance = await InterestConsensusMock.new();
    currentTime = await getLatestTimestamp();

    const chainId = chains.mainnet;
    const invalidChainId = chains.ropsten;
    lenders = await Mock.new();

    interestRequest = createInterestRequest(
      lender,
      requestNonce,
      23456,
      endTime,
      45678,
      instance.address
    );

    responseOne.consensusAddress = instance.address;
    responseTwo.consensusAddress = instance.address;
    responseThree.consensusAddress = instance.address;
    responseFour.consensusAddress = instance.address;
    responseFive.consensusAddress = instance.address;
    responseExpired.consensusAddress = instance.address;
    responseInvalidChainId.consensusAddress = instance.address;

    responseOne.responseTime = currentTime - 2 * ONE_DAY;
    responseTwo.responseTime = currentTime - 25 * ONE_DAY;
    responseThree.responseTime = currentTime - 29 * ONE_DAY;
    responseFour.responseTime = currentTime - ONE_DAY;
    responseFive.responseTime = currentTime - 15 * ONE_DAY;
    responseExpired.responseTime = currentTime - 31 * ONE_DAY;
    responseInvalidChainId.responseTime = currentTime - 15 * ONE_DAY;

    const requestHash = ethUtil.bufferToHex(
      hashInterestRequest(interestRequest, lenders.address, chainId)
    );

    responseOne = await createInterestResponseSig(
      web3,
      nodeOne,
      responseOne,
      requestHash,
      chainId
    );
    responseTwo = await createInterestResponseSig(
      web3,
      nodeTwo,
      responseTwo,
      requestHash,
      chainId
    );
    responseThree = await createInterestResponseSig(
      web3,
      nodeThree,
      responseThree,
      requestHash,
      chainId
    );
    responseFour = await createInterestResponseSig(
      web3,
      nodeFour,
      responseFour,
      requestHash,
      chainId
    );
    responseFive = await createInterestResponseSig(
      web3,
      nodeThree,
      responseFive,
      requestHash,
      chainId
    );
    responseExpired = await createInterestResponseSig(
      web3,
      nodeSix,
      responseExpired,
      requestHash,
      chainId
    );
    responseInvalidChainId = await createInterestResponseSig(
      web3,
      nodeThree,
      responseInvalidChainId,
      requestHash,
      invalidChainId
    );
  });

  withData(
    {
      _1_insufficient_responses: [
        undefined,
        10000,
        320,
        [responseOne, responseTwo],
        true,
        'INSUFFICIENT_NUMBER_OF_RESPONSES',
      ],
      _2_one_response_successful: [undefined, 1000, 320, [responseOne], false, undefined],
      _3_responses_just_over_tolerance: [
        // average = 34860, tolerance = 1115, max is 35976 (1 too much)
        undefined,
        1000,
        320,
        [responseOne, responseTwo, responseThree, responseFour],
        true,
        'RESPONSES_TOO_VARIED',
      ],
      _4_responses_just_within_tolerance: [
        // average = 34861, tolerance = 1115, max is 35976 (perfect)
        undefined,
        1000,
        320,
        [responseOne, responseTwo, responseFour, responseFive],
        false,
        undefined,
      ],
      _5_zero_tolerance: [
        undefined,
        1000,
        0,
        [responseTwo, responseThree],
        false,
        undefined,
      ],
      _6_two_responses_same_signer: [
        // responseThree and five have the same signer
        undefined,
        1000,
        320,
        [responseOne, responseThree, responseTwo, responseFive],
        true,
        'SIGNER_ALREADY_SUBMITTED',
      ],
      _7_expired_response: [
        undefined,
        1000,
        320,
        [responseOne, responseTwo, responseExpired, responseFive],
        true,
        'RESPONSE_EXPIRED',
      ],
      _8_responses_invalid_response_chainid: [
        undefined,
        1000,
        320,
        [responseOne, responseTwo, responseFour, responseInvalidChainId],
        true,
        'SIGNATURE_INVALID',
      ],
      _9_responses_invalid_request_nonce_taken: [
        { nonce: requestNonce, lender: lender },
        1000,
        320,
        [responseOne, responseTwo, responseFour],
        true,
        'INTEREST_REQUEST_NONCE_TAKEN',
      ],
    },
    function (
      requestNonceTaken,
      reqSubmissionsPercentage,
      tolerance,
      responses,
      mustFail,
      expectedErrorMessage
    ) {
      it(
        t('user', 'new', 'Should accept/not accept a nodes response', mustFail),
        async function () {
          // set up contract
          const marketsInstance = await Mock.new();
          const settings = await createTestSettingsInstance(
            Settings,
            { from: owner, Mock },
            {
              [settingsNames.RequiredSubmissionsPercentage]: reqSubmissionsPercentage,
              [settingsNames.MaximumTolerance]: tolerance,
              [settingsNames.ResponseExpiryLength]: THIRTY_DAYS,
              [settingsNames.TermsExpiryTime]: THIRTY_DAYS,
              [settingsNames.LiquidateEthPrice]: 9500,
            }
          );
          // The sender validation (equal to the lenders contract) is mocked (InterestConsensusMock _isCaller(...) function) to allow execute the unit test.
          const sender = accounts[1];
          await instance.initialize(owner, lenders.address, settings.address);

          await instance.addSigner(nodeOne);
          await instance.addSigner(nodeTwo);
          await instance.addSigner(nodeThree);
          await instance.addSigner(nodeFour);
          await instance.addSigner(nodeSix);

          if (requestNonceTaken !== undefined) {
            await instance.mockRequestNonce(
              requestNonceTaken.lender,
              requestNonceTaken.nonce,
              true
            );
          }

          try {
            const result = await instance.processRequest(interestRequest, responses, {
              from: sender,
            });

            assert(!mustFail, 'It should have failed because data is invalid.');

            let totalInterest = 0;

            responses.forEach((response) => {
              interestConsensus
                .interestSubmitted(result)
                .emitted(
                  response.signer,
                  lender,
                  interestRequest.requestNonce,
                  endTime,
                  response.interest
                );

              totalInterest += response.interest;
            });

            interestConsensus
              .interestAccepted(result)
              .emitted(
                lender,
                interestRequest.requestNonce,
                endTime,
                Math.floor(totalInterest / responses.length)
              );
          } catch (error) {
            assert(mustFail, 'Should not have failed');
            assert.equal(error.reason, expectedErrorMessage);
          }
        }
      );
    }
  );
});
