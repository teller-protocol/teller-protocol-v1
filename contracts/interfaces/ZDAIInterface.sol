pragma solidity 0.5.17;

import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";


/**
    Note: since interfaces cannot be inherited by other interfaces, this ZDAIInterface is defined as contract.
    See details at: https://github.com/ethereum/solidity/issues/3419#issuecomment-429988401
 */
contract ZDAIInterface is IERC20 {
    function burn(uint256 amount) external;

    function burnFrom(address account, uint256 amount) external;

    function mint(address account, uint256 amount) external returns (bool);
}
