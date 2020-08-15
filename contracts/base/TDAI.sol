pragma solidity 0.5.17;

import "./TToken.sol";


/**
 * @notice This contract represents DAI token within the Teller protocol
 *
 * @author develop@teller.finance
 */
contract TDAI is TToken {
    /* State Variables */
    string private constant NAME = "Teller DAITest";
    string private constant SYMBOL = "tDAITest";
    uint8 private constant DECIMALS = 18;

    /* Constructor */
    /**
     * @dev Calls TToken constructor with token details
     */
    constructor() public TToken(NAME, SYMBOL, DECIMALS) {}
}
