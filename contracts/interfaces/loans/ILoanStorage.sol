pragma solidity 0.5.17;
pragma experimental ABIEncoderV2;

// Commons
import "../../util/TellerCommon.sol";

// Interfaces
import "../SettingsInterface.sol";
import "../LendingPoolInterface.sol";
import "./ILoanTermsConsensus.sol";
import "../../providers/compound/CErc20Interface.sol";

/**
 * @notice This interface defines the functions to get and calculate information about loan data.
 *
 * @author develop@teller.finance
 */
interface ILoanStorage {
    /**
     * @notice It holds the instance of the platform Settings contract.
     * @return Instance of the platform Settings contract.
     */
    function settings() external view returns (SettingsInterface);

    /**
     * @notice Holds the total amount of collateral held by the contract.
     */
    function totalCollateral() external view returns (uint256);

    /**
     * @notice Holds the instance of the LendingPool used by the LoanManager.
     */
    function lendingPool() external view returns (LendingPoolInterface);

    /**
     * @notice Holds the lending token used for creating loans by the LoanManager and LendingPool.
     */
    function lendingToken() external view returns (address);

    /**
     * @notice Holds the collateral token.
     */
    function collateralToken() external view returns (address);

    /**
     * @notice Holds the Compound cToken where the underlying token matches the lending token.
     */
    function cToken() external view returns (CErc20Interface);

    /**
     * @notice Holds the consensus contract that verifies loan terms.
     */
    function loanTermsConsensus() external view returns (address);

    /**
     * @notice Holds the ID of loans taken out
     * @dev Also the next available loan ID
     */
    function loanIDCounter() external view returns (uint256);

    /**
     * @notice Holds the data of all loans for the lending token.
     * @param loanID Loan ID to get data for.
     */
    function loans(uint256 loanID)
        external
        view
        returns (TellerCommon.Loan memory);
}
