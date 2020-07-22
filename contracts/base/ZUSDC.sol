pragma solidity 0.5.17;

import "./ZToken.sol";


/**
 * @notice This contract represents USDC token within the Teller protocol
 *
 * @author develop@teller.finance
 */
// TODO: Change to TUSDC
contract ZUSDC is ZToken {
    /* State Variables */
    string private constant NAME = "Zero Collateral USDC";
    string private constant SYMBOL = "zUSDC";
    uint8 private constant DECIMALS = 6;

    /* Constructor */
    /**
     * @dev Calls ZToken constructor with token details
     */
    constructor() public ZToken(NAME, SYMBOL, DECIMALS) {}
}
