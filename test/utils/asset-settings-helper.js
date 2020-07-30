
const createAssetSettings = async (MockReference, instance, sender, previousAssetsInfo) => {
    const assetsInfo = [];
    for (const previousAssetInfo of previousAssetsInfo) {
        const previousAsset = await MockReference.new();
        const previousCToken = await MockReference.new();
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
};