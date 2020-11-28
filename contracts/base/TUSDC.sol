pragma solidity 0.5.17;

import "./TToken.sol";

/**
 * @notice This contract represents USDC token within the Teller protocol
 *
 * @author develop@teller.finance
 */
contract TUSDC is TToken {
    /* State Variables */
    string private constant NAME = "Teller USDC";
    string private constant SYMBOL = "tUSDC";
    uint8 private constant DECIMALS = 6;

    /* Constructor */
    /**
     * @dev Calls TToken constructor with token details
     * @param settingsAddress the setting address.
     */
    constructor(address settingsAddress) public TToken(settingsAddress, NAME, SYMBOL, DECIMALS) {}
}
