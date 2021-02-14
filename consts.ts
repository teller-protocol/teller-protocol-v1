import { BigNumber } from 'bignumber.js';
export const MAX_VALUE = new BigNumber(2).pow(256).minus(1);
const maxValueString = MAX_VALUE.toFixed(0);

export const ETH_ADDRESS = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';
export const DUMMY_ADDRESS = '0x0000000000000000000000000000000000000001';
export const DEFAULT_MAX_AMOUNT = 1000;
export const INITIAL_NODE_COMPONENT_VERSION = 10000;
export const MAX_MAXIMUM_TOLERANCE_VALUE = 10000;
export const MAX_VALUE_STRING = maxValueString;
export const DEFAULT_REQUIRED_SUBMISSIONS_PERCENTAGE = 8000;
export const DEFAULT_MAXIMUM_TOLERANCE = 0;
export const DEFAULT_RESPONSE_EXPIRY = 2592000; // 30 day,
export const DEFAULT_SAFETY_INTERVAL = 300; // 5 minute,
export const DEFAULT_TERMS_EXPIRY_TIME = 2592000; // 30 day,
export const DEFAULT_LIQUIDATE_ETH_PRICE = 9500; // 95%,
export const DEFAULT_STARTING_BLOCK_OFFSET_NUMBER = 40;
export const DEFAULT_COLLATERAL_BUFFER = 1500; // 15%
