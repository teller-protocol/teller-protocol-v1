pragma solidity 0.5.17;

// External Libraries

// Common
import "../util/AddressArrayLib.sol";
import "../base/TInitializable.sol";
import "../base/DynamicProxy.sol";
import "../base/BaseUpgradeable.sol";

// Interfaces
import "./TLRTokenInterface.sol";
import "./ATMGovernanceInterface.sol";
import "../interfaces/LogicVersionsRegistryInterface.sol";
import "../atm/ATMFactoryInterface.sol";

/*****************************************************************************************************/
/**                                             WARNING                                             **/
/**                                  THIS CONTRACT IS UPGRADEABLE!                                  **/
/**  ---------------------------------------------------------------------------------------------  **/
/**  Do NOT change the order of or PREPEND any storage variables to this or new versions of this    **/
/**  contract as this will cause the the storage slots to be overwritten on the proxy contract!!    **/
/**                                                                                                 **/
/**  Visit https://docs.openzeppelin.com/upgrades/2.6/proxies#upgrading-via-the-proxy-pattern for   **/
/**  more information.                                                                              **/
/*****************************************************************************************************/
/**
    @notice This contract will create upgradeable ATM instances.
    @author develop@teller.finance
 */
contract ATMFactory is ATMFactoryInterface, TInitializable, BaseUpgradeable {
    using AddressArrayLib for address[];

    /**
        @notice It defines whether an ATM address exists or not.
            Example:
                address(0x1234...890) => true
                address(0x2345...890) => false
     */
    mapping(address => bool) public atms;

    mapping(address => address) public tlrTokens;

    // List of ATM instances
    address[] public atmsList;

    /**
        @notice It creates a new ATM instance.
        @param name The token name.
        @param symbol The token symbol
        @param decimals The token decimals 
        @param cap Token max cap.
        @param maxVestingPerWallet max vestings per wallet for the token.
        @return the new ATM governance instance address.
     */
    function createATM(
        string calldata name,
        string calldata symbol,
        uint8 decimals,
        uint256 cap,
        uint256 maxVestingPerWallet
    ) external onlyPauser() isInitialized() returns (address) {
        address owner = msg.sender;

        bytes32 tlrTokenLogicName = LogicVersionsRegistryInterface(settings()
            .versionsRegistry())
            .consts()
            .TLR_TOKEN_LOGIC_NAME();
        TLRTokenInterface tlrTokenProxy = TLRTokenInterface(
            address(new DynamicProxy(address(settings()), tlrTokenLogicName))
        );

        bytes32 atmGovernanceLogicName = LogicVersionsRegistryInterface(settings()
            .versionsRegistry())
            .consts()
            .ATM_GOVERNANCE_LOGIC_NAME();
        ATMGovernanceInterface atmGovernanceProxy = ATMGovernanceInterface(
            address(new DynamicProxy(address(settings()), atmGovernanceLogicName))
        );
        atmGovernanceProxy.initialize(address(settings()), owner);
        address atmGovernanceProxyAddress = address(atmGovernanceProxy);

        tlrTokenProxy.initialize(
            name,
            symbol,
            decimals,
            cap,
            maxVestingPerWallet,
            address(settings()),
            atmGovernanceProxyAddress
        );
        address tlrTokenProxyAddress = address(tlrTokenProxy);

        atms[atmGovernanceProxyAddress] = true;
        tlrTokens[atmGovernanceProxyAddress] = tlrTokenProxyAddress;
        atmsList.add(atmGovernanceProxyAddress);

        // Emit new ATM created event.
        emit ATMCreated(owner, atmGovernanceProxyAddress, tlrTokenProxyAddress);

        return atmGovernanceProxyAddress;
    }

    /**
        @notice It initializes this ATM Governance Factory instance.
        @param settingsAddress settings address.
     */
    function initialize(address settingsAddress) external isNotInitialized() {
        _setSettings(settingsAddress);

        _initialize();
    }

    /**
        @notice Tests whether an address is an ATM instance or not.
        @param atmAddress address to test.
        @return true if the given address is an ATM. Otherwise it returns false.
     */
    function isATM(address atmAddress) external view returns (bool) {
        return atms[atmAddress];
    }

    /**
        @notice Returns the token address of a given associated atm address.
        @param atmAddress ATM address to test
        @return Address of the associated TLR Token
     */
    function getTLRToken(address atmAddress) external view returns (address) {
        return tlrTokens[atmAddress];
    }

    /**
        @notice Gets the ATMs list.
        @return the list of ATMs.
     */
    function getATMs() external view returns (address[] memory) {
        return atmsList;
    }
}
