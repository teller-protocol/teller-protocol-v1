const assert = require("assert");
const { toBytes32 } = require("../../../test/utils/consts");

const updatePlatformSettings = async ({ settings }, { txConfig, testContext }, { settingName, newValue }) => {
  const { web3, timer } =  testContext;
  console.log(`Updating platform setting ${settingName} with the new value: ${newValue}`);
  const settingNameBytes32 = toBytes32(web3, settingName);

  const updateResult = await settings.updatePlatformSettingWithTimelock(settingNameBytes32, newValue, txConfig);
  const setting = await settings.getPlatformSetting(settingNameBytes32);
  await timer.advanceBlockAtTime(setting.timelock.lockedUntil);
  const applyResult = await settings.applyPlatformSettingTimelock(settingNameBytes32, txConfig);

    //TODO Add assertions
  const updatedSettingResult = await settings.getPlatformSetting(settingNameBytes32);
  return updatedSettingResult;
}

const getPlatformSettings = async ({ settings }, { testContext }, { settingName }) => {
  const { web3 } =  testContext;
  console.log(`Getting the platform setting for ${settingName}...`);
  const settingNameBytes32 = toBytes32(web3, settingName);
  const platformSettingResult = await settings.getPlatformSetting(settingNameBytes32);
  return platformSettingResult;
}

module.exports = {
  updatePlatformSettings,
  getPlatformSettings,
};
