pragma solidity 0.5.17;

import "./TTokenMock.sol";
import "./USDCMock.sol";

/**
 * @notice This contract represents USDC token within the Teller protocol
 *
 * @author develop@teller.finance
 */
contract TUSDC is TTokenMock {
    /* Constructor */
    /**
     * @dev Calls TToken constructor with token details
     * @param lendingPoolAddress the lending pool address.
     */
    constructor(address lendingPoolAddress)
        public
        TTokenMock(address(new USDCMock()), lendingPoolAddress)
    {}
}
