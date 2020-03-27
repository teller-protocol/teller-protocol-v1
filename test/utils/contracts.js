const { sum } = require('./consts');

module.exports = {
    mockLenderInfo: async (instance, lenderData, currentBlockNumber) => {
        await instance.mockLenderInfo(
            lenderData.address,
            sum(currentBlockNumber, lenderData.plusLastAccruedBlockNumber),
            lenderData.lastAccruedInterest
        );
    },
}
