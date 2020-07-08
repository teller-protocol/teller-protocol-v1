const { DEFAULT_MAX_AMOUNT, hoursToBlocks } = require('../../consts');

module.exports = {
    DAI: {
        // cToken configuration: Name and every # block to process the rate.
        cToken: 'CDAI',
        rateProcessFrequency: hoursToBlocks(6),
        // Max lending amount to borrow  (setLoanTerms)
        maxLendingAmount: DEFAULT_MAX_AMOUNT,
    },
    USDC: {
        // cToken configuration: Name and every # block to process the rate.
        cToken: 'CUSDC',
        rateProcessFrequency: hoursToBlocks(6),
        // Max lending amount to borrow  (setLoanTerms)
        maxLendingAmount: DEFAULT_MAX_AMOUNT,
    },
};