// Smart contracts

// Util classes
const Accounts = require('../utils/Accounts');
const { teller, tokens, ctokens } = require('../utils/contracts');
const { settings: readParams } = require('../utils/cli-builder');
const ProcessArgs = require('../utils/ProcessArgs');
const {
  SENDER_INDEX,
  TOKEN_NAME,
  CTOKEN_NAME,
  MAX_LOAN_AMOUNT,
} = require('../utils/cli/names');
const { toDecimals } = require('../../test/utils/consts');
const { printAssetSettings } = require('../../test/utils/asset-settings-helper');
const processArgs = new ProcessArgs(readParams.createAssetSetting().argv);

module.exports = async (callback) => {
  try {
    const accounts = new Accounts(web3);
    const getContracts = processArgs.createGetContracts(artifacts);
    const appConf = processArgs.getCurrentConfig();
    const { toTxUrl } = appConf.networkConfig;
    const senderIndex = processArgs.getValue(SENDER_INDEX.name);
    const cTokenName = processArgs.getValue(CTOKEN_NAME.name);
    const maxLoanAmount = processArgs.getValue(MAX_LOAN_AMOUNT.name);
    const assetName = processArgs.getValue(TOKEN_NAME.name);

    const settings = await getContracts.getDeployed(teller.settings());
    const tokenInstance = await getContracts.getDeployed(tokens.get(assetName));
    const assetAddress = tokenInstance.address;

    const cTokenAddress = getContracts.getAddressOrEmpty(ctokens.get(cTokenName));

    const senderTxConfig = await accounts.getTxConfigAt(senderIndex);
    const decimals = await tokenInstance.decimals();
    const maxLoanAmountWithDecimals = toDecimals(maxLoanAmount, decimals);

    const result = await await settings.createAssetSettings(
      assetAddress,
      cTokenAddress,
      maxLoanAmountWithDecimals,
      senderTxConfig
    );
    console.log(toTxUrl(result));

    const updatedAssetSettingResult = await settings.getAssetSettings(assetAddress);

    console.log(`New Values:`);
    printAssetSettings(updatedAssetSettingResult, { assetName, assetAddress });

    console.log('>>>> The script finished successfully. <<<<');
    callback();
  } catch (error) {
    console.log(error);
    callback(error);
  }
};
