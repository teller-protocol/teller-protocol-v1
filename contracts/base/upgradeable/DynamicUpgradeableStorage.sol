pragma solidity 0.5.17;
pragma experimental ABIEncoderV2;

// Interfaces
import "../../interfaces/LogicVersionsRegistryInterface.sol";

/*****************************************************************************************************/
/**                                             WARNING                                             **/
/**                        THIS CONTRACT IS A NON UPGRADEABLE STORAGE CONTRACT!                     **/
/**  ---------------------------------------------------------------------------------------------  **/
/**  Do NOT change the order of, PREPEND, or APPEND any storage variables to this or new versions   **/
/**  of this contract as this will cause a ripple affect to the storage slots of all child          **/
/**  contracts that inherit from this contract to be overwritten on the deployed proxy contract!!   **/
/**                                                                                                 **/
/**  Visit https://docs.openzeppelin.com/upgrades/2.6/proxies#upgrading-via-the-proxy-pattern for   **/
/**  more information.                                                                              **/
/*****************************************************************************************************/
/**
    @notice This contract is used define the storage variables for all DynamicUpgradeable contracts.

    @author develop@teller.finance
 */
contract DynamicUpgradeableStorage {
    /**
     * @notice It returns the logic registry that is used to determine the implementation logic for this proxy.
     * @dev See LogicVersionsRegistry contract.
     * @return LogicVersionsRegistryInterface
     */
    LogicVersionsRegistryInterface public logicRegistry;

    /**
     * @notice It represent the logic name (key) used for this proxy.
     * @dev It is used by LogicVersionsRegistry to get the logic address for the given logic name.
     * @dev It must NOT change over time.
     * @return bytes32 the logic name.
     */
    bytes32 public logicName;

    /**
     * @param strictDynamic Boolean indicating if the proxy must check the registry for a new implementation.
     */
    bool public strictDynamic;

    /**
     * @notice It stores the last known logic address locally to reduce gas costs.
     */
    address public implementationStored;

    /**
     * @notice It is the block number which the last time the proxy implementation was checked.
     */
    uint256 internal _implementationBlockUpdated;
}
