// JS Libraries
const withData = require('leche').withData;
const { t } = require('../utils/consts');

// Smart contracts
const OwnerSignersRole = artifacts.require('./base/OwnerSignersRole.sol');

// constants
const { NULL_ADDRESS } = require('../utils/consts');

contract('OwnerSignersRoleTest', function (accounts) {
  const owner = accounts[0];
  let instance;

  beforeEach('Setup for each test', async () => {
    instance = await OwnerSignersRole.new();
    await instance.initialize(owner);
  });

  withData(
    {
      _1_basic: [[], 0, 1, undefined, false],
      _2_empty_address: [[], 0, -1, 'Roles: account is the zero address', true],
      _3_not_owner: [[], 2, 2, 'Ownable: caller is not the owner', true],
      _4_signer_add_new_signer: [[1], 1, 2, 'Ownable: caller is not the owner', true],
    },
    function (
      previousSignerIndexes,
      senderIndex,
      newSignerIndex,
      expectedErrorMessage,
      mustFail
    ) {
      it(
        t('user', 'addSigner', 'Should be able (or not) to add a new signer.', mustFail),
        async function () {
          // Setup
          for (const previousSignerIndex of previousSignerIndexes) {
            const previusSignerAddress = accounts[previousSignerIndex];
            await instance.addSigner(previusSignerAddress, { from: owner });
          }
          const newSignerAddress =
            newSignerIndex === -1 ? NULL_ADDRESS : accounts[newSignerIndex];
          const sender = accounts[senderIndex];

          // Invocation
          try {
            const result = await instance.addSigner(newSignerAddress, { from: sender });

            // Assertions
            assert(!mustFail, 'It should have failed because data is invalid.');
            assert(result);
          } catch (error) {
            // Assertions
            assert(mustFail);
            assert(error);
            assert.equal(error.reason, expectedErrorMessage);
          }
        }
      );
    }
  );

  withData(
    {
      _1_basic: [[1, 2], 0, 1, undefined, false],
      _2_not_exist: [[], 0, 1, 'Roles: account does not have role', true],
      _3_empty_address: [[1, 2], 0, -1, 'Roles: account is the zero address', true],
      _4_not_owner: [[1, 3], 2, 1, 'Ownable: caller is not the owner', true],
      _5_signer_remove_signer: [[1, 2], 1, 2, 'Ownable: caller is not the owner', true],
    },
    function (
      previousSignerIndexes,
      senderIndex,
      signerIndexToRemove,
      expectedErrorMessage,
      mustFail
    ) {
      it(
        t(
          'user',
          'removeSigner',
          'Should be able (or not) to remove a new signer.',
          mustFail
        ),
        async function () {
          // Setup
          for (const previousSignerIndex of previousSignerIndexes) {
            const previusSignerAddress = accounts[previousSignerIndex];
            await instance.addSigner(previusSignerAddress, { from: owner });
          }
          const signerAddressToRemove =
            signerIndexToRemove === -1 ? NULL_ADDRESS : accounts[signerIndexToRemove];
          const sender = accounts[senderIndex];

          // Invocation
          try {
            const result = await instance.removeSigner(signerAddressToRemove, {
              from: sender,
            });

            // Assertions
            assert(!mustFail, 'It should have failed because data is invalid.');
            assert(result);
          } catch (error) {
            // Assertions
            assert(mustFail);
            assert(error);
            assert.equal(error.reason, expectedErrorMessage);
          }
        }
      );
    }
  );

  withData(
    {
      _1_isSigner: [[1, 2], 1, true],
      _2_isNotSigner: [[2, 3, 4], 1, false],
    },
    function (previousSignerIndexes, signerIndexToTest, expectedResult) {
      it(
        t('user', 'isSigner', 'Should be able (or not) to remove a new signer.', false),
        async function () {
          // Setup
          for (const previousSignerIndex of previousSignerIndexes) {
            const previusSignerAddress = accounts[previousSignerIndex];
            await instance.addSigner(previusSignerAddress, { from: owner });
          }
          const addressToTest =
            signerIndexToTest === -1 ? NULL_ADDRESS : accounts[signerIndexToTest];

          // Invocation
          const result = await instance.isSigner(addressToTest);

          // Assertions
          assert.equal(result.toString(), expectedResult.toString());
        }
      );
    }
  );
});
