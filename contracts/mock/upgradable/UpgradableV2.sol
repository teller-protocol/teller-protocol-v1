import "./UpgradableV1.sol";

contract UpgradableV2 is UpgradableV1 {
    function setValue(uint256 newValue) external {
        value = newValue;
    }
}