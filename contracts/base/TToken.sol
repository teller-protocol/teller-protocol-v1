pragma solidity 0.5.17;

import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/ERC20Detailed.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/ERC20Mintable.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/utils/Address.sol";
import "../interfaces/ITToken.sol";
import "../interfaces/ISettings.sol";

/**
 * @notice This contract represents a wrapped token within the Teller protocol
 *
 * @author develop@teller.finance
 */
contract TToken is ITToken, ERC20Detailed, ERC20Mintable {
    using Address for address;

    /** State Variables */

    ISettings private settings;

    /* Constructor */
    /**
     * @param settingsAddress the setting address.
     * @param name The name of the token
     * @param symbol The symbol of the token
     * @param decimals The amount of decimals for the token
     */
    constructor(
        address settingsAddress,
        string memory name,
        string memory symbol,
        uint8 decimals
    ) public {
        require(settingsAddress.isContract(), "SETTINGS_MUST_BE_CONTRACT");
        settings = ISettings(settingsAddress);
        ERC20Detailed.initialize(name, symbol, decimals);
        ERC20Mintable.initialize(msg.sender);
    }

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

    /** Internal Functions */

    /**
        @notice Gets the current settings contract.
        @return the setting contract instance.
     */
    function _settings() internal view returns (ISettings) {
        return settings;
    }
}
