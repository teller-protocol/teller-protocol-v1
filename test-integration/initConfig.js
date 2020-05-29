const { minutesToSeconds } = require('../test/utils/consts');

/**
    This initial configuration is used to setup the smart contract settings and allows the integration tests run properly.
 */
module.exports = {
    // Used to add signers in the LoanTermsConsensus contracts used for each token (or lending token).
    tokenNames: ['DAI', 'USDC'],
    /*
        Used to add as signers in all the LoanTermsConsensus contracts.
        All address between 'fromIndex' and 'toIndex' are added as signers.
        Then, they are used in the integration tests as node validatiors and message signers.
        Please, verify the 'toIndex' needs to be lower than the ADDRESS_COUNT_KEY (env variable).
    */
    addressToAddFromIndex: 9,
    addressToAddToIndex: 14,
    // Used to set as min required (responses) submissions when a borrower asks to node validators to sign responses.
    requiredSubmissions: 2,
    // Used to set as min time window (in seconds) between last time borrower deposited collateral and when the borrower takes out the loan.
    safetyInterval: minutesToSeconds(1),
};
