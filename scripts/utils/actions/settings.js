const assert = require("assert");
const { toBytes32 } = require("../../../test/utils/consts");

const updatePlatformSettings = async ({ settings }, { txConfig, testContext }, { settingName, newValue}) => {
  const { web3 } =  testContext;
  console.log(`Updating platform setting ${settingName} with the new value: ${newValue}`);
  const settingNameBytes32 = toBytes32(web3, settingName);

  const result = await settings.updatePlatformSetting(settingNameBytes32, newValue, txConfig);
    //TODO Add assertions
  const updatedSettingResult = await settings.getPlatformSetting(settingNameBytes32);
  return updatedSettingResult;
}

const getPlatformSettings = async ({ settings }, { testContext }, { settingName}) => {
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
