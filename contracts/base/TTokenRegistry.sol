pragma solidity 0.5.17;

// Utils
import "@openzeppelin/contracts-ethereum-package/contracts/ownership/Ownable.sol";

// Interfaces
import "../interfaces/TTokenRegistryInterface.sol";

/**
    @notice It manages all the registered TToken contract address, mapping each one to a boolean.

    @author develop@teller.finance
 */
contract TTokenRegistry is TTokenRegistryInterface, Ownable {
    /* State Variables */

    /**
        @notice It represents a mapping to identify they contract address of a given TToken

        i.e.:
            address("0x479...584") => { True }.
            address("0x132...741") => { False }.
     */
    mapping(address => bool) public tokenRegistry;

    // Constructor

    constructor() public {
        Ownable.initialize(_msgSender());
    }

    // External Functions

    /**
        @notice It registers a new TToken contract address
        @param tToken Contract address of the TToken
     */
    function registerTToken(TTokenInterface tToken) external onlyOwner {
        tokenRegistry[address(tToken)] = true;

        emit TTokenRegistered(address(tToken));
    }
}
