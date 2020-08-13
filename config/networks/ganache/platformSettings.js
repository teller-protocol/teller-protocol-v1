const {
    MAX_VALUE_STRING,
    MAX_MAXIMUM_TOLERANCE_VALUE,
    DEFAULT_STARTING_BLOCK_OFFSET_NUMBER,
    DEFAULT_LIQUIDATE_ETH_PRICE,
    DEFAULT_MAXIMUM_TOLERANCE,
} = require('../../consts');
const settingsNames = require('../../../test/utils/platformSettingsNames');
const { daysToSeconds, minutesToSeconds } = require('../../../test/utils/consts');

module.exports = {
    /**
        It represents the total number of submissions required for consensus on a value.
    */
    [settingsNames.RequiredSubmissions]: {
        processOnDeployment: true,
        value: 2,
        min: 0,
        max: MAX_VALUE_STRING,
    },
    /**
        This is the maximum tolerance for the values submitted (by nodes) when they are aggregated (average). It is used in the consensus mechanisms.
        This is a percentage value with 2 decimal places.
            i.e. maximumTolerance of 325 => tolerance of 3.25% => 0.0325 of value
            i.e. maximumTolerance of 0 => It means all the values submitted must be equals.        
        The max value is 100% => 10000
    */
    [settingsNames.MaximumTolerance]: {
        processOnDeployment: true,
        value: DEFAULT_MAXIMUM_TOLERANCE,
        min: 0,
        max: MAX_MAXIMUM_TOLERANCE_VALUE,
    },
    /**
        This is the maximum time (in seconds) a node has to submit a response. After that time, the response is considered expired.
    */
    [settingsNames.ResponseExpiryLength]: {
        processOnDeployment: true,
        value: daysToSeconds(30),
        min: 0,
        max: MAX_VALUE_STRING,
    },
    /**
        This is the minimum time you need to wait (in seconds) between the last time you deposit collateral and you take out the loan.
        It is used to avoid potential attacks using Flash Loans (AAVE) or Flash Swaps (Uniswap V2).
     */
    [settingsNames.SafetyInterval]: {
        processOnDeployment: true,
        value: minutesToSeconds(1),
        min: 0,
        max: MAX_VALUE_STRING,
    },
    /**
        This represents the time (in seconds) that loan terms will be available after requesting them.
        After this time, the loan terms will expire and the borrower will need to request it again. 
     */
    [settingsNames.TermsExpiryTime]: {
        processOnDeployment: true,
        value: daysToSeconds(30),
        min: 0,
        max: MAX_VALUE_STRING,
    },
    /**
        It represents the percentage value (with 2 decimal places) to liquidate loans.

        i.e. an ETH liquidation price at 95% is stored as 9500
     */
    [settingsNames.LiquidateEthPrice]: {
        processOnDeployment: true,
        value: DEFAULT_LIQUIDATE_ETH_PRICE,
        min: 0,
        max: MAX_VALUE_STRING,
    },
    /**
        It represents the maximum duration for a loan. It is defined in seconds.
     */
    [settingsNames.MaximumLoanDuration]: {
        processOnDeployment: true,
        value: daysToSeconds(60),
        min: 0,
        max: MAX_VALUE_STRING,
    },
    /**
        It represents the collateral buffer used in the clode nodes to calculate the minimum collateral.
     */
    [settingsNames.CollateralBuffer]: {
        processOnDeployment: true,
        value: 1500,
        min: 0,
        max: MAX_VALUE_STRING,
    },
    [settingsNames.StartingBlockOffsetNumber]: {
        processOnDeployment: true,
        value: DEFAULT_STARTING_BLOCK_OFFSET_NUMBER,
        min: 0,
        max: MAX_VALUE_STRING,
    },
    /**
        It represents the first block number where the cloud nodes must start to process data.
     */
    [settingsNames.StartingBlockNumber]: {
        // As it depends on the current block number, it must be configured manually.
        processOnDeployment: false,
        value: undefined, // It is calculated
        min: 0,
        max: MAX_VALUE_STRING,
    },
    
};