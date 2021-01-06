import {withData} from "leche";
import {
  SettingsInstance,
  UpgradableV1Instance,
  SettingsConstsInstance,
} from "../../types/truffle-contracts";
import {deploySettings} from "../utils/setup/settings";
import {t} from "../utils/consts";

const Mock = artifacts.require("Mock");
const UpgradeableProxy = artifacts.require("UpgradeableProxy");
const UpgradeableV1 = artifacts.require("UpgradableV1");
const SettingsConsts = artifacts.require("SettingsConsts");

contract("SettingsTimelockTest", function (accounts) {
  const ownerIndex = 0;
  const owner = accounts[ownerIndex];
  let instance: SettingsInstance;
  let consts: SettingsConstsInstance;
  let upgradeable: UpgradableV1Instance;

  before(async () => {
    const {settings} = await deploySettings({
      network: "test",
      deployerAddress: owner,
    });
    instance = settings;
    consts = await SettingsConsts.new();
    const TIMELOCK_SETTING = await consts.TIMELOCK_SETTING();
    await instance.createPlatformSetting(TIMELOCK_SETTING, 1, 0, 100);
    const mock = await Mock.new();
    const base = await UpgradeableProxy.new();
    await base.initializeProxy(instance.address, mock.address);
    upgradeable = await UpgradeableV1.at(base.address);
  });

  it("Should set a new timelock platform setting", async () => {});

  withData<{
    timeToWait: number;
    timelockedValue: number;
    newValue: number;
    skipTimelocking: boolean;
    expectedErrorMessage?: string;
    mustFail?: boolean;
  }>(
    {
      _2_with_timelock_wait: {
        timeToWait: 2,
        timelockedValue: 3,
        newValue: 3,
        skipTimelocking: false,
      },
      _3_with_timelock_no_wait: {
        timeToWait: 0,
        timelockedValue: 2,
        newValue: 2,
        skipTimelocking: false,
        expectedErrorMessage: "MINIMUM_TIMELOCK_NOT_ELAPSED",
        mustFail: true,
      },
      _4_with_timelock_value_mismatch: {
        timeToWait: 2,
        timelockedValue: 3,
        newValue: 4,
        skipTimelocking: false,
        expectedErrorMessage: "TIMELOCK_NEWVALUE_MISMATCH",
        mustFail: true,
      },
      _5_with_timelock_skip_timelocking: {
        timeToWait: 2,
        timelockedValue: 3,
        newValue: 3,
        skipTimelocking: true,
        expectedErrorMessage: "SETTING_NOT_TIMELOCKED",
        mustFail: true,
      },
    },
    ({
      timeToWait,
      timelockedValue,
      newValue,
      skipTimelocking,
      expectedErrorMessage,
      mustFail,
    }) =>
      it(
        t(
          "pauser",
          "updatePlatformSetting",
          "Should respect the timelock setting",
          mustFail
        ),
        async () => {
          const REQUIRED_SUBMISSIONS_SETTING = await consts.REQUIRED_SUBMISSIONS_SETTING();

          if (!skipTimelocking) {
            await instance.timelockSetting(
              REQUIRED_SUBMISSIONS_SETTING,
              timelockedValue
            );
          }

          await new Promise((resolve) =>
            setTimeout(() => resolve(undefined), timeToWait * 1000)
          );

          try {
            await instance.updatePlatformSetting(
              REQUIRED_SUBMISSIONS_SETTING,
              newValue
            );
          } catch (error) {
            // Assertions
            assert(mustFail, error.message);
            assert.equal(error.reason, expectedErrorMessage, error.message);
            await instance.removeTimelock(REQUIRED_SUBMISSIONS_SETTING);
          }
        }
      )
  );
});
