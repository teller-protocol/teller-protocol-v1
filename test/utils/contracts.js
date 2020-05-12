const { sum } = require('./consts');

module.exports = {
    mockLenderInfo: async (instance, lenderData, currentBlockNumber) => {
        await instance.mockLenderInfo(
            lenderData.address,
            sum(currentBlockNumber, lenderData.plusLastAccruedBlockNumber),
            lenderData.lastAccruedInterest
        );
    },
    initContracts: async (settings, lendingPool, zToken, consensus, lendingToken, loans, Lenders) => {
        const lenders = await Lenders.new();
        await lenders.initialize(
            zToken.address,
            lendingPool.address,
            consensus.address,
            settings.address,
        );
        await lendingPool.initialize(
            zToken.address,
            lendingToken.address,
            lenders.address,
            loans.address,
            settings.address,
        );
        return lenders;
    },
}
