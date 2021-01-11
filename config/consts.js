const {BigNumber} = require("bignumber.js");

const MAX_VALUE = new BigNumber(2).pow(256).minus(1);
const maxValueString = MAX_VALUE.toFixed(0);

module.exports = {
  /**
        As default this address is used to represent ETH.
     */
  ETH_ADDRESS: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
  /*
        This address is ONLY used in network configurations where:
        1 - We have't deployed the contracts yet. Examples: mainnet.
        2- It is not possible to deploy third party contracts. Example: Chainlink in Ganache.
    */
  DUMMY_ADDRESS: "0x0000000000000000000000000000000000000001",
  /**
        This is used as a default amount to configure max lending amount.
    */
  DEFAULT_MAX_AMOUNT: 1000,
  /**
   * Represents the initial version of the Node Component.
   *
   * e.g.: 10000 => represents : 1.00.00
   */
  INITIAL_NODE_COMPONENT_VERSION: 10000,
  /**
        The maximum tolerance is a percentage with 2 decimals.
        Examples:
            350 => 3.5%
            4000 => 40.00%

        The max value is 100% => 10000
    */
  MAX_MAXIMUM_TOLERANCE_VALUE: 10000,
  /**
        The max value for a uint256 (solidity type)
        It is used as a max value for some settings.
    */
  MAX_VALUE,
  MAX_VALUE_STRING: maxValueString,
  DEFAULT_REQUIRED_SUBMISSIONS_PERCENTAGE: 8000,
  DEFAULT_MAXIMUM_TOLERANCE: 0,
  DEFAULT_RESPONSE_EXPIRY: 2592000, // 30 day,
  DEFAULT_SAFETY_INTERVAL: 300, // 5 minute,
  DEFAULT_TERMS_EXPIRY_TIME: 2592000, // 30 day,
  DEFAULT_LIQUIDATE_ETH_PRICE: 9500, // 95%,
  DEFAULT_STARTING_BLOCK_OFFSET_NUMBER: 40,
  DEFAULT_COLLATERAL_BUFFER: 1500, // 15%
};
