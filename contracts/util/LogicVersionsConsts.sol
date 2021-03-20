pragma solidity 0.5.17;

// Libraries

// Commons

/**
    @notice It defines the keys (constants) used in the LogicVersionsRegistry contract.

    @author develop@teller.finance
 */
contract LogicVersionsConsts {
    /** Constants */
    bytes32 public constant TTOKEN_LOGIC_NAME = keccak256("TToken");
    bytes32 public constant LENDING_POOL_LOGIC_NAME = keccak256("LendingPool");
    bytes32 public constant LOAN_MANAGER_LOGIC_NAME = keccak256("LoanManager");
    bytes32 public constant LOAN_TERMS_CONSENSUS_LOGIC_NAME =
        keccak256("LoanTermsConsensus");
    bytes32 public constant MARKET_FACTORY_LOGIC_NAME =
        keccak256("MarketFactory");
    bytes32 public constant DAPP_REGISTRY_LOGIC_NAME =
        keccak256("DappRegistry");
    bytes32 public constant ESCROW_LOGIC_NAME = keccak256("Escrow");
    bytes32 public constant CHAINLINK_PAIR_AGGREGATOR_LOGIC_NAME =
        keccak256("ChainlinkAggregator");
    bytes32 public constant SETTINGS_LOGIC_NAME = keccak256("Settings");
    bytes32 public constant LOGIC_VERSIONS_REGISTRY_LOGIC_NAME =
        keccak256("LogicVersionsRegistry");
    bytes32 public constant ATM_FACTORY_LOGIC_NAME = keccak256("ATMFactory");
    bytes32 public constant ATM_SETTINGS_LOGIC_NAME = keccak256("ATMSettings");
    bytes32 public constant ATM_GOVERNANCE_LOGIC_NAME =
        keccak256("ATMGovernance");
    bytes32 public constant ATM_LIQUIDITY_MINING_LOGIC_NAME =
        keccak256("ATMLiquidityMining");
    bytes32 public constant TLR_TOKEN_LOGIC_NAME = keccak256("TLRToken");
    bytes32 public constant ASSET_SETTINGS_LOGIC_NAME =
        keccak256("AssetSettings");
}
