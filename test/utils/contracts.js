const { sum } = require('./consts');

module.exports = {
    mockLenderInfo: async (instance, lenderData, currentBlockNumber) => {
        await instance.mockLenderInfo(
            lenderData.address,
            sum(currentBlockNumber, lenderData.plusLastAccruedBlockNumber),
            lenderData.lastAccruedInterest
        );
    },
    initContracts: async (lendingPool, zToken, consensus, dai, loans, Lenders) => {
        const lenders = await Lenders.new(zToken.address, lendingPool.address, consensus.address);
        await lendingPool.initialize(
            zToken.address,
            dai.address,
            lenders.address,
            loans.address,
        );
        return lenders;
    },
}
