pragma solidity 0.5.17;

interface IATMGovernanceMockV2 {
    /* Events */

    /* External Functions */

    function addNewMapping(address key, uint256 value)
        external;

    function setNewValue(string calldata aNewValue)
        external;

    function getNewValue() external view returns (string memory);
}
