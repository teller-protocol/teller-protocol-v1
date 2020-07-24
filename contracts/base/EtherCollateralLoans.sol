pragma solidity 0.5.17;
pragma experimental ABIEncoderV2;

// Contracts
import "./LoansBase.sol";


/**
    @notice This contract is used as a basis for the creation of Ether based loans across the platform
    @notice It implements the LoansBase contract from Teller

    @author develop@teller.finance
 */
contract EtherCollateralLoans is LoansBase {
    address public collateralToken = 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;

    /**
     * @notice Deposit collateral into a loan
     * @param borrower The address of the loan borrower.
     * @param loanID The ID of the loan the collateral is for
     */
    function depositCollateral(address borrower, uint256 loanID, uint256 amount)
        external
        payable
        loanActiveOrSet(loanID)
        isInitialized()
        whenNotPaused()
        whenLendingPoolNotPaused(address(lendingPool))
    {
        require(
            loans[loanID].loanTerms.borrower == borrower,
            "BORROWER_LOAN_ID_MISMATCH"
        );
        require(msg.value == amount, "INCORRECT_ETH_AMOUNT");
        require(msg.value > 0, "CANNOT_DEPOSIT_ZERO");

        // Update the contract total and the loan collateral total
        _payInCollateral(loanID, amount);

        emit CollateralDeposited(loanID, borrower, amount);
    }

    /**
        @notice Creates a loan with the loan request and terms
        @param request Struct of the protocol loan request
        @param responses List of structs of the protocol loan responses
        @param collateralAmount Amount of collateral required for the loan
     */
    function createLoanWithTerms(
        ZeroCollateralCommon.LoanRequest calldata request,
        ZeroCollateralCommon.LoanResponse[] calldata responses,
        uint256 collateralAmount
    ) external payable isInitialized() whenNotPaused() isBorrower(request.borrower) {
        require(msg.value == collateralAmount, "INCORRECT_ETH_AMOUNT");

        uint256 loanID = getAndIncrementLoanID();
        (
            uint256 interestRate,
            uint256 collateralRatio,
            uint256 maxLoanAmount
        ) = loanTermsConsensus.processRequest(request, responses);

        loans[loanID] = createLoan(
            loanID,
            request,
            interestRate,
            collateralRatio,
            maxLoanAmount
        );

        if (msg.value > 0) {
            // Update collateral, totalCollateral, and lastCollateralIn
            _payInCollateral(loanID, msg.value);
        }

        borrowerLoans[request.borrower].push(loanID);

        emit LoanTermsSet(
            loanID,
            request.borrower,
            request.recipient,
            interestRate,
            collateralRatio,
            maxLoanAmount,
            request.duration,
            loans[loanID].termsExpiry
        );
        if (msg.value > 0) {
            emit CollateralDeposited(loanID, request.borrower, msg.value);
        }
    }

    /**
        @notice Initializes the current contract instance setting the required parameters
        @param priceOracleAddress Contract address of the price oracle
        @param lendingPoolAddress Contract address of the lending pool
        @param loanTermsConsensusAddress Contract adddress for loan term consensus
        @param settingsAddress Contract address for the configuration of the platform
     */
    function initialize(
        address priceOracleAddress,
        address lendingPoolAddress,
        address loanTermsConsensusAddress,
        address settingsAddress
    ) external isNotInitialized() {
        _initialize(
            priceOracleAddress,
            lendingPoolAddress,
            loanTermsConsensusAddress,
            settingsAddress
        );
    }

    /** Internal Functions */
    /**
        @notice Pays out collateral for the associated loan
        @param loanID The ID of the loan the collateral is for
        @param amount The amount of collateral to be paid
     */
    function _payOutCollateral(uint256 loanID, uint256 amount, address payable recipient)
        internal
    {
        totalCollateral = totalCollateral.sub(amount);
        loans[loanID].collateral = loans[loanID].collateral.sub(amount);
        recipient.transfer(amount);
    }
}
