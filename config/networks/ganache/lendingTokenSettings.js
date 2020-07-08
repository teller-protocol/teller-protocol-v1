const { minutesToBlocks, DEFAULT_MAX_AMOUNT } = require('../../consts');

module.exports = {
    DAI: {
        // cToken configuration: Name and every # block to process the rate.
        cToken: 'CDAI',
        rateProcessFrequency: minutesToBlocks(5),
        // Max lending amount to borrow  (setLoanTerms)
        maxLendingAmount: DEFAULT_MAX_AMOUNT,
    },
    USDC: {
        // cToken configuration: Name and every # block to process the rate.
        cToken: 'CUSDC',
        rateProcessFrequency: minutesToBlocks(5),
        // Max lending amount to borrow  (setLoanTerms)
        maxLendingAmount: DEFAULT_MAX_AMOUNT,
    },
};