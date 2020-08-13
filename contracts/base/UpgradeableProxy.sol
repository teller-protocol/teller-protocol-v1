import "@openzeppelin/upgrades/contracts/upgradeability/AdminUpgradeabilityProxy.sol";

contract UpgradeableProxy is AdminUpgradeabilityProxy {
    modifier ifAdmin() {
        require(msg.sender == _admin(), 'UPGRADABLE_CALLER_MUST_BE_ADMIN');
        _;
    }

    constructor(address _logic, address _admin, bytes memory _data) AdminUpgradeabilityProxy(_logic, _admin, _data) public payable {
    }

    function _willFallback() internal {
    }
}