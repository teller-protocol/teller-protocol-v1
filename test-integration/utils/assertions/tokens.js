const assert = require('assert');
const BigNumber = require('bignumber.js')

/**
 * Makes sure that the token balance is equal to an amount.
 * @return number - Balance of the token
 */
const balanceIs = async (
  { token },
  { testContext },
  { address, expectedBalance }
) => {
  const balance = (await token.balanceOf(address)).toString()
  assert.strictEqual(balance, expectedBalance, 'Balance does not match')
  return balance
}

/**
 * Makes sure that the token balance is greater than an amount.
 * @return number - Balance of the token
 */
const balanceGt = async (
  { token },
  { testContext },
  { address, minBalance }
) => {
  const balance = (await token.balanceOf.call(address)).toString()
  const bal = new BigNumber(balance)
  assert(bal.gt(minBalance), `Expected balance ${bal.toString()} to be greater than ${minBalance}`)
  return balance
}

module.exports = {
  balanceIs,
  balanceGt,
}