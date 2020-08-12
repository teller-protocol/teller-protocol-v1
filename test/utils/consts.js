const { BigNumber } = require( 'bignumber.js');

const REQUIRED_SUBMISSIONS = 'RequiredSubmissions';
const MAXIMUM_TOLERANCE = 'MaximumTolerance';
const RESPONSE_EXPIRY_LENGTH = 'ResponseExpiryLength';
const SAFETY_INTERVAL = 'SafetyInterval';
const TERMS_EXPIRY_TIME = 'TermsExpiryTime';
const LIQUIDATE_ETH_PRICE = 'LiquidateEthPrice';
const DEFAULT_DECIMALS = 18;
const NULL_ADDRESS = '0x0000000000000000000000000000000000000000';
const DUMMY_ADDRESS = '0x0000000000000000000000000000000000000123';
const NULL_BYTES = '0x0000000000000000000000000000000000000000000000000000000000000000'
const ZERO = new BigNumber(0);
const NETWORK_PROVIDER = 'http://127.0.0.1:7545';
const COVERAGE_NETWORK = 'http://127.0.0.1:8555';
const FIVE_MIN = 60*5
const ONE_HOUR = 3600 // 60 seconds * 60 minutes = 1 hour
const ONE_DAY = ONE_HOUR*24
const THIRTY_DAYS = ONE_DAY*30
const NON_EXISTENT = 0
const TERMS_SET = 1
const ACTIVE = 2
const CLOSED = 3

const toDecimals = (amount, decimals) => {
    return new BigNumber(amount).times(new BigNumber(10).pow(decimals));
}

module.exports = {
    DUMMY_ADDRESS,
    NON_EXISTENT,
    TERMS_SET,
    ACTIVE,
    CLOSED,
    DEFAULT_DECIMALS,
    NULL_ADDRESS,
    NULL_BYTES,
    ZERO,
    NETWORK_PROVIDER,
    COVERAGE_NETWORK,
    FIVE_MIN,
    ONE_HOUR,
    ONE_DAY,
    THIRTY_DAYS,
    REQUIRED_SUBMISSIONS,
    MAXIMUM_TOLERANCE,
    RESPONSE_EXPIRY_LENGTH,
    SAFETY_INTERVAL,
    TERMS_EXPIRY_TIME,
    LIQUIDATE_ETH_PRICE,
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
        return parseInt(days.toString()) * 24 * 60 * 60 * 1000;
    },
    daysToSeconds: (days) => {
        return parseInt(days.toString()) * 24 * 60 * 60;
    },
    secondsToDays: (seconds) => {
        return parseInt(seconds.toString()) / (24 * 60 * 60);
    },
    millisToDays: (millis) => {
        return parseInt(millis.toString()) / (24 * 60 * 60 * 1000);
    },
    minutesToSeconds: (minutes) => {
        return parseInt(minutes.toString()) * 60;
    },
    getLatestTimestamp: async () => {
      return (await web3.eth.getBlock('latest')).timestamp
    },
    sum: (a, b) => parseInt(a.toString()) + parseInt(b.toString()),
    toBytes32: (web3, text) => {
      return web3.utils.padRight(web3.utils.stringToHex(text), 64, '0');
    },
    toDecimals,
    toTokenDecimals: async (token, amount) => {
        const decimals = await token.decimals();
        return toDecimals(amount, decimals);
    },
    toUnits: (amount, decimals) => {
        return new BigNumber(amount).div(new BigNumber(10).pow(decimals));
    },
    printSeparatorLine: (length = 100, separator = '-') => {
        console.log(`\n${separator.repeat(length)}\n`);
    },
}
