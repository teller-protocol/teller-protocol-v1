pragma solidity 0.5.17;
pragma experimental ABIEncoderV2;

// Commons
import "../../util/TellerCommon.sol";

// Interfaces
import "../SettingsInterface.sol";
import "../../providers/compound/CErc20Interface.sol";

/**
    @notice This interface defines the functions to work with the Teller loans protocol

    @author develop@teller.finance
 */

interface ILoanData {
    /**
        @notice Returns a list of all loans for a borrower
        @param borrower Account address of the borrower
     */
    function getBorrowerLoans(address borrower)
        external
        view
        returns (uint256[] memory);

    /**
        @notice Returns the struct of a loan
        @param loanID ID of loan from which collateral was withdrawn
     */
    function loans(uint256 loanID)
        external
        view
        returns (TellerCommon.Loan memory);

    /**
        @notice Returns the lending token in the lending pool
        @return address Contract address of the lending pool
     */
    function lendingPool() external view returns (address);

    /**
        @notice Returns the total amount of collateral
        @return uint256 The total amount of collateral held by the contract instance
     */
    function totalCollateral() external view returns (uint256);

    /**
        @notice Returns the ID of loans taken out
        @return uint256 The next available loan ID
     */
    function loanIDCounter() external view returns (uint256);

    /**
        @notice Returns the lending token in the lending pool
        @return address Contract address of the lending token
     */
    function lendingToken() external view returns (address);

    /**
        @notice Returns the collateral token
        @return address Contract address of the token
     */
    function collateralToken() external view returns (address);

    /**
        @notice Returns the cToken in the lending pool
        @return Address of the cToken
     */
    function cToken() external view returns (CErc20Interface);

    /**
        @notice Returns the total owed amount remaining for a specified loan
        @param loanID The ID of the loan to be queried
        @return uint256 The total amount owed remaining
     */
    function getTotalOwed(uint256 loanID) external view returns (uint256);

    function settings() external view returns (SettingsInterface);

    /**
        @notice Checks whether the loan's collateral ratio is considered to be secured based on the settings collateral buffer value.
        @param loanID The loan ID to check.
        @return bool value of it being secured or not.
    */
    function isLoanSecured(uint256 loanID) external view returns (bool);

    /**
        @notice Checks whether a loan is allowed to be deposited to an Externally Owned Account.
        @param loanID The loan ID to check the collateral ratio for.
        @return bool indicating whether the loan with specified parameters can be deposited to an EOA.
     */
    function canLoanGoToEOA(uint256 loanID) external view returns (bool);

    /**
        @notice Returns the amount of interest owed for a given loan and loan amount.
        @param loanID The loan ID to get the owed interest.
        @param amountBorrow The principal of the loan to take out.
        @return uint256 The interest owed.
     */
    function getInterestOwedFor(uint256 loanID, uint256 amountBorrow)
        external
        view
        returns (uint256);

    /**
        @notice Returns the interest ratio based on the loan interest rate for the loan duration.
        @dev The interest rate on the loan terms is APY.
        @param loanID The loan ID to get the interest rate for.
     */
    function getInterestRatio(uint256 loanID) external view returns (uint256);

    /**
        @notice Get collateral information of a specific loan.
        @param loanID The loan ID to get collateral info for.
        @return memory TellerCommon.LoanCollateralInfo Collateral information of the loan.
     */
    function getCollateralInfo(uint256 loanID)
        external
        view
        returns (TellerCommon.LoanCollateralInfo memory);

    /**
        @notice Returns the collateral needed for a loan, in the lending token, needed to take out the loan or for it be liquidated.
        @param loanID The loan ID for which to get collateral information for
        @return uint256 Collateral needed in lending token value
     */
    function getCollateralInLendingTokens(uint256 loanID)
        external
        view
        returns (uint256);

    /**
        @notice Get information on the collateral needed for the loan.
        @param loanID The loan ID to get collateral info for.
        @return int256 Collateral needed in Lending tokens.
        @return int256 Collateral needed in Collateral tokens (wei)
        @return uint256 The value of the loan held in the escrow contract
     */
    function getCollateralNeededInfo(uint256 loanID)
        external
        view
        returns (
            int256 neededInLendingTokens,
            int256 neededInCollateralTokens,
            uint256 escrowLoanValue
        );

    /**
        @notice Returns the minimum collateral value threshold, in the lending token, needed to take out the loan or for it be liquidated.
        @dev If the loan status is TermsSet, then the value is whats needed to take out the loan.
        @dev If the loan status is Active, then the value is the threshold at which the loan can be liquidated at.
        @param loanID The loan ID to get needed collateral info for.
        @return int256 The minimum collateral value threshold required.
        @return uint256 The value of the loan held in the escrow contract.
     */
    function getCollateralNeededInTokens(uint256 loanID)
        external
        view
        returns (int256 neededInLendingTokens, uint256 escrowLoanValue);

    /**
        @notice It gets the current liquidation info for a given loan.
        @param loanID The loan ID to get the info.
        @return liquidationInfo get current liquidation info for the given loan id.
     */
    function getLiquidationInfo(uint256 loanID)
        external
        view
        returns (TellerCommon.LoanLiquidationInfo memory liquidationInfo);

    /**
        @notice Initializes the current contract instance setting the required parameters, if allowed
        @param lendingPoolAddress Contract address of the lending pool
        @param loanTermsConsensusAddress Contract address for loan term consensus
        @param settingsAddress Contract address for the configuration of the platform
        @param collateralTokenAddress Contract address for the collateral token
     */
    function initialize(
        address lendingPoolAddress,
        address loanTermsConsensusAddress,
        address settingsAddress,
        address collateralTokenAddress
    ) external;
}
