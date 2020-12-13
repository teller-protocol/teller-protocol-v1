pragma solidity 0.5.17;

// Interfaces
import "../interfaces/IBaseProxy.sol";

// Contracts
import "@openzeppelin/upgrades/contracts/upgradeability/Proxy.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/utils/Address.sol";
import "./BaseUpgradeable.sol";

/**
    @notice It is the base Proxy contract for all other Proxy contracts.
    @dev It makes the current logic implementation address publicly available.

    @author develop@teller.finance
 */
contract BaseProxy is IBaseProxy, BaseUpgradeable, Proxy {
    using Address for address;

    /**
        @notice Returns the current implementation.
        @return Address of the current implementation
     */
    function implementation() external view returns (address) {
        return _implementation();
    }

    /** Internal Functions **/

    /**
     * @notice Overrides the _willFallback() function of Proxy, which enables some code to
     * be executed prior to the fallback function. In this case, the purpose of this code
     * is to check if the msg.sender has the authorization required to interact with the Teller protocol
     */
    function _willFallback() internal {
        if (address(this) != msg.sender && address(_getSettings()).isNotEmpty()) {
            _getSettings().requireAuthorization(msg.sender);
        }
        super._willFallback();
    }
}
