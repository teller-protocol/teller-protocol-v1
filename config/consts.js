const DEFAULT_SECONDS_PER_BLOCK = 15;
const secondsToBlocks = (seconds) => Math.round(seconds / DEFAULT_SECONDS_PER_BLOCK);
const minutesToBlocks = (minutes) => secondsToBlocks(minutes * 60);
const hoursToBlocks = (hours) => minutesToBlocks(hours * 60);
module.exports = {
    /*
        This address is ONLY used in network configurations where:
        1 - We have't deployed the contracts yet. Examples: mainnet.
        2- It is not possible to deploy third party contracts. Example: Chainlink in Ganache.
    */
    DUMMY_ADDRESS: '0x0000000000000000000000000000000000000001',
    /**
        This is used as a default amount to configure max lending amount.
     */
    DEFAULT_MAX_AMOUNT: 1000,
    DEFAULT_SECONDS_PER_BLOCK,
    secondsToBlocks,
    minutesToBlocks,
    hoursToBlocks,
}
