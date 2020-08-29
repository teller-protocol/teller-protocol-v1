pragma solidity 0.5.17;

import "./ERC20.sol";


/**
    @notice This interface represents a Mintable ERC20 token.
    @dev It only defines the mintable functions and extends the interface IERC20 (from OpenZeppelin).

    @author develop@teller.finance
 */
contract IERC20Mintable is ERC20 {

    function mint(address account, uint256 amount) external returns (bool);

    function isMinter(address account) external view returns (bool);

    function addMinter(address account) external;

    function renounceMinter() external;
}
