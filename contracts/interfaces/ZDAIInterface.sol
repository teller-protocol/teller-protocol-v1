pragma solidity 0.5.17;

interface ZDAIInterface {

    function burn(address account, uint256 amount) external;

    function transfer(address recipient, uint256 amount) external returns (bool);

    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);

}
