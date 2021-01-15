pragma solidity 0.5.17;

// Utils
import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/ERC20Detailed.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/ERC20Mintable.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/utils/Address.sol";

// Interfaces
import "../interfaces/TTokenInterface.sol";
import "../interfaces/SettingsInterface.sol";
import "../interfaces/LendingPoolInterface.sol";

// Contracts
import "./BaseUpgradeable.sol";

/**
 * @notice This contract represents a wrapped token within the Teller protocol
 *
 * @author develop@teller.finance
 */
contract TToken is TTokenInterface, BaseUpgradeable, ERC20Detailed, ERC20Mintable {
    using Address for address;

    /** State Variables */

    /**
        @notice The token that is the underlying assets for this Teller token.
     */
    ERC20Detailed public underlying;

    /**
        @notice The LendingPool linked to this Teller Token.
     */
    LendingPoolInterface public lendingPool;


    /* Public Functions */
    /**
     * @notice Reduce account supply of specified token amount
     * @param account The account to burn tokens from
     * @param amount The amount of tokens to burn
     * @return true if successful
     */
    function burn(address account, uint256 amount) public onlyMinter returns (bool) {
        _burn(account, amount);
        return true;
    }

    /**
     * @param underlyingTokenAddress the token address this TToken is for.
     * @param lendingPoolAddress the address of the lending pool this token is linked to. It is only used to add it as a minter.
     * @param settingsAddress the settings address.
     */
    function initialize(
        address underlyingTokenAddress,
        address lendingPoolAddress,
        address settingsAddress
    )
        public
        initializer
    {
        require(settingsAddress.isContract(), "SETTINGS_MUST_BE_A_CONTRACT");
        require(underlyingTokenAddress.isContract(), "UNDERLYING_MUST_BE_CONTRACT");
        require(lendingPoolAddress.isContract(), "LP_MUST_BE_CONTRACT");

        underlying = ERC20Detailed(underlyingTokenAddress);
        lendingPool = LendingPoolInterface(lendingPoolAddress);
        _setSettings(settingsAddress);

        ERC20Detailed.initialize(
            string(abi.encodePacked("Teller ", underlying.name())),
            string(abi.encodePacked("t", underlying.symbol())),
            underlying.decimals()
        );
        ERC20Mintable.initialize(lendingPoolAddress);
    }
}
