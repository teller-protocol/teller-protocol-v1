pragma solidity 0.5.17;

import "./TToken.sol";

/**
 * @notice This contract represents DAI token within the Teller protocol
 *
 * @author develop@teller.finance
 */
contract TDAI is TToken {
    /* State Variables */
    string private constant NAME = "Teller DAI";
    string private constant SYMBOL = "tDAI";
    uint8 private constant DECIMALS = 18;

    /* Constructor */
    /**
     * @dev Calls TToken constructor with token details
     * @param settingsAddress the setting address.
     */
    constructor(address settingsAddress)
        public
        TToken(settingsAddress, NAME, SYMBOL, DECIMALS)
    {}
}
