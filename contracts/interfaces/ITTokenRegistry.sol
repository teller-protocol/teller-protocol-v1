pragma solidity 0.5.17;

/**
    @notice It defines all the functions for the TToken registry

    @author develop@teller.finance
 */

interface ITTokenRegistry {
    /**
        @notice This event is emitted when a new TToken contract address has been registered
        @param tToken The contract address registered
        @param sender The transaction sender.
     */
    event TTokenRegistered(address indexed tToken, address indexed sender);

    /** External Functions */

    /**
        @notice It registers a new TToken contract address
        @param tToken Contract address of the TToken
      */
    function registerTToken(address tToken) external;

    /**
        @notice Checks if a given address is a registered TToken contract
        @param tokenAddress The token contract address to check
        @return bool representing if the address is a registered TToken contract
     */
    function isTToken(address tokenAddress) external view returns (bool);

    /**
        @notice It initializes this ttoken registry contract instance
        @param settingsAddress The settings contract address
     */
    function initialize(address settingsAddress) external;
}
