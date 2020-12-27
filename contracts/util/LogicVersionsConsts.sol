pragma solidity 0.5.17;

// Libraries

// Commons

/**
    @notice It defines the keys (constants) used in the LogicVersionsRegistry contract.

    @author develop@teller.finance
 */
contract LogicVersionsConsts {
    /** Constants */
    bytes32 public constant LENDING_POOL_LOGIC_NAME = keccak256("LendingPool");
    bytes32 public constant LENDERS_LOGIC_NAME = keccak256("Lenders");
    bytes32 public constant TOKEN_COLLATERAL_LOANS_LOGIC_NAME = keccak256(
        "TokenCollateralLoans"
    );
    bytes32 public constant ETHER_COLLATERAL_LOANS_LOGIC_NAME = keccak256(
        "EtherCollateralLoans"
    );
    bytes32 public constant LOAN_TERMS_CONSENSUS_LOGIC_NAME = keccak256(
        "LoanTermsConsensus"
    );
    bytes32 public constant INTEREST_CONSENSUS_LOGIC_NAME = keccak256(
        "InterestConsensus"
    );
    bytes32 public constant ESCROW_FACTORY_LOGIC_NAME = keccak256("EscrowFactory");
    bytes32 public constant ESCROW_LOGIC_NAME = keccak256("Escrow");
    bytes32 public constant CHAINLINK_PAIR_AGGREGATOR_LOGIC_NAME = keccak256(
        "ChainlinkPairAggregator"
    );
    bytes32 public constant CHAINLINK_PAIR_AGGREGATOR_REGISTRY_LOGIC_NAME = keccak256(
        "ChainlinkPairAggregatorRegistry"
    );
    bytes32 public constant SETTINGS_LOGIC_NAME = keccak256("Settings");
    bytes32 public constant LOGIC_VERSIONS_REGISTRY_LOGIC_NAME = keccak256(
        "LogicVersionsRegistry"
    );
    bytes32 public constant MARKETS_STATE_LOGIC_NAME = keccak256("MarketsState");
    bytes32 public constant ATM_FACTORY_LOGIC_NAME = keccak256("ATMFactory");
    bytes32 public constant ATM_SETTINGS_LOGIC_NAME = keccak256("ATMSettings");
    bytes32 public constant ATM_GOVERNANCE_LOGIC_NAME = keccak256("ATMGovernance");
    bytes32 public constant TLR_TOKEN_LOGIC_NAME = keccak256("TLRToken");
}
