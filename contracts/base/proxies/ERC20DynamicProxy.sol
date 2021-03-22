pragma solidity 0.5.17;
pragma experimental ABIEncoderV2;

// Contracts
import "./InitializeableDynamicProxy.sol";
import "../upgradeable/DynamicUpgradeableERC20.sol";

// Interfaces
import "../../interfaces/IERC20DynamicProxy.sol";

/**
 * @notice It is a dynamic proxy contract for an ERC20 token contract. It uses the logic versions registry to get a logic contract address.
 *
 * @author develop@teller.finance
 */
contract ERC20DynamicProxy is
    IERC20DynamicProxy,
    InitializeableDynamicProxy,
    DynamicUpgradeableERC20
{
    /**
     * @notice It creates a new dynamic proxy specific for the TToken given a logic registry contract and a logic name.
     * @param logicRegistryAddress the settings contract address.
     * @param aLogicName the settings contract address.
     */
    function initialize(address logicRegistryAddress, bytes32 aLogicName)
        public
    {
        initialize(logicRegistryAddress, aLogicName, true);
        _updateImplementationStored();
    }
}
