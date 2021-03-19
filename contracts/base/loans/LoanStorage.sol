pragma solidity 0.5.17;
pragma experimental ABIEncoderV2;

// Libraries
import "../../util/TellerCommon.sol";

// Interfaces
import "../../interfaces/LendingPoolInterface.sol";
import "../../interfaces/LoanTermsConsensusInterface.sol";

// Contracts
import "../BaseStorage.sol";

/*****************************************************************************************************/
/**                                             WARNING                                             **/
/**                        THIS CONTRACT IS AN UPGRADEABLE STORAGE CONTRACT!                        **/
/**  ---------------------------------------------------------------------------------------------  **/
/**  Do NOT change the order of, PREPEND, or APPEND any storage variables to this or new versions   **/
/**  of this contract as this will cause a ripple affect to the storage slots of all child          **/
/**  contracts that inherit from this contract to be overwritten on the deployed proxy contract!!   **/
/**                                                                                                 **/
/**  Visit https://docs.openzeppelin.com/upgrades/2.6/proxies#upgrading-via-the-proxy-pattern for   **/
/**  more information.                                                                              **/
/*****************************************************************************************************/
/**
    @notice This contract is used to storage the state variables for all of the LoanManager and LoanData contracts.

    @author develop@teller.finance.
 */
contract LoanStorage is BaseStorage {
    // Loan length will be inputted in seconds.
    uint256 internal constant SECONDS_PER_YEAR = 31536000;

    uint256 public totalCollateral;

    address public collateralToken;

    // At any time, this variable stores the next available loan ID
    uint256 public loanIDCounter;

    LendingPoolInterface public lendingPool;

    address public lendingToken;

    LoanTermsConsensusInterface public loanTermsConsensus;

    mapping(address => uint256[]) public borrowerLoans;

    mapping(uint256 => TellerCommon.Loan) public loans;

    address internal loanData;

    bytes32 public constant LOAN_DATA_LOGIC_NAME = keccak256("LoanData");
}
