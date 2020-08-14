pragma solidity 0.5.17;

// External Libraries
import "@openzeppelin/contracts-ethereum-package/contracts/utils/Address.sol";

// Common
import "./ATMGovernance.sol";
import "../util/AddressLib.sol";
import "../base/TInitializable.sol";
// Contracts
import "@openzeppelin/contracts-ethereum-package/contracts/access/roles/SignerRole.sol";

// Interfaces
import "./IATMGovernance.sol";
import "../settings/ATMSettingsInterface.sol";

/**
    @notice This contract will create upgradeable ATM instances.
    @author develop@teller.finance
 */
contract ATMGovernanceFactory is SignerRole, TInitializable {

    // Map of ATM instances
    // ATMProxy address => isATM
    mapping (address => bool) public atms;

    // List of ATM instances
    address[] public atmList;

    
    ATMSettingsInterface private settings;

    function createATM()
        external
        onlySigner()
    {
        // Deploy ATM base contract
        // Create new ATM proxy
        // Set ATM v1
    }


    function initialize(address _settings) public initializer {
        setting = _settings;
    }
} 