pragma solidity 0.5.17;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import "./IDApp.sol";

import "../../../providers/compound/CErc20Interface.sol";

import "../../../util/AddressLib.sol";


contract Compound is IDApp {
    using AddressLib for address;

    function balance(address cTokenAddress) public view returns (uint256) {
        return CErc20Interface(cTokenAddress).balanceOf(address(this));
    }

    function lend(address cTokenAddress, uint256 amount) internal {
        CErc20Interface cToken = CErc20Interface(cTokenAddress);

        IERC20 underlying = IERC20(cToken.underlying());
        require(
            underlying.balanceOf(address(this)) >= amount,
            "COMPOUND_INSUFFICIENT_UNDERLYING"
        );
        underlying.approve(cTokenAddress, amount);

        uint256 result = cToken.mint(amount);
        require(result == 0, "COMPOUND_DEPOSIT_ERROR");

        emit DappAction("Compound", "lend");
    }

    function redeem(address cTokenAddress) internal {
        uint256 amount = balance(cTokenAddress);
        redeem(cTokenAddress, amount);
    }

    function redeem(address cTokenAddress, uint256 amount) internal {
        require(balance(cTokenAddress) >= amount, "COMPOUND_INSUFFICIENT_BALANCE");

        uint256 result = CErc20Interface(cTokenAddress).redeemUnderlying(amount);
        require(result == 0, "COMPOUND_WITHDRAWAL_ERROR");

        emit DappAction("Compound", "redeem");
    }
}
