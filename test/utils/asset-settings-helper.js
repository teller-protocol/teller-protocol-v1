const { encode } = require('../utils/consts');

const createAssetSettings = async (MockReference, instance, sender, previousAssetsInfo) => {
    const assetsInfo = [];
    for (const previousAssetInfo of previousAssetsInfo) {
        const previousAsset = await MockReference.new();
        const previousCToken = await MockReference.new();

        await previousCToken.givenMethodReturnAddress(
            encode(web3, 'underlying()'),
            previousAsset.address
        )

        await instance.createAssetSettings(
            previousAsset.address,
            previousCToken.address,
            previousAssetInfo.maxLoanAmount,
            {
                from: sender
            }
        );
        assetsInfo.push({
            ...previousAssetInfo,
            assetAddress: previousAsset.address,
            cTokenAddress: previousCToken.address,
        });
    }
    return assetsInfo;
}

module.exports = {
    createAssetSettings,
    printAssetSettings: ({cTokenAddress, maxLoanAmount}, {assetName, assetAddress, assetSettingName, assetSettingNameBytes32}) => {
        console.log(`Asset Setting Name: ${assetSettingName} / ${assetSettingNameBytes32}`);
        console.log(`Asset Name / Address:      ${assetName} / ${assetAddress}`);
        console.log(`cToken Address:            ${cTokenAddress}`);
        console.log(`Max Loan Amount:           ${maxLoanAmount}`);
    },
};