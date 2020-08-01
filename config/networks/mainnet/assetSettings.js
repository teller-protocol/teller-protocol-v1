const { DEFAULT_MAX_AMOUNT } = require('../../consts');

module.exports = {
    DAI: {
        cToken: 'CDAI',
        // Max loan amount to borrow  (see validation in createLoanWithTerms)
        // This value doesn't include the decimals.
        maxLoanAmount: DEFAULT_MAX_AMOUNT,
    },
    USDC: {
        cToken: 'CUSDC',
        // Max loan amount to borrow  (see validation in createLoanWithTerms)
        // This value doesn't include the decimals.
        maxLoanAmount: DEFAULT_MAX_AMOUNT,
    },
};