pragma solidity 0.5.17;

import "./IERC20Detailed.sol";

/**
 * @notice This contract represents a wrapped token within the Teller protocol
 * @dev Note: since interfaces cannot be inherited by other interfaces, this TTokenInterface is defined as contract.
 * See details at: https://github.com/ethereum/solidity/issues/3419#issuecomment-429988401
 *
 * @author develop@teller.finance
 */
contract TTokenInterface is IERC20Detailed {
    /**
     * @notice Reduce account supply of specified token amount
     * @param account The account to burn tokens from
     * @param amount The amount of tokens to burn
     * @return true if successful
     */
    function burn(address account, uint256 amount) external returns (bool);

    /**
     * @notice Increase account supply of specified token amount
     * @param account The account to mint tokens for
     * @param amount The amount of tokens to mint
     * @return true if successful
     */
    function mint(address account, uint256 amount) external returns (bool);
}
