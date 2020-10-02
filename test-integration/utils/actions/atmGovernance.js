const BigNumber = require("bignumber.js");
const { atmGovernance: atmGovernanceEvents } = require("../../../test/utils/events");

const addGeneralSetting = async (
  {atmGovernance},
  {txConfig, testContext},
  {settingName, settingValue}
) => {
  console.log(`Adding general setting ${settingName} with value ${settingValue}`);
  const additionResult = await atmGovernance.addGeneralSetting(
    settingName,
    settingValue,
    txConfig
  );
  atmGovernanceEvents
    .generalSettingAdded(additionResult)
    .emitted(txConfig.from, settingName, settingValue);
  return additionResult;
}

const updateGeneralSetting = async (
  {atmGovernance},
  {txConfig, testContext},
  {settingName, settingValue}
) => {
  const oldValue = await atmGovernance.getGeneralSetting(settingName);
  console.log(`Updating general setting ${settingName} from value ${oldValue} to value ${settingValue}`);
  const updateResult = await atmGovernance.updateGeneralSetting(
    settingName,
    settingValue,
    txConfig
  );
  atmGovernanceEvents
    .generalSettingUpdated(updateResult)
    .emitted(txConfig.from, settingName, oldValue, settingValue);
}

const removeGeneralSetting = async (
  {atmGovernance},
  {txConfig, testContext},
  {settingName}
) => {
  console.log(`Removing general setting ${settingName}`);
  const settingValue = await atmGovernance.getGeneralSetting(settingName);
  const removalResult = await atmGovernance.removeGeneralSetting(
    settingName,
    txConfig
  );
  atmGovernanceEvents
    .generalSettingRemoved(removalResult)
    .emitted(txConfig.from, settingName, settingValue);
}

const addAssetMarketSetting = async (
  {atmGovernance},
  {txConfig, testContext},
  {asset, settingName, settingValue}
) => {
  console.log(`Adding market setting ${settingName} for asset ${asset} with value ${settingValue}`);
  const additionResult = await atmGovernance.addAssetMarketSetting(
    asset,
    settingName,
    settingValue,
    txConfig
  );
  atmGovernanceEvents
    .addAssetMarketSettingAdded(additionResult)
    .emitted(txConfig.from, settingName, settingValue);
}

const updateAssetMarketSetting = async (
  {atmGovernance},
  {txConfig, testContext},
  {asset, settingName, settingValue}
) => {
  const oldValue = await atmGovernance.getAssetMarketSetting(
    asset,
    settingName
  );
  console.log(`Updating market setting ${settingName} for asset ${asset} from value ${oldValue} with value ${settingValue}`);
  const updateResult = await atmGovernance.updateAssetMarketSetting(
    asset,
    settingValue,
    settingValue,
    txConfig
  );
  atmGovernanceEvents
    .assetMarketSettingUpdated(updateResult)
    .emitted(txConfig.from, asset, settingName, oldValue, settingValue);
}

const removeAssetMarketSetting = async (
  {atmGovernance},
  {txConfig, testContext},
  {asset, settingName}
) => {
  console.log(`Removing market setting ${settingName} for asset ${asset}`);
  const settingValue = await atmGovernance.getAssetMarketSetting(
    asset,
    settingName
  );
  const removalResult = await atmGovernance.removeAssetMarketSetting(
    asset,
    settingName,
    txConfig
  );
  atmGovernanceEvents
    .assetMarketSettingRemoved(removalResult)
    .emitted(txConfig.from, asset, settingName, settingValue);
}

const addDataProvider = async (
  {atmGovernance},
  {txConfig, testContext},
  {dataTypeIndex, dataProvider}
) => {
  console.log(`Adding data provider ${dataProvider} with index ${dataTypeIndex}`);
  const additionResult = await atmGovernance.addDataProvider(
    dataTypeIndex,
    dataProvider,
    txConfig
  );
  const dataProviders = await atmGovernance.dataProviders();
  atmGovernanceEvents
    .dataProviderAdded(additionResult)
    .emitted(txConfig.from, dataTypeIndex, dataProviders.length, dataProvider);
}

const updateDataProvider = async (
  {atmGovernance},
  {txConfig, testContext},
  {dataTypeIndex, providerIndex, newProvider}
) => {
  const oldProvider = await atmGovernance.getDataProvider(
    dataTypeIndex,
    providerIndex
  );
  console.log(`Updating data provider ${oldProvider} at index ${providerIndex} with new provider ${newProvider}`);
  const updateResult = await atmGovernance.updateDataProvider(
    dataTypeIndex,
    providerIndex,
    newProvider,
    txConfig
  );
  atmGovernanceEvents
    .dataProviderUpdated(updateResult)
    .emitted(txConfig.from, dataTypeIndex, providerIndex, oldProvider);
}

const removeDataProvider = async (
  {atmGovernance},
  {txConfig, testContext},
  {dataTypeIndex, dataProviderIndex}
) => {
  const dataProvider = await atmGovernance.getDataProvider(
    dataTypeIndex,
    dataProviderIndex
  );
  console.log(`Removing data provider ${dataProvider} at index ${dataProviderIndex}`);
  const removalResult = await atmGovernance.removeDataProvider(
    dataTypeIndex,
    dataProviderIndex,
    txConfig
  );
  atmGovernanceEvents
    .dataProviderRemoved(removalResult)
    .emitted(txConfig.from, dataTypeIndex, dataProviderIndex, dataProvider);
}

const setCRA = async (
  {atmGovernance},
  {txConfig, testContext},
  {_cra}
) => {
  console.log(`Setting CRA to commit hash ${_cra}`);
  const result = await atmGovernance.setCRA(_cra);
  atmGovernanceEvents
    .CRASet(result)
    .emitted(txConfig.from, _cra);
}

module.export = {
  addGeneralSetting,
  updateGeneralSetting,
  removeGeneralSetting,
  addAssetMarketSetting,
  updateAssetMarketSetting,
  removeAssetMarketSetting,
  addDataProvider,
  updateDataProvider,
  removeDataProvider,
  setCRA
}