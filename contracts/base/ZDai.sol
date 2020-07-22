pragma solidity 0.5.17;

import "./ZToken.sol";


/**
 * @notice This contract represents DAI token within the Teller protocol
 *
 * @author develop@teller.finance
 */
// TODO: Change to TDAI
contract ZDAI is ZToken {
    /* State Variables */
    string private constant NAME = "Zero Collateral DAI";
    string private constant SYMBOL = "zDAI";
    uint8 private constant DECIMALS = 18;

    /* Constructor */
    /**
     * @dev Calls ZToken constructor with token details
     */
    constructor() public ZToken(NAME, SYMBOL, DECIMALS) {}
}
