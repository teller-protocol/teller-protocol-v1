const assert = require('assert');
const BigNumber = require('bignumber.js')

/**
 * Makes sure that the token balance is equal to an amount.
 * @return BigNumber - Balance of the token
 */
const getBalance = async (token, address) => {
  const bal = await token.balanceOf(address)
  return new BigNumber(bal.toString())
}

/**
 * Makes sure that the token balance is equal to an amount.
 */
const balanceIs = async (
  { token },
  { testContext },
  { address, expectedBalance }
) => {
  const balance = await getBalance(token, address)
  assert.strictEqual(balance.toString(), expectedBalance, 'Balance does not match')
}

/**
 * Makes sure that the token balance is greater than an amount.
 */
const balanceGt = async (
  { token },
  { testContext },
  { address, minBalance }
) => {
  const balance = await getBalance(token, address)
  assert(balance.gt(minBalance), `Expected balance ${balance.toString()} to be greater than ${minBalance}`)
}

/**
 * Makes sure that the token balance is less than an amount.
 */
const balanceLt = async (
  { token },
  { testContext },
  { address, maxBalance }
) => {
  const balance = await getBalance(token, address)
  assert(balance.lt(maxBalance), `Expected balance ${balance.toString()} to be less than ${maxBalance}`)
}

module.exports = {
  balanceIs,
  balanceGt,
  balanceLt,
}