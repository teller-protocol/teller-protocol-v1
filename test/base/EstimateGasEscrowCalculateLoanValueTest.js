// JS Libraries
const BN = require('bignumber.js');
const { withData } = require('leche');
const { t, ETH_ADDRESS } = require('../utils/consts');
const LoansBaseInterfaceEncoder = require('../utils/encoders/LoansBaseInterfaceEncoder');
const settingsNames = require('../utils/platformSettingsNames');
const { toBytes32 } = require('../utils/consts');
const { createMocks } = require('../utils/consts');
const { createTestSettingsInstance } = require('../utils/settings-helper');
const { encodeLoanParameter } = require('../utils/loans');

// Mock contracts
const Mock = artifacts.require('./mock/util/Mock.sol');
const DAIMock = artifacts.require('./mock/token/DAIMock.sol');

// Smart contracts
const Settings = artifacts.require('./base/Settings.sol');
const Escrow = artifacts.require('./mock/base/EscrowMock.sol');

contract('EstimateGasEscrowCalculateTotalValueTest', function (accounts) {
  const loansEncoder = new LoansBaseInterfaceEncoder(web3);

  const baseGasCost = 700000; // Gas cost with 1 token in wallet
  const expectedGasCost = (tokens) => baseGasCost + (tokens - 1) * 10000; // Gas cost > 1 token in wallet

  let instance;
  const collateralBuffer = 1500;

  beforeEach(async () => {
    const settings = await createTestSettingsInstance(
      Settings,
      { from: accounts[0], Mock },
      {
        [settingsNames.CollateralBuffer]: collateralBuffer,
      }
    );

    instance = await Escrow.new();
    await instance.externalSetSettings(settings.address);
  });

  withData(
    {
      _1_1_tokens_with_collateral_ratio_eth: [[1000], 100, 20, true],
      _2_2_tokens_with_collateral_ratio_eth: [[1000, 2000], 200, 20, true],
      _3_3_tokens_with_collateral_ratio_eth: [[1000, 2000, 3000], 300, 20, true],
      _4_1_tokens_with_zero_collateral_eth: [[1000], 0, 0, true],
      _5_2_tokens_with_zero_collateral_eth: [[1000, 2000], 0, 0, true],
      _6_3_tokens_with_zero_collateral_eth: [[1000, 2000, 3000], 0, 0, true],
      _7_1_tokens_with_zero_collateral_token: [[1000], 0, 0, false],
      _8_2_tokens_with_zero_collateral_token: [[1000, 2000], 0, 0, false],
      _9_3_tokens_with_zero_collateral_token: [[1000, 2000, 3000], 0, 0, false],
      _10_1_tokens_with_collateral_ratio_token: [[1000], 100, 20, false],
      _11_2_tokens_with_collateral_ratio_token: [[1000, 2000], 200, 20, false],
      _12_3_tokens_with_collateral_ratio_token: [[1000, 2000, 3000], 300, 20, false],
      _13_4_tokens_with_collateral_ratio_token: [
        [1000, 2000, 3000, 4000],
        300,
        20,
        false,
      ],
      _14_5_tokens_with_collateral_ratio_token: [
        [1000, 2000, 3000, 4000, 5000],
        300,
        20,
        false,
      ],
      _15_6_tokens_with_collateral_ratio_token: [
        [1000, 2000, 3000, 4000, 5000, 6000],
        300,
        20,
        false,
      ],
      _16_7_tokens_with_collateral_ratio_token: [
        [1000, 2000, 3000, 4000, 5000, 6000, 7000],
        300,
        20,
        false,
      ],
      _17_8_tokens_with_collateral_ratio_token: [
        [1000, 2000, 3000, 4000, 5000, 6000, 7000, 8000],
        300,
        20,
        false,
      ],
      _18_9_tokens_with_collateral_ratio_token: [
        [1000, 2000, 3000, 4000, 5000, 6000, 7000, 8000, 9000],
        300,
        20,
        false,
      ],
      _19_10_tokens_with_collateral_ratio_token: [
        [1000, 2000, 3000, 4000, 5000, 6000, 7000, 8000, 9000, 10000],
        300,
        20,
        false,
      ],
    },
    function (tokenAmounts, collateralAmount, collateralRatio, collateralIsEth) {
      it(
        t(
          'escrow',
          'calculateTotalValue',
          'Should be able to calculate its total value of all assets owned.',
          false
        ),
        async function () {
          const tokensAddresses = await createMocks(DAIMock, tokenAmounts.length);
          await instance.externalSetTokens(tokensAddresses);
          const expectedMaxGas = expectedGasCost(tokenAmounts.length);

          const lendingAddress = tokensAddresses[0];
          const collateralAddress = collateralIsEth
            ? ETH_ADDRESS
            : (await Mock.new()).address;

          const loans = await Mock.new();
          await instance.mockLoans(loans.address);
          await loans.givenMethodReturnAddress(
            loansEncoder.encodeLendingToken(),
            lendingAddress
          );
          await loans.givenMethodReturnAddress(
            loansEncoder.encodeCollateralToken(),
            collateralAddress
          );
          await loans.givenMethodReturn(
            loansEncoder.encodeLoans(),
            encodeLoanParameter(web3, {
              collateral: collateralAmount,
              loanTerms: { collateralRatio },
            })
          );

          for (let i = 0; i < tokensAddresses.length; i++) {
            await instance.mockValueOfIn(
              tokensAddresses[i],
              ETH_ADDRESS,
              tokenAmounts[i]
            );
          }

          // mock the calculation of the collateral buffer
          if (!collateralIsEth) {
            const collAmount = new BN(collateralAmount);
            const collateralMinusBuffer = collAmount.minus(
              collAmount.multipliedBy(collateralBuffer).dividedBy(10000)
            );
            instance.mockValueOfIn(
              collateralAddress,
              ETH_ADDRESS,
              collateralMinusBuffer.toFixed()
            );
          }

          const valueInToken = 1234567890;
          await instance.mockValueOfIn(ETH_ADDRESS, lendingAddress, valueInToken);

          // Invocation
          const result = await instance.calculateTotalValue.estimateGas();
          // Assertions
          assert(
            parseInt(result) <= expectedMaxGas,
            'Gas usage exceeded network gas limit.'
          );
        }
      );
    }
  );
});
