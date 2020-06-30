pragma solidity 0.5.17;


interface CErc20Interface {

    function balanceOf(address account) external view returns (uint256);
    function balanceOfUnderlying(address account) external view returns (uint256);

    /*** User Interface ***/

    function underlying() external view returns (address);

    function mint(uint256 mintAmount) external returns (uint256);

    function redeem(uint256 redeemTokens) external returns (uint256);

    function redeemUnderlying(uint256 redeemAmount) external returns (uint256);

    function borrow(uint256 borrowAmount) external returns (uint256);

    function repayBorrow(uint256 repayAmount) external returns (uint256);

    function repayBorrowBehalf(address borrower, uint256 repayAmount)
        external
        returns (uint256);
    
    function exchangeRateCurrent() external view returns (uint256);

    function decimals() external view returns (uint8);

    // function liquidateBorrow(address borrower, uint repayAmount, CTokenInterface cTokenCollateral) external returns (uint);

    /*** Admin Functions ***/

    function _addReserves(uint256 addAmount) external returns (uint256);
}
