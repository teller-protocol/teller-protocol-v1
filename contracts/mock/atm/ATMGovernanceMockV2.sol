pragma solidity 0.5.17;

// Interfaces
import "../../atm/ATMGovernance.sol";

contract ATMGovernanceMockV2 is ATMGovernance {
    
    /* Constants */

    /* State Variables */

    mapping(address => uint256) public newMapping;

    // Unique CRA - Credit Risk Algorithm github hash to use in this ATM
    string public newValue;

    /* External Functions */

    function addNewMapping(address key, uint256 value)
        external
    {
        newMapping[key] = value;
    }

    function setNewValue(string calldata aNewValue)
        external
    {
        newValue = aNewValue;
    }

    function getNewValue() external view returns (string memory) {
        return newValue;
    }
}
