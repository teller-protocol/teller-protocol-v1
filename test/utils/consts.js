const { BigNumber } = require( 'bignumber.js');

const DEFAULT_DECIMALS = 18;
const NULL_ADDRESS = '0x0000000000000000000000000000000000000000';
const ZERO = new BigNumber(0);

module.exports = {
    DEFAULT_DECIMALS,
    NULL_ADDRESS,
    ZERO,
    t: function (who, func, desc, fail) {
        const failText = fail ? '\x1b[31mMustFail\x1b[0m .' : '\x1b[0m';
        return '\x1b[32m.' + func + ' => \x1b[36m' + who + '\x1b[0m\033[01;34m : ' + desc + ' '+ failText;
    },
    encode: (web3, signature) => {
        return web3.utils.sha3(signature).slice(0,10);
    },
    getMillis: (year, month, day) => {
        return new Date(year, month, day).getTime();
    },
    daysToMillis: (days) => {
        return days * 24 * 60 * 60 * 1000;
    },
    sum: (a, b) => parseInt(a.toString()) + parseInt(b.toString()),
    createInfo: (address, plusLastAccruedBlockNumber, lastAccruedInterest, expectedAccruedInterest) => ({
        address,
        plusLastAccruedBlockNumber,
        lastAccruedInterest,
        expectedAccruedInterest,
    }),
}
