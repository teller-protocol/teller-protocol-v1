pragma solidity 0.5.17;
pragma experimental ABIEncoderV2;

// Contracts
import "./DynamicUpgradeableStorage.sol";

/*****************************************************************************************************/
/**                                             WARNING                                             **/
/**                              THIS CONTRACT IS AN UPGRADEABLE FACET!                             **/
/**  ---------------------------------------------------------------------------------------------  **/
/**  Do NOT place ANY storage/state variables directly in this contract! If you wish to make        **/
/**  make changes to the state variables used by this contract, do so in its defined Storage        **/
/**  contract that this contract inherits from                                                      **/
/**                                                                                                 **/
/**  Visit https://docs.openzeppelin.com/upgrades/2.6/proxies#upgrading-via-the-proxy-pattern for   **/
/**  more information.                                                                              **/
/*****************************************************************************************************/
/**
    @notice This contract is used define the DynamicUpgradeable contracts logic.

    @author develop@teller.finance
 */
contract DynamicUpgradeable is DynamicUpgradeableStorage {
    /* External Functions */

    function upgradeProxyTo(address newImplementation) public {
        require(msg.sender == address(logicRegistry), "MUST_BE_LOGIC_REGISTRY");
        implementationStored = newImplementation;
        _implementationBlockUpdated = block.number;
    }

    /* Internal Functions **/

    /**
     * @notice Returns the current implementation used by the proxy to delegate a call to.
     * @return address of the current implementation
     */
    function _implementation() internal view returns (address) {
        return implementationStored;
    }

    /**
     * @notice Updates the current implementation logic address for the stored logic name.
     * @dev It uses the LogicVersionsRegistry contract to get the logic address or the cached address if valid.
     * @dev It caches the current logic address for the proxy to reduce gas on subsequent calls within the same block.
     */
    function _updateImplementationStored() internal {
        (, , address currentLogic) = logicRegistry.getLogicVersion(logicName);

        if (implementationStored != currentLogic) {
            implementationStored = currentLogic;
        }
        _implementationBlockUpdated = block.number;
    }

    /**
     * @notice It is called by the OZ proxy contract before calling the internal _implementation() function.
     */
    function _willFallback() internal {
        if (strictDynamic && _implementationBlockUpdated + 50 <= block.number) {
            _updateImplementationStored();
        }
    }
}
