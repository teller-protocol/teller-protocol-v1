pragma solidity 0.5.17;
pragma experimental ABIEncoderV2;

// Libraries
import "@openzeppelin/contracts-ethereum-package/contracts/utils/Address.sol";

// Contracts
import "../base/TInitializable.sol";
import "../base/BaseUpgradeable.sol";

// Interfaces
import "./IATMSettings.sol";

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
    @notice It manages the settings for the ATMs.

    @author develop@teller.finance
 */
contract ATMSettings is IATMSettings, TInitializable, BaseUpgradeable {
    using Address for address;

    /** Constants */

    /* State Variables */

    /**
        @notice It represents a mapping to identify whether a ATM is paused or not.

        i.e.: address(ATM) => true or false.
     */
    mapping(address => bool) public atmPaused;

    /**
        @notice It represents a mapping to identify the ATM used in a given market.
        @notice A market is defined by a borrowed token and a collateral token.

        i.e.: address(DAI) => address(ETH) => address(ATM Teller)
     */
    mapping(address => mapping(address => address)) public marketToAtm;

    /* Constructor */

    /** External Functions */

    /**
        @notice It pauses a given ATM.
        @param atmAddress ATM address to pause.
     */
    function pauseATM(address atmAddress) external onlyPauser() isInitialized() {
        require(settings().isPaused() == false, "PLATFORM_IS_ALREADY_PAUSED");
        require(atmPaused[atmAddress] == false, "ATM_IS_ALREADY_PAUSED");

        atmPaused[atmAddress] = true;

        emit ATMPaused(atmAddress, msg.sender);
    }

    /**
        @notice It unpauses a given ATM.
        @param atmAddress ATM address to unpause.
     */
    function unpauseATM(address atmAddress) external onlyPauser() isInitialized() {
        require(settings().isPaused() == false, "PLATFORM_IS_PAUSED");
        require(atmPaused[atmAddress] == true, "ATM_IS_NOT_PAUSED");

        atmPaused[atmAddress] = false;

        emit ATMUnpaused(msg.sender, atmAddress);
    }

    /**
        @notice Gets whether an ATM is paused (or the platform is paused) or not.
        @param atmAddress ATM address to test.
        @return true if ATM is paused. Otherwise it returns false.
     */
    function isATMPaused(address atmAddress) external view returns (bool) {
        return settings().isPaused() || atmPaused[atmAddress];
    }

    /**
        @notice Sets an ATM for a given market (borrowed token and collateral token).
        @param borrowedToken borrowed token address.
        @param collateralToken collateral token address.
        @param atmAddress ATM address to set.
     */
    function setATMToMarket(
        address borrowedToken,
        address collateralToken,
        address atmAddress
    ) external onlyPauser() isInitialized() {
        require(atmAddress.isContract(), "ATM_GOV_MUST_BE_CONTRACT");
        require(borrowedToken.isContract(), "BORROWED_TOKEN_MUST_BE_CONTRACT");
        require(
            collateralToken == settings().ETH_ADDRESS() ||
                collateralToken.isContract(),
            "COLL_TOKEN_MUST_BE_CONTRACT"
        );
        require(
            marketToAtm[borrowedToken][collateralToken] == address(0x0),
            "ATM_TO_MARKET_ALREADY_EXIST"
        );

        marketToAtm[borrowedToken][collateralToken] = atmAddress;

        emit MarketToAtmSet(borrowedToken, collateralToken, atmAddress, msg.sender);
    }

    /**
        @notice Updates a new ATM for a given market (borrowed token and collateral token).
        @param borrowedToken borrowed token address.
        @param collateralToken collateral token address.
        @param newAtmAddress the new ATM address to update.
     */
    function updateATMToMarket(
        address borrowedToken,
        address collateralToken,
        address newAtmAddress
    ) external onlyPauser() isInitialized() {
        require(borrowedToken.isContract(), "BORROWED_TOKEN_MUST_BE_CONTRACT");
        require(
            collateralToken == settings().ETH_ADDRESS() ||
                collateralToken.isContract(),
            "COLL_TOKEN_MUST_BE_CONTRACT"
        );
        require(
            marketToAtm[borrowedToken][collateralToken] != address(0x0),
            "ATM_TO_MARKET_NOT_EXIST"
        );
        require(
            marketToAtm[borrowedToken][collateralToken] != newAtmAddress,
            "PROVIDE_NEW_ATM_FOR_MARKET"
        );

        address oldAtm = marketToAtm[borrowedToken][collateralToken];

        marketToAtm[borrowedToken][collateralToken] = newAtmAddress;

        emit MarketToAtmUpdated(
            borrowedToken,
            collateralToken,
            oldAtm,
            newAtmAddress,
            msg.sender
        );
    }

    /**
        @notice Removes the ATM address for a given market (borrowed token and collateral token).
        @param borrowedToken borrowed token address.
        @param collateralToken collateral token address.
     */
    function removeATMToMarket(address borrowedToken, address collateralToken)
        external
        onlyPauser()
        isInitialized()
    {
        require(borrowedToken.isContract(), "BORROWED_TOKEN_MUST_BE_CONTRACT");
        require(
            collateralToken == settings().ETH_ADDRESS() ||
                collateralToken.isContract(),
            "COLL_TOKEN_MUST_BE_CONTRACT"
        );
        require(
            marketToAtm[borrowedToken][collateralToken] != address(0x0),
            "ATM_TO_MARKET_NOT_EXIST"
        );

        address oldAtmAddress = marketToAtm[borrowedToken][collateralToken];

        delete marketToAtm[borrowedToken][collateralToken];

        emit MarketToAtmRemoved(
            borrowedToken,
            collateralToken,
            oldAtmAddress,
            msg.sender
        );
    }

    /**
        @notice Gets the ATM configured for a given market (borrowed token and collateral token).
        @param borrowedToken borrowed token address.
        @param collateralToken collateral token address.
        @return the ATM address configured for a given market.
     */
    function getATMForMarket(address borrowedToken, address collateralToken)
        external
        view
        returns (address)
    {
        return marketToAtm[borrowedToken][collateralToken];
    }

    /**
        @notice Tests whether an ATM is configured for a given market (borrowed token and collateral token) or not.
        @param borrowedToken borrowed token address.
        @param collateralToken collateral token address.
        @param atmAddress ATM address to test.
        @return true if the ATM is configured for the market. Otherwise it returns false.
     */
    function isATMForMarket(
        address borrowedToken,
        address collateralToken,
        address atmAddress
    ) external view returns (bool) {
        return marketToAtm[borrowedToken][collateralToken] == atmAddress;
    }

    /**
        @notice It initializes this ATM Settings instance.
        @param settingsAddress settings address.
     */
    function initialize(address settingsAddress) external isNotInitialized() {
        _setSettings(settingsAddress);

        TInitializable._initialize();
    }

    /** Internal functions */

    /** Private functions */
}
