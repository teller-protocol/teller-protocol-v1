pragma solidity 0.5.17;

// Interfaces
import "../interfaces/IBaseProxy.sol";

// Contracts
import "@openzeppelin/upgrades/contracts/upgradeability/Proxy.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/utils/Address.sol";

/**
    @notice It is the base Proxy contract for all other Proxy contracts.
    @dev It makes the current logic implementation address publicly available.

    @author develop@teller.finance
 */
contract BaseProxy is IBaseProxy, Proxy {
    using Address for address;

    /**
        @notice Returns the current implementation.
        @return Address of the current implementation
     */
    function implementation() external view returns (address) {
        return _implementation();
    }
}
