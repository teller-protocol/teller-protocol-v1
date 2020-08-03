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

    /**
     * Represents the initial version of the Node Component.
     * 
     * e.g.: 1000000 => represents : 1.00.00.00
     * e.g.: 10000 => represents : 1.00.00
     */
    INITIAL_NODE_COMPONENT_VERSION: 10000,
}
