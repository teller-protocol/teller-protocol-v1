pragma solidity 0.5.17;

// External Libraries
import "@openzeppelin/contracts/utils/Address.sol";

// Common
import "./ATMGovernance.sol";
import "../util/AddressLib.sol";

// Contracts
import "@openzeppelin/contracts/access/roles/SignerRole.sol";

// Interfaces
import "./IATMGovernance.sol";
import "../settings/ATMSettingsInterface.sol";

/**
    @notice This contract will create upgradeable ATM instances.
    @author develop@teller.finance
 */
contract ATMGovernanceFactory is SignerRole {

    // Map of ATM instances
    // ATMProxy address => isATM
    mapping (address => bool) public atmProxies;

    // List of ATM instances
    address[] public atmProxies;

    // List of ATM Token instances
    // ATMToken address => ATM address
    mapping (address => address) public atmTokens;


    ATMSettingsInterface private settings;


} 