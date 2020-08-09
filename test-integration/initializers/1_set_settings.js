// Util classes
const { zerocollateral } = require("../../scripts/utils/contracts");
const platformSettingsNames = require("../../test/utils/platformSettingsNames");
const { toBytes32 } = require("../../test/utils/consts");

module.exports = async (initConfig, { accounts, getContracts, web3 }) => {
  console.log('Updating platform settings...');
  const txConfig = await accounts.getTxConfigAt(0);
  const settings = await getContracts.getDeployed(zerocollateral.settings());
  const {
    requiredSubmissions,
    safetyInterval,
  } = initConfig;
  const requiredSubmissionsBytes32 = toBytes32(web3, platformSettingsNames.RequiredSubmissions);
  const currentRequiredSubmissions = await settings.getPlatformSettingValue(requiredSubmissionsBytes32, txConfig);
  if (requiredSubmissions !== parseInt(currentRequiredSubmissions)) {
    await settings.updatePlatformSetting(requiredSubmissionsBytes32, requiredSubmissions, txConfig);
  }
  const updatedRequiredSubmissions = await settings.getPlatformSettingValue(requiredSubmissionsBytes32, txConfig);
  console.log(`Settings >> New Required Submissions:   ${updatedRequiredSubmissions.toString()}`);

  const safetyIntervalBytes32 = toBytes32(web3, platformSettingsNames.SafetyInterval);
  const currentSafetyInterval = await settings.getPlatformSettingValue(safetyIntervalBytes32, txConfig);
  if (safetyInterval !== parseInt(currentSafetyInterval)) {
    await settings.updatePlatformSetting(safetyIntervalBytes32, safetyInterval, txConfig);
  }
  const updatedSafetyInterval = await settings.getPlatformSettingValue(safetyIntervalBytes32, txConfig);
  console.log(`Settings >> New Safety Interval:   ${updatedSafetyInterval.toString()}`);
};
