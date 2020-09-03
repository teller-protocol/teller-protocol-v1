pragma solidity 0.5.17;


// Libraries

// Commons

/**
    @notice It defines the keys (constants) used in the LogicVersionsRegistry contract.

    @author develop@teller.finance
 */
contract LogicVersionsConsts {
    /** Constants */
    bytes32 public constant LENDING_POOL_LOGIC_NAME = 'LendingPool';
    bytes32 public constant LENDERS_LOGIC_NAME = 'Lenders';
    bytes32 public constant TOKEN_COLLATERAL_LOANS_LOGIC_NAME = 'TokenCollateralLoans';
    bytes32 public constant ETHER_COLLATERAL_LOANS_LOGIC_NAME = 'EtherCollateralLoans';
    bytes32 public constant LOAN_TERMS_CONSENSUS_LOGIC_NAME = 'LoanTermsConsensus';
    bytes32 public constant INTEREST_CONSENSUS_LOGIC_NAME = 'InterestConsensus';
    bytes32 public constant ESCROW_FACTORY_LOGIC_NAME = 'EscrowFactory';
    bytes32 public constant ESCROW_LOGIC_NAME = 'Escrow';
    bytes32 public constant CHAINLINK_PAIR_AGGREGATOR_LOGIC_NAME = 'ChainlinkPairAggregator';
    bytes32 public constant CHAINLINK_PAIR_AGGREGATOR_REGISTRY_LOGIC_NAME = 'ChainlinkPairAggregatorRegistry';
    bytes32 public constant SETTINGS_LOGIC_NAME = 'Settings';
    bytes32 public constant LOGIC_VERSIONS_REGISTRY_LOGIC_NAME = 'LogicVersionsRegistry';
    bytes32 public constant MARKETS_STATE_LOGIC_NAME = 'MarketsState';
    bytes32 public constant ATM_FACTORY_LOGIC_NAME = 'ATMFactory';
    bytes32 public constant ATM_SETTINGS_LOGIC_NAME = 'ATMSettings';
    bytes32 public constant ATM_GOVERNANCE_LOGIC_NAME = 'ATMGovernance';
    bytes32 public constant ATM_TOKEN_LOGIC_NAME = 'ATMToken';
}
