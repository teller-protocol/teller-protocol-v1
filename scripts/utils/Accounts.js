const assert = require('assert');
const BigNumber = require('bignumber.js');

class Accounts {
  constructor(web3) {
    this.web3 = web3;
    assert(this.web3, 'Web3 is required.');
  }
}

Accounts.prototype.getAccounts = async function () {
  const accounts = await this.web3.eth.getAccounts();
  assert(accounts, 'Accounts must be defined.');
  return accounts;
};

Accounts.prototype.count = async function () {
  const accounts = await this.web3.eth.getAccounts();
  return accounts.length;
};

Accounts.prototype.getAllAt = async function (...indexes) {
  const accounts = [];
  for (const index of indexes) {
    const account = await this.getAt(index);
    accounts.push(account);
  }
  return accounts;
};

Accounts.prototype.getAt = async function (indexAccount) {
  assert(indexAccount !== undefined, 'Index account must be defined.');
  const accounts = await this.getAccounts();
  const account = accounts[indexAccount];
  assert(account, 'Account must be defined.');
  return account;
};

Accounts.prototype.getTxConfigAt = async function (indexAccount, value = BigNumber('0')) {
  const account = await this.getAt(indexAccount);
  return { from: account, value };
};

Accounts.prototype.getAtOrDefault = async function (indexAccount, defaultValue) {
  assert(indexAccount !== undefined, 'Index account must be defined.');
  if (indexAccount < 0) {
    return defaultValue;
  }
  const accounts = await this.getAccounts();
  const account = accounts[indexAccount];
  return account || defaultValue;
};

Accounts.prototype.print = async function () {
  const accounts = await this.getAccounts();
  console.log(`Total accounts: ${accounts.length}`);
  for (const accountIndex in accounts) {
    console.log(`${accountIndex} = ${accounts[accountIndex]}`);
  }
};

module.exports = Accounts;
