pragma solidity 0.5.17;

import "../../base/Base.sol";


contract BaseMock is Base {
    function externalWhenNotPaused() external whenNotPaused() {}

    function externalWhenLendingPoolNotPaused(address lendingPoolAddress)
        external
        whenLendingPoolNotPaused(lendingPoolAddress)
    {}

    function externalWhenPaused() external whenPaused() {}

    function externalWhenLendingPoolPaused(address lendingPoolAddress)
        external
        whenLendingPoolPaused(lendingPoolAddress)
    {}

    function externalInitialize(address settingsAddress)
        external
    {
        super._initialize(settingsAddress);
    }
}
