pragma solidity 0.5.17;


// Libraries

// Commons

/**

    @author develop@teller.finance
 */
contract LogicVersionsConsts {
    /** Constants */

    bytes32 public constant LENDING_POOL_LOGIC_NAME = "LendingPool";
    
    bytes32 public constant LENDERS_LOGIC_NAME = "Lenders";

    bytes32 public constant TOKEN_COLLATERAL_LOANS_LOGIC_NAME = "TokenCollateralLoans";

    bytes32 public constant ETHER_COLLATERAL_LOANS_LOGIC_NAME = "EtherCollateralLoans";

    bytes32 public constant LOAN_TERMS_CONSENSUS_LOGIC_NAME = "LoanTermsConsensus";

    bytes32 public constant INTEREST_CONSENSUS_LOGIC_NAME = "InterestConsensus";

    bytes32 public constant PAIR_AGGREGATOR_LOGIC_NAME = "PairAggregator";
    
    bytes32 public constant INVERSE_PAIR_AGGREGATOR_LOGIC_NAME = "InversePairAggregator";
    
}
