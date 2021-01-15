// JS Libraries
const withData = require('leche').withData;
const { t, NULL_ADDRESS } = require('../utils/consts');

// Smart contracts
const AddressLibMock = artifacts.require('./mock/util/AddressLibMock.sol');

contract('AddressLibTest', function (accounts) {
  let instance;

  beforeEach('Setup for each test', async () => {
    instance = await AddressLibMock.new();
  });

  withData(
    {
      _1_basic: [0, false],
      _2_empty: [-1, true],
    },
    function (addressIndex, expectedResult) {
      it(
        t(
          'user',
          'isEmpty',
          'Should be able to test whether address is empty or not.',
          false
        ),
        async function () {
          // Setup
          const address = addressIndex === -1 ? NULL_ADDRESS : accounts[addressIndex];

          // Invocation
          const result = await instance.isEmpty(address);

          // Assertions
          assert.equal(result.toString(), expectedResult.toString());
        }
      );
    }
  );

  withData(
    {
      _1_basic: [0, true],
      _2_empty: [-1, false],
    },
    function (addressIndex, expectedResult) {
      it(
        t(
          'user',
          'isNotEmpty',
          'Should be able to test whether address is empty or not.',
          false
        ),
        async function () {
          // Setup
          const address = addressIndex === -1 ? NULL_ADDRESS : accounts[addressIndex];

          // Invocation
          const result = await instance.isNotEmpty(address);

          // Assertions
          assert.equal(result.toString(), expectedResult.toString());
        }
      );
    }
  );

  withData(
    {
      _1_basic: [0, undefined, false],
      _2_empty: [-1, 'ADDRESS_MUST_BE_PROVIDED', true],
    },
    function (addressIndex, expectedErrorMessage, mustFail) {
      it(
        t(
          'user',
          'requireNotEmpty',
          'Should be able to require address is not empty.',
          false
        ),
        async function () {
          // Setup
          const address = addressIndex === -1 ? NULL_ADDRESS : accounts[addressIndex];

          try {
            // Invocation
            const result = await instance.requireNotEmpty(address);

            // Assertions
            assert(!mustFail, 'It should have failed because data is invalid.');
            assert(result);
          } catch (error) {
            // Assertions
            assert(mustFail);
            assert(error);
            assert(error.message.endsWith(expectedErrorMessage));
          }
        }
      );
    }
  );

  withData(
    {
      _1_basic: [0, 1, false],
      _2_equalEmpty: [-1, -1, true],
      _3_emptyAndNotEmpty: [-1, 1, false],
      _4_equal: [1, 1, true],
    },
    function (leftAddressIndex, rightAddressIndex, expectedResult) {
      it(
        t(
          'user',
          'isEqualTo',
          'Should be able to test whether two addresses are equal or not.',
          false
        ),
        async function () {
          // Setup
          const leftAddress =
            leftAddressIndex === -1 ? NULL_ADDRESS : accounts[leftAddressIndex];
          const rightAddress =
            rightAddressIndex === -1 ? NULL_ADDRESS : accounts[rightAddressIndex];

          // Invocation
          const result = await instance.isEqualTo(leftAddress, rightAddress);

          // Assertions
          assert.equal(result.toString(), expectedResult.toString());
        }
      );
    }
  );

  withData(
    {
      _1_basic: [0, 1, true],
      _2_equalEmpty: [-1, -1, false],
      _3_emptyAndNotEmpty: [-1, 1, true],
      _4_equal: [1, 1, false],
    },
    function (leftAddressIndex, rightAddressIndex, expectedResult) {
      it(
        t(
          'user',
          'isNotEqualTo',
          'Should be able to test whether two addresses are equal or not.',
          false
        ),
        async function () {
          // Setup
          const leftAddress =
            leftAddressIndex === -1 ? NULL_ADDRESS : accounts[leftAddressIndex];
          const rightAddress =
            rightAddressIndex === -1 ? NULL_ADDRESS : accounts[rightAddressIndex];

          // Invocation
          const result = await instance.isNotEqualTo(leftAddress, rightAddress);

          // Assertions
          assert.equal(result.toString(), expectedResult.toString());
        }
      );
    }
  );

  withData(
    {
      _1_basic: [2, 2, undefined, false],
      _2_emptyEqual: [-1, -1, undefined, false],
      _3_notEqual: [-1, 1, 'ADDRESSES_MUST_BE_EQUAL', true],
    },
    function (leftAddressIndex, rightAddressIndex, expectedErrorMessage, mustFail) {
      it(
        t(
          'user',
          'requireEqualTo',
          'Should be able to require address is not empty.',
          false
        ),
        async function () {
          // Setup
          const leftAddress =
            leftAddressIndex === -1 ? NULL_ADDRESS : accounts[leftAddressIndex];
          const rightAddress =
            rightAddressIndex === -1 ? NULL_ADDRESS : accounts[rightAddressIndex];

          try {
            // Invocation
            const result = await instance.requireEqualTo(leftAddress, rightAddress);

            // Assertions
            assert(!mustFail, 'It should have failed because data is invalid.');
            assert(result);
          } catch (error) {
            // Assertions
            assert(mustFail);
            assert(error);
            assert(error.message.endsWith(expectedErrorMessage));
          }
        }
      );
    }
  );

  withData(
    {
      _1_basic: [1, 2, undefined, false],
      _2_basic: [-1, 2, undefined, false],
      _3_emptyEqual: [-1, -1, 'ADDRESSES_MUST_NOT_BE_EQUAL', true],
      _4_notEmptyEqual: [1, 1, 'ADDRESSES_MUST_NOT_BE_EQUAL', true],
    },
    function (leftAddressIndex, rightAddressIndex, expectedErrorMessage, mustFail) {
      it(
        t(
          'user',
          'requireNotEqualTo',
          'Should be able to require address is not empty.',
          false
        ),
        async function () {
          // Setup
          const leftAddress =
            leftAddressIndex === -1 ? NULL_ADDRESS : accounts[leftAddressIndex];
          const rightAddress =
            rightAddressIndex === -1 ? NULL_ADDRESS : accounts[rightAddressIndex];

          try {
            // Invocation
            const result = await instance.requireNotEqualTo(leftAddress, rightAddress);

            // Assertions
            assert(!mustFail, 'It should have failed because data is invalid.');
            assert(result);
          } catch (error) {
            // Assertions
            assert(mustFail);
            assert(error);
            assert(error.message.endsWith(expectedErrorMessage));
          }
        }
      );
    }
  );
});
