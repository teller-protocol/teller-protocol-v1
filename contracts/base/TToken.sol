pragma solidity 0.5.17;

// Utils
import "@openzeppelin/contracts-ethereum-package/contracts/utils/Address.sol";

// Interfaces
import "../interfaces/ITToken.sol";
import "../interfaces/LendingPoolInterface.sol";

// Contracts
import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/ERC20Mintable.sol";
import "./upgradeable/DynamicUpgradeable.sol";

/**
 * @notice This contract represents a wrapped token within the Teller protocol
 *
 * @author develop@teller.finance
 */
contract TToken is ITToken, ERC20Mintable, DynamicUpgradeable {
    using Address for address;

    /** State Variables */

    string public name;
    string public symbol;
    uint8 public decimals;

    /**
     * @notice The LendingPool linked to this Teller Token.
     */
    LendingPoolInterface public lendingPool;

    /* Public Functions */

    /**
     * @notice The token that is the underlying assets for this Teller token.
     */
    function underlying() public view returns (address) {
        return address(lendingPool.lendingToken());
    }

    /**
     * @notice Reduce account supply of specified token amount
     * @param account The account to burn tokens from
     * @param amount The amount of tokens to burn
     * @return true if successful
     */
    function burn(address account, uint256 amount)
        public
        onlyMinter
        returns (bool)
    {
        _burn(account, amount);
        return true;
    }

    /**
     * @param lendingPoolAddress the address of the lending pool this token is linked to. It is only used to add it as a minter.
     */
    function initialize(address lendingPoolAddress) public {
        require(lendingPoolAddress.isContract(), "LP_MUST_BE_CONTRACT");
        lendingPool = LendingPoolInterface(lendingPoolAddress);

        _addMinter(lendingPoolAddress);

        ERC20Detailed lendingToken = ERC20Detailed(lendingPool.lendingToken());
        name = string(abi.encodePacked("Teller ", lendingToken.name()));
        symbol = string(abi.encodePacked("t", lendingToken.symbol()));
        decimals = lendingToken.decimals();
    }
}
