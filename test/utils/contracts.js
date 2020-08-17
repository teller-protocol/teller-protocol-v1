const { sum } = require('./consts');

module.exports = {
    mockLenderInfo: async (instance, lenderData, currentBlockNumber) => {
        await instance.mockLenderInfo(
            lenderData.address,
            sum(currentBlockNumber, lenderData.plusLastAccruedBlockNumber),
            lenderData.lastAccruedInterest
        );
    },
    initContracts: async (settings, cToken, lendingPool, tToken, consensus, lendingToken, loans, markets, interestValidatorAddress, Lenders) => {
        const lenders = await Lenders.new();
        await lenders.initialize(
            tToken.address,
            lendingPool.address,
            consensus.address,
            settings.address,
            markets.address,
        );
        await lendingPool.initialize(
            tToken.address,
            lendingToken.address,
            lenders.address,
            loans.address,
            cToken.address,
            settings.address,
            markets.address,
            interestValidatorAddress,
        );
        return lenders;
    },
}
