pragma solidity 0.5.17;

import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/IERC20.sol";

/**
 * @notice And interface to add token details to the ERC20 interface
 * @dev Note: since interfaces cannot be inherited by other interfaces, this IERC20Detailed is defined as contract.
 * See details at: https://github.com/ethereum/solidity/issues/3419#issuecomment-429988401
 *
 * @author develop@teller.finance
 */
contract IERC20Detailed is IERC20 {
    /**
     * @notice function to fetch the number of decimal places a token has
     * @return the number of decimals
     */
    function decimals() external view returns (uint8);
}
