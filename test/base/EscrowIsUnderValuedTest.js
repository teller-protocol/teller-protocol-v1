// JS Libraries
const { withData } = require('leche')
const { t } = require('../utils/consts')
const LoansBaseInterfaceEncoder = require('../utils/encoders/LoansBaseInterfaceEncoder')

// Mock contracts
const Mock = artifacts.require('./mock/util/Mock.sol')

// Smart contracts
const Escrow = artifacts.require('./mock/base/EscrowMock.sol')

contract('EscrowIsUnderValuedTest', function (accounts) {
  const loansEncoder = new LoansBaseInterfaceEncoder(web3)

  let escrow
  let loans

  beforeEach(async () => {
    escrow = await Escrow.new()
    loans = await Mock.new()
  })

  withData({
    _1_value_gt_owed: [ 1000, 100, false ],
    _2_value_eq_owed: [ 1000, 1000, false ],
    _3_value_lt_owed: [ 100, 1000, true ],
  }, function (
    valueInToken,
    totalOwed,
    expectedResult
  ) {
    it(t('escrow', 'isUnderValued', 'Checks whether or not the value of the escrow assets is less than amount owed on the loan in tokens', false), async function () {
      // Setup
      await escrow.mockCalculateTotalValue({
        valueInToken,
        valueInEth: 0
      })
      await escrow.mockLoans(loans.address)
      await loans.givenMethodReturnUint(
        loansEncoder.encodeGetTotalOwed(),
        totalOwed
      )

      // Invocation
      const result = await escrow.isUnderValued.call()

      // Assertions
      assert.equal(result, expectedResult, 'Result does not match expected.')
    })
  })
})
