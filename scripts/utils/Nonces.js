class Nonces {
  constructor(initialNonce = 0) {
      this.values = new Map();
      this.initialNonce = initialNonce;
  }
}

Nonces.prototype.newNonce = function (account) {
  const lastNonce = this.values.get(account);
  let newNonce = lastNonce === undefined ? this.initialNonce : lastNonce + 1;
  this.values.set(account, newNonce);
  console.log(`Account ${account} got a new nonce: ${newNonce}`);
  return newNonce;
}

Nonces.prototype.lastNonce = function (account) {
  return this.values.get(account);
}

Nonces.prototype.print = function () {
  for (const account of this.values.keys()) {
    console.log(`Account: ${account} => Nonce: ${this.values.get(account)}`);
  }
}

module.exports = Nonces;