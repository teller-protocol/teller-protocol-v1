// Util classes
const { teller } = require("../../scripts/utils/contracts");
const platformSettingsNames = require("../../test/utils/platformSettingsNames");
const { toBytes32 } = require("../../test/utils/consts");

module.exports = async (initConfig, { accounts, getContracts, web3 }) => {
  console.log('Updating platform settings...');
  const txConfig = await accounts.getTxConfigAt(0);
  const settings = await getContracts.getDeployed(teller.settings());
  const {
    requiredSubmissionsPercentage,
    safetyInterval,
  } = initConfig;
  const requiredSubmissionsPercentageBytes32 = toBytes32(web3, platformSettingsNames.RequiredSubmissionsPercentage);
  const currentRequiredSubmissionsPercentage = await settings.getPlatformSettingValue(requiredSubmissionsPercentageBytes32, txConfig);
  if (requiredSubmissionsPercentage !== parseInt(currentRequiredSubmissionsPercentage)) {
    await settings.updatePlatformSetting(requiredSubmissionsPercentageBytes32, requiredSubmissionsPercentage, txConfig);
  }
  const updatedRequiredSubmissionsPercentage = await settings.getPlatformSettingValue(requiredSubmissionsPercentageBytes32, txConfig);
  console.log(`Settings >> New Required Submissions:   ${updatedRequiredSubmissionsPercentage.toString()}`);

  const safetyIntervalBytes32 = toBytes32(web3, platformSettingsNames.SafetyInterval);
  const currentSafetyInterval = await settings.getPlatformSettingValue(safetyIntervalBytes32, txConfig);
  if (safetyInterval !== parseInt(currentSafetyInterval)) {
    await settings.updatePlatformSetting(safetyIntervalBytes32, safetyInterval, txConfig);
  }
  const updatedSafetyInterval = await settings.getPlatformSettingValue(safetyIntervalBytes32, txConfig);
  console.log(`Settings >> New Safety Interval:   ${updatedSafetyInterval.toString()}`);
};
