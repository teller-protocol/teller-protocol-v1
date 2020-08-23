pragma solidity 0.5.17;


interface IDapp {
    /**
        @notice This event is emitted when canonical WETH address is updated.
        @param sender message sender address.
        @param previousWeth previous WETH address.
        @param newWethAddress new WETH address.
     */
    event WethAddressUpdated(
        address sender,
        address indexed previousWeth,
        address newWethAddress
    );
}
