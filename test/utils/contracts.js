const { sum } = require('./consts');

module.exports = {
    mockLenderInfo: async (instance, lenderData, currentBlockNumber) => {
        await instance.mockLenderInfo(
            lenderData.address,
            sum(currentBlockNumber, lenderData.plusLastAccruedBlockNumber),
            lenderData.lastAccruedInterest
        );
    },
    initContracts: async (daiPool, zdai, dai, loans, LenderInfo) => {
        const lenderInfo = await LenderInfo.new(zdai.address, daiPool.address);
        await daiPool.initialize(
            zdai.address,
            dai.address,
            lenderInfo.address,
            loans.address,
        );
        return lenderInfo;
    },
}
