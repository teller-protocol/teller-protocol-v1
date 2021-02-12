const _ = require('lodash');
const assert = require('assert');
const { toBytes32 } = require('../../../test/utils/consts');
const settingsNames = require('../../../test/utils/platformSettingsNames');
const BigNumber = require('bignumber.js');

const validatePlatformSetting = async (settingsInstance, web3, platformSettingName, { min, max, value, processOnDeployment }) => {
    const platformSettingResult = await settingsInstance.getPlatformSetting(toBytes32(web3, platformSettingName));
    assert.equal(platformSettingResult.exists.toString(), 'true', `Platform setting ${platformSettingName} must exist.`);
    if(value !== undefined) {
        assert.equal(platformSettingResult.value.toString(), value.toString(), `Platform setting ${platformSettingName} value must equal to ${value.toString()} (Current: ${platformSettingResult.value.toString()}).`);
    }
    assert.equal(platformSettingResult.min.toString(), min.toString(), `Platform setting ${platformSettingName} min must equal to ${min.toString()} (Current: ${platformSettingResult.min.toString()}).`);
    assert.equal(platformSettingResult.max.toString(), max.toString(), `Platform setting ${platformSettingName} max must equal to ${min.toString()} (Current: ${platformSettingResult.max.toString()}).`);
    assert.equal(processOnDeployment.toString(), 'false', `Platform setting ${platformSettingName} processOnDeployment must be false.`);
};

const configureStartingBlockNumber = async (settingsName, settingsInstance, { platformSettings, currentBlockNumber, web3, txConfig, verbose}) => {
    const offsetBlockNumberSetting = platformSettings[settingsNames.StartingBlockOffsetNumber];
    assert(!_.isUndefined(offsetBlockNumberSetting.value), `StartingBlockOffsetNumber value must be defined.`);

    const settingValueConfig = platformSettings[settingsName];
    assert(!_.isUndefined(settingValueConfig), `Settings value for ${settingsName} must be provided.`);

    const { value, min, max, processOnDeployment } = settingValueConfig;
    assert(_.isUndefined(value), `Platform setting value for ${settingsName} must be undefined (it is calculated).`);
    assert(!_.isUndefined(min), `Platform setting min value for ${settingsName} must be provided.`);
    assert(!_.isUndefined(max), `Platform setting max value for ${settingsName} must be provided.`);
    assert(!processOnDeployment, `Platform setting 'processOnDeployment' for ${settingsName} must be provided and 'false'.`);

    const startingBlockNumber = BigNumber(currentBlockNumber.toString()).minus(offsetBlockNumberSetting.value);
    const startingBlockNumberValue = startingBlockNumber.lte(0) ? '0' : startingBlockNumber.toFixed(0);

    if (verbose) console.log(`Configuring platform setting ${settingsName}. Value: ${startingBlockNumberValue} (Current Block: ${currentBlockNumber} - Offset: ${offsetBlockNumberSetting.value}) - min: ${min} - max: ${max}`);

    await settingsInstance.createPlatformSetting(
        toBytes32(web3, settingsName),
        startingBlockNumberValue,
        min,
        max,
        txConfig,
    );
};

module.exports = async function(
    settingsInstance,
    { platformSettings, currentBlockNumber, web3, txConfig, verbose = true },
    { },
) {
    if (verbose) console.log('Configuring platform settings.')
    for (const platformSettingName of Object.keys(platformSettings)) {
        const { value, min, max, processOnDeployment } = platformSettings[platformSettingName];
        assert(!_.isUndefined(min), `Platform setting min value for ${platformSettingName} must be provided.`);
        assert(!_.isUndefined(max), `Platform setting max value for ${platformSettingName} must be provided.`);
        assert(!_.isUndefined(processOnDeployment), `Platform setting 'processOnDeployment' for ${platformSettingName} must be provided.`);

        if(!processOnDeployment) {
            if (verbose) console.log(`Platform setting value ${platformSettingName} is not processed. It will be configured manually.`);
            continue;
        }
        assert(!_.isUndefined(value), `Platform setting for ${platformSettingName} must be provided.`);
        if (verbose) console.log(`Configuring platform setting ${platformSettingName}. Value: ${value} - min: ${min} - max: ${max}`);

        await settingsInstance.createPlatformSetting(
            toBytes32(web3, platformSettingName),
            value,
            min,
            max,
            txConfig,
        );
    }

    // Configuring StartingBlockNumber manually due to it is based on the current block number.
    // await configureStartingBlockNumber(
    //     settingsNames.StartingBlockNumber,
    //     settingsInstance,
    //     {platformSettings, currentBlockNumber, web3, txConfig, verbose}
    // );

    // Validating all the platform settings are configured.
    for (const platformSettingName of Object.keys(platformSettings)) {
        const { value, min, max, processOnDeployment } = platformSettings[platformSettingName];

        if(!processOnDeployment) {
            // Some setting are created manually.
            continue;
        }

        const platformSettingResult = await settingsInstance.getPlatformSetting(toBytes32(web3, platformSettingName));

        assert.equal(platformSettingResult.exists.toString(), 'true', `Platform setting ${platformSettingName} must exist.`);
        assert.equal(platformSettingResult.value.toString(), value.toString(), `Platform setting ${platformSettingName} value must equal to ${value.toString()} (Current: ${platformSettingResult.value.toString()}).`);
        assert.equal(platformSettingResult.min.toString(), min.toString(), `Platform setting ${platformSettingName} min must equal to ${min.toString()} (Current: ${platformSettingResult.min.toString()}).`);
        assert.equal(platformSettingResult.max.toString(), max.toString(), `Platform setting ${platformSettingName} max must equal to ${min.toString()} (Current: ${platformSettingResult.max.toString()}).`);
    }

    // await validatePlatformSetting(
    //     settingsInstance,
    //     web3,
    //     settingsNames.StartingBlockNumber,
    //     {
    //         ...platformSettings[settingsNames.StartingBlockNumber],
    //         // As the value for StartingBlockNumber value is calculated, we only validate it exists.
    //         value: undefined,
    //     },
    // );

}
