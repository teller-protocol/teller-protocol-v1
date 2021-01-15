pragma solidity 0.5.17;

// Interfaces
import "./TTokenInterface.sol";

/**
    @notice It defines all the functions for the TToken registry

    @author develop@teller.finance
 */

interface TTokenRegistryInterface {
    /**
        @notice This event is emitted when a new TToken contract address has been registered
        @param tToken The contract address registered
     */
    event TTokenRegistered(address indexed tToken);

    /** External Functions */

    /**
        @notice It registers a new TToken contract address
        @param tToken Contract address of the TToken
      */
    function registerTToken(TTokenInterface tToken) external;
}
