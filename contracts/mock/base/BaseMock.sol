pragma solidity 0.5.17;

import "../../base/Base.sol";

contract BaseMock is Base {

    constructor(address settingsAddress)
        public
        Base(settingsAddress) { }

    function externalWhenNotPaused() external whenNotPaused(address(this)) {}

    function externalWhenNotPausedAn(address anAddress) external whenNotPaused(anAddress) {}

    function externalWhenPaused() external whenPaused(address(this)) {}

    function externalWhenPausedAn(address anAddress) external whenPaused(anAddress) {}
}