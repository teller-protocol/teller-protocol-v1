pragma solidity 0.5.17;

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
    @notice This interface defines the functions to create the ATM instances.
    @author develop@teller.finance
 */
interface IATMFactory {
    /** Events */

    /**
        @notice This event is emitted when a new ATM instance is created.
        @param creator creator address.
        @param atmGovernanceAddress new ATM Governance instance address.
        @param tlrTokenAddress new TLR Token instance address.
        @param liquidityMiningAddress new ATM Liquidity Mining instance address.
     */
    event ATMCreated(
        address indexed creator,
        address indexed atmGovernanceAddress,
        address indexed tlrTokenAddress,
        address liquidityMiningAddress
    );

    /* State Variables */

    /** Modifiers */

    /* Constructor */

    /** External Functions */

    /**
        @notice It creates a new ATM instance.
        @param name The token name.
        @param symbol The token symbol
        @param decimals The token decimals 
        @param cap Token max cap.
        @param maxVestingPerWallet max vestings per wallet for the token.
        @param tlrInitialReward ATM Liquidity Mining initial reward.
        @return the new ATM governance instance address.
     */
    function createATM(
        string calldata name,
        string calldata symbol,
        uint8 decimals,
        uint256 cap,
        uint256 maxVestingPerWallet,
        uint256 tlrInitialReward
    ) external returns (address);

    /**
        @notice Tests whether an address is an ATM instance or not.
        @param atmAddress address to test.
        @return true if the given address is an ATM. Otherwise it returns false.
     */
    function isATM(address atmAddress) external view returns (bool);

    /**
        @notice Gets the ATMs list.
        @return the list of ATMs.
     */
    function getATMs() external view returns (address[] memory);

    /**
        @notice Returns the token address of a given associated atm address.
        @param atmAddress ATM address to test
        @return Address of the associated TLR Token
     */
    function getTLRToken(address atmAddress) external view returns (address);

    /**
        @notice It initializes this ATM Governance Factory instance.
        @param settingsAddress settings address.
     */
    function initialize(address settingsAddress) external;
}
