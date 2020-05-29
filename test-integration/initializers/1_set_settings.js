// Util classes
const { zerocollateral } = require("../../scripts/utils/contracts");

module.exports = async (initConfig, { accounts, getContracts }) => {
  console.log('Updating platform settings...');
  const txConfig = await accounts.getTxConfigAt(0);
  const settings = await getContracts.getDeployed(zerocollateral.settings());
  const {
    requiredSubmissions,
    safetyInterval,
  } = initConfig;
  
  const currentRequiredSubmissions = await settings.requiredSubmissions(txConfig);
  if (requiredSubmissions !== parseInt(currentRequiredSubmissions)) {
    await settings.setRequiredSubmissions(requiredSubmissions.toString(), txConfig);
  }
  const updatedRequiredSubmissions = await settings.requiredSubmissions(txConfig);
  console.log(`Settings >> New Required Submissions:   ${updatedRequiredSubmissions.toString()}`);

  const currentSafetyInterval = await settings.safetyInterval(txConfig);
  if (safetyInterval !== parseInt(currentSafetyInterval)) {
    await settings.setSafetyInterval(safetyInterval.toString(), txConfig);
  }
  const updatedSafetyInterval = await settings.safetyInterval(txConfig);
  console.log(`Settings >> New Safety Interval:   ${updatedSafetyInterval.toString()}`);
};
