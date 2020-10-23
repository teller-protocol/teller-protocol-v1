const loans = require('./loans');
const chainlink = require('./chainlink');
const escrow = require('./escrow');
const blockchain = require('./blockchain');
const tokens = require('./tokens');
const errors = require('./errors');
const settings = require('./settings');

module.exports = {
    loans,
    oracles: chainlink,
    chainlink,
    escrow,
    blockchain,
    tokens,
    errors,
    settings,
};