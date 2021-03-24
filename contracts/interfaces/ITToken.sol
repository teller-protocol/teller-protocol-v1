pragma solidity 0.5.17;
pragma experimental ABIEncoderV2;

// Interfaces
import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/IERC20.sol";
import "./LendingPoolInterface.sol";

/**
    @notice This contract acts as an interface for the Teller token (TToken).

    @author develop@teller.finance
 */
contract ITToken is IERC20 {
    /**
     * @notice The LendingPool linked to this Teller Token.
     */
    function lendingPool() external view returns (LendingPoolInterface);

    /**
     * @notice The token that is the underlying assets for this Teller token.
     */
    function underlying() external view returns (address);

    /**
     * @notice Increase account supply of specified token amount.
     * @param account The account to mint tokens to.
     * @param amount The amount of tokens to mint.
     * @return true if successful.
     */
    function mint(address account, uint256 amount) external returns (bool);

    /**
     * @notice Reduce account supply of specified token amount.
     * @param account The account to burn tokens from.
     * @param amount The amount of tokens to burn.
     * @return true if successful.
     */
    function burn(address account, uint256 amount) external returns (bool);

    /**
     * @param lendingPoolAddress the address of the lending pool this token is linked to. It is only used to add it as a minter.
     */
    function initialize(address lendingPoolAddress) external;
}
