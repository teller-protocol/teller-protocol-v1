pragma solidity 0.5.17;

import "../../base/TToken.sol";
import "./DAIMock.sol";

/**
 * @notice This contract represents DAI token within the Teller protocol
 *
 * @author develop@teller.finance
 */
contract TTokenMock is TToken {
    /* Constructor */
    /**
     * @dev Calls TToken constructor with token details
     * @param lendingPoolAddress the lending pool address.
     */
    constructor(address underlyingTokenAddress, address lendingPoolAddress)
        public
        TToken(underlyingTokenAddress, lendingPoolAddress)
    {
        _addMinter(msg.sender);
    }
}
