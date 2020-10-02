pragma solidity 0.5.17;

interface IWETH {
    function withdraw(uint256 amount) external;

    function deposit(uint256 amount) external payable;
}
