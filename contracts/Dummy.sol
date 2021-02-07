pragma solidity 0.5.17;

contract Dummy {
    uint256 public dummyValue = 123;

    function setDummyValue(uint256 newValue) external {
        dummyValue = newValue;
    }
}
