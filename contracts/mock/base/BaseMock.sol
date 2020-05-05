pragma solidity 0.5.17;

import "../../base/Base.sol";

contract BaseMock is Base {

    function externalWhenNotPaused() external whenNotPaused() {}

    function externalWhenLendingPoolNotPaused() external whenLendingPoolNotPaused() {}

    function externalWhenPaused() external whenPaused() {}

    function externalWhenLendingPoolPaused() external whenLendingPoolPaused() {}

    function externalInitialize(address settingsAddress) external {
        super.initialize(settingsAddress);
    }
}