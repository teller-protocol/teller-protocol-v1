pragma solidity 0.5.17;
pragma experimental ABIEncoderV2;

// Libraries
import "@openzeppelin/contracts/utils/Address.sol";

// Contracts
import "../base/Base.sol";

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
contract ATMSettings is IATMSettings, Base {
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
    mapping(address => mapping(address => address)) internal marketToAtm;

    /* Constructor */

    /** External Functions */

    /**
        @notice It pauses a given ATM.
        @param atmAddress ATM address to pause.
     */
    function pauseATM(address atmAddress)
        external
        onlyPauser()
        isInitialized()
    {
        require(!settings.isPaused(), "PLATFORM_IS_ALREADY_PAUSED");
        require(!atmPaused[atmAddress], "ATM_IS_ALREADY_PAUSED");

        atmPaused[atmAddress] = true;

        emit ATMPaused(atmAddress, msg.sender);
    }

    /**
        @notice It unpauses a given ATM.
        @param atmAddress ATM address to unpause.
     */
    function unpauseATM(address atmAddress)
        external
        onlyPauser()
        isInitialized()
    {
        require(!settings.isPaused(), "PLATFORM_IS_PAUSED");
        require(atmPaused[atmAddress], "ATM_IS_NOT_PAUSED");

        atmPaused[atmAddress] = false;

        emit ATMUnpaused(msg.sender, atmAddress);
    }

    /**
        @notice Gets whether an ATM is paused (or the platform is paused) or not.
        @param atmAddress ATM address to test.
        @return true if ATM is paused. Otherwise it returns false.
     */
    function isATMPaused(address atmAddress) external view returns (bool) {
        return settings.isPaused() || atmPaused[atmAddress];
    }

    /**
        @notice Sets an ATM for a given market (borrowed token and collateral token).
        @param lendingToken borrowed token address.
        @param collateralToken collateral token address.
        @param atmAddress ATM address to set.
     */
    function setATMToMarket(
        address lendingToken,
        address collateralToken,
        address atmAddress
    ) external onlyPauser() isInitialized() {
        require(atmAddress.isContract(), "ATM_GOV_MUST_BE_CONTRACT");
        require(lendingToken.isContract(), "BORROWED_TOKEN_MUST_BE_CONTRACT");
        require(
            collateralToken == settings.ETH_ADDRESS() ||
                collateralToken.isContract(),
            "COLL_TOKEN_MUST_BE_CONTRACT"
        );
        require(
            marketToAtm[lendingToken][collateralToken] == address(0x0),
            "ATM_TO_MARKET_ALREADY_EXIST"
        );

        marketToAtm[lendingToken][collateralToken] = atmAddress;

        emit MarketToAtmSet(
            lendingToken,
            collateralToken,
            atmAddress,
            msg.sender
        );
    }

    /**
        @notice Updates a new ATM for a given market (borrowed token and collateral token).
        @param lendingToken borrowed token address.
        @param collateralToken collateral token address.
        @param newAtmAddress the new ATM address to update.
     */
    function updateATMToMarket(
        address lendingToken,
        address collateralToken,
        address newAtmAddress
    ) external onlyPauser() isInitialized() {
        require(lendingToken.isContract(), "BORROWED_TOKEN_MUST_BE_CONTRACT");
        require(
            collateralToken == settings.ETH_ADDRESS() ||
                collateralToken.isContract(),
            "COLL_TOKEN_MUST_BE_CONTRACT"
        );
        require(
            marketToAtm[lendingToken][collateralToken] != address(0x0),
            "ATM_TO_MARKET_NOT_EXIST"
        );
        require(
            marketToAtm[lendingToken][collateralToken] != newAtmAddress,
            "PROVIDE_NEW_ATM_FOR_MARKET"
        );

        address oldAtm = marketToAtm[lendingToken][collateralToken];

        marketToAtm[lendingToken][collateralToken] = newAtmAddress;

        emit MarketToAtmUpdated(
            lendingToken,
            collateralToken,
            oldAtm,
            newAtmAddress,
            msg.sender
        );
    }

    /**
        @notice Removes the ATM address for a given market (borrowed token and collateral token).
        @param lendingToken borrowed token address.
        @param collateralToken collateral token address.
     */
    function removeATMToMarket(address lendingToken, address collateralToken)
        external
        onlyPauser()
        isInitialized()
    {
        require(lendingToken.isContract(), "BORROWED_TOKEN_MUST_BE_CONTRACT");
        require(
            collateralToken == settings.ETH_ADDRESS() ||
                collateralToken.isContract(),
            "COLL_TOKEN_MUST_BE_CONTRACT"
        );
        require(
            marketToAtm[lendingToken][collateralToken] != address(0x0),
            "ATM_TO_MARKET_NOT_EXIST"
        );

        address oldAtmAddress = marketToAtm[lendingToken][collateralToken];

        delete marketToAtm[lendingToken][collateralToken];

        emit MarketToAtmRemoved(
            lendingToken,
            collateralToken,
            oldAtmAddress,
            msg.sender
        );
    }

    /**
        @notice Gets the ATM configured for a given market (borrowed token and collateral token).
        @param lendingToken borrowed token address.
        @param collateralToken collateral token address.
        @return the ATM address configured for a given market.
     */
    function getATMForMarket(address lendingToken, address collateralToken)
        external
        view
        returns (address)
    {
        return marketToAtm[lendingToken][collateralToken];
    }

    /**
        @notice Tests whether an ATM is configured for a given market (borrowed token and collateral token) or not.
        @param lendingToken borrowed token address.
        @param collateralToken collateral token address.
        @param atmAddress ATM address to test.
        @return true if the ATM is configured for the market. Otherwise it returns false.
     */
    function isATMForMarket(
        address lendingToken,
        address collateralToken,
        address atmAddress
    ) external view returns (bool) {
        return marketToAtm[lendingToken][collateralToken] == atmAddress;
    }

    /**
        @notice It initializes this ATM Settings instance.
        @param settingsAddress settings address.
     */
    function initialize(address settingsAddress) external isNotInitialized() {
        _initialize(settingsAddress);

        TInitializable._initialize();
    }

    /** Internal functions */

    /** Private functions */
}
