const { sum } = require('./consts');

module.exports = {
    mockLenderInfo: async (instance, lenderData, currentBlockNumber) => {
        await instance.mockLenderInfo(
            lenderData.address,
            sum(currentBlockNumber, lenderData.plusLastAccruedBlockNumber),
            lenderData.lastAccruedInterest
        );
    },
    initContracts: async (lendingPool, zdai, dai, loans, Lenders) => {
        const lenders = await Lenders.new(zdai.address, lendingPool.address);
        await lendingPool.initialize(
            zdai.address,
            dai.address,
            lenders.address,
            loans.address,
        );
        return lenders;
    },
}
