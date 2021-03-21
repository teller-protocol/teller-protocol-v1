pragma solidity 0.5.17;

interface IEscrowDynamicProxy {
    /**
        @notice It initializes a new dynamic proxy given a logic registry contract and a logic name.
        @param aLogicRegistryAddress the settings contract address.
     */
    function initialize(address aLogicRegistryAddress) external;
}
