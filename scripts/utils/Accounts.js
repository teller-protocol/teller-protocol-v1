const assert = require('assert');

class Accounts {
    constructor(web3) {
        this.web3 = web3;
        assert(this.web3, 'Web3 is required.');
    }
}

Accounts.prototype.getAccounts = async function() {
    const accounts = await this.web3.eth.getAccounts();
    assert(accounts, "Accounts must be defined.");
    return accounts;
}

Accounts.prototype.count = async function() {
    const accounts = await this.web3.eth.getAccounts();
    return accounts.length;
}

Accounts.prototype.getAt = async function(indexAccount) {
    assert(indexAccount !== undefined, "Index account must be defined.");
    const accounts = await this.getAccounts();
    const account = accounts[indexAccount];
    assert(account, "Account must be defined.");
    return account;
}

module.exports = Accounts;