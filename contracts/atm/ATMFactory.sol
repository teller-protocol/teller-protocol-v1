pragma solidity 0.5.17;
pragma experimental ABIEncoderV2;

// External Libraries

// Common
import "../util/AddressArrayLib.sol";
import "../base/TInitializable.sol";
import "../base/DynamicProxy.sol";

// Interfaces
import "./ITLRToken.sol";
import "./TLRToken.sol";
import "./IATMGovernance.sol";
import "./IATMFactory.sol";
import "./IATMLiquidityMining.sol";

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
contract ATMFactory is IATMFactory, TInitializable, BaseUpgradeable {
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
        uint256 maxVestingPerWallet,
        uint256 tlrInitialReward
    ) external onlyPauser() isInitialized() returns (address) {
        address atmGovernanceProxyAddress = _createGovernance(tlrInitialReward);
        address tlrTokenProxyAddress = _createTLRToken(
            name,
            symbol,
            decimals,
            cap,
            maxVestingPerWallet,
            atmGovernanceProxyAddress
        );
        address liquidityMiningAddress = _createLiquidityMining(
            atmGovernanceProxyAddress,
            tlrTokenProxyAddress
        );
        TLRToken(tlrTokenProxyAddress).addMinter(liquidityMiningAddress);

        atms[atmGovernanceProxyAddress] = true;
        tlrTokens[atmGovernanceProxyAddress] = tlrTokenProxyAddress;
        atmsList.add(atmGovernanceProxyAddress);

        // Emit new ATM created event.
        emit ATMCreated(
            msg.sender,
            atmGovernanceProxyAddress,
            tlrTokenProxyAddress,
            liquidityMiningAddress
        );

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

    /**
        @notice Helper function to create a new ATMGovernance instance.
        @param tlrInitialReward TLR initial reward set on Liquidity mining program associated with this ATM.
     */
    function _createGovernance(uint256 tlrInitialReward) internal returns (address) {
        bytes32 atmGovernanceLogicName = _getSettings()
            .versionsRegistry()
            .consts()
            .ATM_GOVERNANCE_LOGIC_NAME();
        IATMGovernance atmGovernanceProxy = IATMGovernance(
            address(new DynamicProxy(address(_getSettings()), atmGovernanceLogicName))
        );
        atmGovernanceProxy.initialize(
            address(_getSettings()),
            msg.sender,
            tlrInitialReward
        );
        return address(atmGovernanceProxy);
    }

    /**
        @notice Helper function to create a new TLR token instance associated with new ATM.
        @param name TLR token name.
        @param symbol TLR token symbol.
        @param decimals  TLR token decimals.
        @param cap  TLR token max cap.
        @param maxVestingPerWallet  TLR token max amount of vestings per address.
        @param atmGovernanceProxyAddress ATMGovernance instance associated with this new TLR instance. 
     */
    function _createTLRToken(
        string memory name,
        string memory symbol,
        uint8 decimals,
        uint256 cap,
        uint256 maxVestingPerWallet,
        address atmGovernanceProxyAddress
    ) internal returns (address) {
        bytes32 tlrTokenLogicName = _getSettings()
            .versionsRegistry()
            .consts()
            .TLR_TOKEN_LOGIC_NAME();
        ITLRToken tlrTokenProxy = ITLRToken(
            address(new DynamicProxy(address(_getSettings()), tlrTokenLogicName))
        );
        tlrTokenProxy.initialize(
            name,
            symbol,
            decimals,
            cap,
            maxVestingPerWallet,
            address(_getSettings()),
            atmGovernanceProxyAddress
        );
        return address(tlrTokenProxy);
    }

    /**
        @notice Helper function to create a new Liquidity Mining program instance.
        @param governance ATMGovernance instance address associated to this new Liquidity Mining.
        @param tlr TLRToken instance address associated to this new Liquidity Mining.
     */
    function _createLiquidityMining(address governance, address tlr)
        internal
        returns (address)
    {
        bytes32 liquidityMiningLogicName = _getSettings()
            .versionsRegistry()
            .consts()
            .ATM_LIQUIDITY_MINING_LOGIC_NAME();
        IATMLiquidityMining liquidityMining = IATMLiquidityMining(
            address(new DynamicProxy(address(_getSettings()), liquidityMiningLogicName))
        );
        liquidityMining.initialize(address(_getSettings()), governance, tlr);
        return address(liquidityMining);
    }
}
