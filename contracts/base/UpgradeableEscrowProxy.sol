pragma solidity 0.5.17;
pragma experimental ABIEncoderV2;

// Contracts
import "@openzeppelin/upgrades/contracts/upgradeability/Proxy.sol";
import "./Escrow.sol";


/**
    @notice This proxy does not set it's implementation logic but gets it from the EscrowFactory contract.

    @author develop@teller.finance
 */
contract UpgradeableEscrowProxy is Proxy, Escrow {
    constructor(address settingsAddress, address loansAddress, uint256 loanID)
        public
        payable
    {
        _initialize(settingsAddress, loansAddress, loanID);
    }

    /**
        @dev Returns the current implementation.
        @return Address of the current implementation
     */
    function implementation() external view isInitialized() returns (address) {
        return _implementation();
    }

    /** Internal Functions **/

    /**
        @dev Returns the current implementation.
        @return Address of the current implementation
     */
    function _implementation() internal view isInitialized() returns (address) {
        return settings.getEscrowFactory().escrowLogic();
    }
}
