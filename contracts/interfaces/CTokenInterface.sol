pragma solidity 0.5.17;


interface CTokenInterface {

    function mint(uint256 amount) external returns (uint256);

    function redeemUnderlying(uint256 amount) external returns (uint256);

}
