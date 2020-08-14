pragma solidity 0.5.17;

// External Libraries
import "@openzeppelin/contracts-ethereum-package/contracts/utils/Address.sol";

// Common
import "./ATMGovernance.sol";
import "../base/ATM/ATMToken.sol";
import "../util/AddressLib.sol";
import "../util/AddressArrayLib.sol";
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
    using AddressArrayLib for address[];
    using AddressLib for address;
    using Address for address;

    // Map of ATM instances
    // ATMProxy address => isATM
    mapping (address => bool) public atms;

    // List of ATM instances
    address[] public atmList;

    event SettingsUpdated(
        address indexed signer,
        address oldSettings,
        address newSettings
    ); 

    event ATMAdded(
        address indexed signer,
        address indexed atm,
        address indexed atmToken
    );

    ATMSettingsInterface private settings;


    function createATM()
        external
        onlySigner()
    {
        // Deploy ATM base contract
        // Create new ATM proxy
        // Set ATM v1
        //     //  constructor(
        //     // string memory _name,
        //     // string memory _symbol,
        //     // uint8 _decimals,
        //     // uint256 cap,
        //     // uint256 maxVestingsPerWallet
        //     // )
        // ATMToken token = new ATMToken();
        // ATMGovernance instance = new ATMGovernance();
        // instance.initialize(token);
        // atms.add(instance);
        // atmList.add(instance);
        // // emit event new ATM
    }


    function initialize(address _settings)
        external
        onlySigner()
        isNotInitialized()
    {
        _initialize();
        _setSettings(_settings);
        // emit event
    }

    function _setSettings(address _settings)
        internal
        onlySigner()
    {
        require(_settings.isContract(), "SETTINGS_MUST_BE_A_CONTRACT");
        address oldSettings = settings;
        settings = _settings;
        emit SettingsUpdated(msg.signer, oldSettings, settings);
    }

} 