pragma solidity 0.5.17;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";


/**
    @notice This contract represents an ERC20 token. It uses the interface IERC20 (from OpenZeppelin).
    @dev The purpose is to centralize all the common functions for a token including name, symbol and decimals.
    @dev It is used in the ERC20Lib (library).

    @author develop@teller.finance
 */
contract ERC20 is IERC20 {
    /**
     * @dev Returns the name of the token.
     */
    function name() public view returns (string memory);

    /**
     * @dev Returns the symbol of the token, usually a shorter version of the
     * name.
     */
    function symbol() public view returns (string memory);

    /**
     * @dev Returns the number of decimals used to get its user representation.
     * For example, if `decimals` equals `2`, a balance of `505` tokens should
     * be displayed to a user as `5,05` (`505 / 10 ** 2`).
     *
     * Tokens usually opt for a value of 18, imitating the relationship between
     * Ether and Wei.
     *
     * NOTE: This information is only used for _display_ purposes: it in
     * no way affects any of the arithmetic of the contract, including
     * {IERC20-balanceOf} and {IERC20-transfer}.
     */
    function decimals() public view returns (uint8);
}
