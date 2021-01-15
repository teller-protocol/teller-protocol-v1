pragma solidity 0.5.17;

// Utils
import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/ERC20Detailed.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/ERC20Mintable.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/utils/Address.sol";

// Interfaces
import "../interfaces/TTokenInterface.sol";
import "../interfaces/SettingsInterface.sol";

/**
 * @notice This contract represents a wrapped token within the Teller protocol
 *
 * @author develop@teller.finance
 */
contract TToken is TTokenInterface, ERC20Detailed, ERC20Mintable {
    using Address for address;

    /** State Variables */

    /**
        @notice The token that is the underlying assets for this Teller token.
     */
    ERC20Detailed public underlying;

    /* Constructor */
    /**
     * @param underlyingTokenAddress the token address this TToken is for.
     * @param lendingPoolAddress the address of the lending pool this token is linked to. It is only used to add it as a minter.
     */
    constructor(address underlyingTokenAddress, address lendingPoolAddress) public {
        require(underlyingTokenAddress.isContract(), "SETTINGS_MUST_BE_CONTRACT");
        underlying = ERC20Detailed(underlyingTokenAddress);

        ERC20Detailed.initialize(
            string(abi.encodePacked("Teller ", underlying.name())),
            string(abi.encodePacked("t", underlying.symbol())),
            underlying.decimals()
        );
        ERC20Mintable.initialize(lendingPoolAddress);
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
}
