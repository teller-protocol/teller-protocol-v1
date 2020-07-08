// Smart contracts

// Util classes
const Accounts = require('../utils/Accounts');
const { zerocollateral, tokens, ctokens } = require("../utils/contracts");
const { settings: readParams } = require("../utils/cli-builder");
const ProcessArgs = require('../utils/ProcessArgs');
const { SENDER_INDEX, RATE_PROCESS_FREQUENCY, CTOKEN_NAME, MAX_LENDING_AMOUNT, TOKEN_NAME } = require('../utils/cli/names');
const { toDecimals } = require('../../test/utils/consts');
const processArgs = new ProcessArgs(readParams.updateAssetSettings().argv);

module.exports = async (callback) => {
    try {
        const accounts = new Accounts(web3);
        const getContracts = processArgs.createGetContracts(artifacts);
        const appConf = processArgs.getCurrentConfig();
        const { toTxUrl } = appConf.networkConfig;

        const settings = await getContracts.getDeployed(zerocollateral.settings());
        const senderIndex = processArgs.getValue(SENDER_INDEX.name);
        const tokenName = processArgs.getValue(TOKEN_NAME.name);
        const cTokenName = `C${tokenName}`;//processArgs.getValue(CTOKEN_NAME.name);
        const maxLendingAmount = processArgs.getValue(MAX_LENDING_AMOUNT.name);
        const rateProcessFrequency = processArgs.getValue(RATE_PROCESS_FREQUENCY.name);

        const token = await getContracts.getDeployed(tokens.get(tokenName));
        const tokenDecimals = await token.decimals();
        const maxLendingAmountWithDecimals = toDecimals(maxLendingAmount, tokenDecimals);
        const cTokenAddress = getContracts.getInfo(ctokens.get(cTokenName)).address;

        const senderTxConfig = await accounts.getTxConfigAt(senderIndex);

        const initialAssetSettings = await settings.getAssetSettings(token.address);
        console.log(`Initial Asset Settings (${tokenName}): `, initialAssetSettings);
        
        const result = await settings.updateAssetSettings(
            token.address,
            cTokenAddress,
            maxLendingAmountWithDecimals,
            rateProcessFrequency,
            senderTxConfig
        );
        console.log(toTxUrl(result));

        const finalAssetSettings = await settings.getAssetSettings(token.address);
        console.log(`Final Asset Settings (${tokenName}): `, finalAssetSettings);

        console.log('>>>> The script finished successfully. <<<<');
        callback();
    } catch (error) {
        console.log(error);
        callback(error);
    }
};