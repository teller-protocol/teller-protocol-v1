pragma solidity 0.5.17;
pragma experimental ABIEncoderV2;

import "../util/Mock.sol";
import "../../util/SettingsConsts.sol";

contract SettingsMock is Mock {
    SettingsConsts public consts;

    constructor() public Mock() {
        consts = new SettingsConsts();
    }
}
