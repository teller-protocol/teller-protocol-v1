pragma solidity 0.5.17;
pragma experimental ABIEncoderV2;

// Libraries

// Commons

// Interfaces
import "../interfaces/SettingsInterface.sol";
import "../atm/IATMFactory.sol";
import "./IATMSettings.sol";


/**
    @notice It manages the settings for the ATMs.

    @author develop@teller.finance
 */
contract ATMSettings is IATMSettings {
    using Address for address;
    /** Constants */

    address internal constant ETH_ADDRESS = 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;

    /* State Variables */

    SettingsInterface public settings;

    IATMFactory public atmFactory;

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

    /** Modifiers */

    /**
        @notice It checks whether sender address has the pauser role or not.
        @dev It throws a require error if sender hasn't the pauser role.
     */
    modifier withPauserRole() {
        require(settings.hasPauserRole(msg.sender), "SENDER_HASNT_PAUSER_ROLE");
        _;
    }

    /**
        @notice It checks whether an address is a valid ATM address or not.
        @dev It throws a require error if the address is not a valid ATM address.
        @param anAddress address to test.
     */
    modifier withValidATM(address anAddress) {
        require(atmFactory.isATM(anAddress) == true, "ADDRESS_ISNT_ATM");
        _;
    }

    /* Constructor */

    constructor(address atmFactoryAddress, address settingsAddress) public {
        require(atmFactoryAddress != address(0x0), "ATM_GOV_FACTORY_MUST_BE_PROVIDED");
        require(settingsAddress != address(0x0), "SETTINGS_MUST_BE_PROVIDED");

        atmFactory = IATMFactory(atmFactoryAddress);
        settings = SettingsInterface(settingsAddress);
    }

    /** External Functions */

    /**
        @notice It pauses a given ATM.
        @param atmAddress ATM address to pause.
     */
    function pauseATM(address atmAddress)
        external
        withPauserRole()
        withValidATM(atmAddress)
    {
        require(settings.isPaused() == false, "PLATFORM_IS_ALREADY_PAUSED");
        require(atmPaused[atmAddress] == false, "ATM_IS_ALREADY_PAUSED");

        atmPaused[atmAddress] = true;

        emit ATMPaused(atmAddress, msg.sender);
    }

    /**
        @notice It unpauses a given ATM.
        @param atmAddress ATM address to unpause.
     */
    function unpauseATM(address atmAddress)
        external
        withPauserRole()
        withValidATM(atmAddress)
    {
        require(settings.isPaused() == false, "PLATFORM_IS_PAUSED");
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
        return settings.isPaused() || atmPaused[atmAddress];
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
    ) external withPauserRole() withValidATM(atmAddress) {
        require(borrowedToken.isContract() == true, "BORROWED_TOKEN_MUST_BE_CONTRACT");
        require(
            collateralToken == ETH_ADDRESS || collateralToken.isContract() == true,
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
    ) external withPauserRole() withValidATM(newAtmAddress) {
        require(borrowedToken.isContract() == true, "BORROWED_TOKEN_MUST_BE_CONTRACT");
        require(
            collateralToken == ETH_ADDRESS || collateralToken.isContract() == true,
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
        withPauserRole()
    {
        require(borrowedToken.isContract() == true, "BORROWED_TOKEN_MUST_BE_CONTRACT");
        require(
            collateralToken == ETH_ADDRESS || collateralToken.isContract() == true,
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

    /** Internal functions */

    /** Private functions */
}
