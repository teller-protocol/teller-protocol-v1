pragma solidity 0.5.17;

interface IUniswap {

    event UniswapSwapped(
        address indexed from,
        address indexed to,
        address indexed sourceElement,
        address receivedElement,
        uint256 sourceAmount,
        uint256 receivedAmount
    );
}