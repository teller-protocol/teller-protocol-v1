import "../../base/TInitializable.sol";

contract UpgradableV1 is TInitializable {
    uint256 public value;

    function initialize(uint256 initValue) external isNotInitialized {
        _initialize();

        value = initValue;
    }
}