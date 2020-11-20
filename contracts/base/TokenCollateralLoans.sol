pragma solidity 0.5.17;
pragma experimental ABIEncoderV2;

// Contracts
import "./LoansBase.sol";

/*****************************************************************************************************/
/**                                             WARNING                                             **/
/**                                  THIS CONTRACT IS UPGRADEABLE!                                  **/
/**  ---------------------------------------------------------------------------------------------  **/
/**  Do NOT change the order of or PREPEND any storage variables to this or new versions of this    **/
/**  contract as this will cause the the storage slots to be overwritten on the proxy contract!!    **/
/**                                                                                                 **/
/**  Visit https://docs.openzeppelin.com/upgrades/2.6/proxies#upgrading-via-the-proxy-pattern for   **/
/**  more information.                                                                              **/
/*****************************************************************************************************/
/**
    @notice This contract is used as a basis for the creation of loans (not wei) across the platform
    @notice It implements the LoansBase contract from Teller

    @author develop@teller.finance
 */
contract TokenCollateralLoans is LoansBase {
    /** Constants */

    /** Properties */

    /** Modifiers */

    /**
        @notice Checks the value in the current transactionn is zero.
        @dev It throws a require error if value is not zero.
     */
    modifier noMsgValue() {
        require(msg.value == 0, "TOKEN_LOANS_VALUE_MUST_BE_ZERO");
        _;
    }

    /** External Functions */

    /**
     * @notice Deposit collateral tokens into a loan.
     * @param borrower The address of the loan borrower.
     * @param loanID The ID of the loan the collateral is for
     * @param amount The amount to deposit as collateral.
     */
    function depositCollateral(
        address borrower,
        uint256 loanID,
        uint256 amount
    )
        external
        payable
        noMsgValue()
        loanActiveOrSet(loanID)
        isInitialized()
        whenNotPaused()
        whenLendingPoolNotPaused(address(lendingPool))
    {
        borrower.requireEqualTo(
            loans[loanID].loanTerms.borrower,
            "BORROWER_LOAN_ID_MISMATCH"
        );
        require(amount > 0, "CANNOT_DEPOSIT_ZERO");

        // Update the loan collateral and total. Transfer tokens to this contract.
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
        TellerCommon.LoanRequest calldata request,
        TellerCommon.LoanResponse[] calldata responses,
        uint256 collateralAmount
    )
        external
        payable
        noMsgValue()
        isInitialized()
        whenNotPaused()
        isBorrower(request.borrower)
        withValidLoanRequest(request)
    {
        uint256 loanID = _getAndIncrementLoanID();

        (
            uint256 interestRate,
            uint256 collateralRatio,
            uint256 maxLoanAmount
        ) = loanTermsConsensus.processRequest(request, responses);

        loans[loanID] = _createLoan(
            loanID,
            request,
            interestRate,
            collateralRatio,
            maxLoanAmount
        );

        if (collateralAmount > 0) {
            // Update collateral, totalCollateral, and lastCollateralIn
            _payInCollateral(loanID, collateralAmount);
        }

        borrowerLoans[request.borrower].push(loanID);

        _emitLoanTermsSetAndCollateralDepositedEventsIfApplicable(
            loanID,
            request,
            interestRate,
            collateralRatio,
            maxLoanAmount,
            collateralAmount
        );
    }

    /**
        @notice Initializes the current contract instance setting the required parameters, if allowed
        @param lendingPoolAddress Contract address of the lending pool
        @param loanTermsConsensusAddress Contract address for loan term consensus
        @param settingsAddress Contract address for the configuration of the platform
        @param collateralTokenAddress Contract address for the collateral token.
     */
    function initialize(
        address lendingPoolAddress,
        address loanTermsConsensusAddress,
        address loansUtilAddress,
        address settingsAddress,
        address collateralTokenAddress
    ) external isNotInitialized() {
        collateralTokenAddress.requireNotEmpty("PROVIDE_COLL_TOKEN_ADDRESS");

        _initialize(
            lendingPoolAddress,
            loanTermsConsensusAddress,
            loansUtilAddress,
            settingsAddress
        );

        collateralToken = collateralTokenAddress;
    }

    /** Internal Function */
    /**
        @notice Pays out collateral for the associated loan
        @param loanID The ID of the loan the collateral is for
        @param amount The amount of collateral to be paid
     */
    function _payOutCollateral(
        uint256 loanID,
        uint256 amount,
        address payable recipient
    ) internal {
        totalCollateral = totalCollateral.sub(amount);
        loans[loanID].collateral = loans[loanID].collateral.sub(amount);

        _collateralTokenTransfer(recipient, amount);
    }

    /**
        @notice Pays collateral in for the associated loan
        @param loanID The ID of the loan the collateral is for
        @param amount The amount of collateral to be paid
     */
    function _payInCollateral(uint256 loanID, uint256 amount) internal {
        // Update the total collateral and loan collateral
        super._payInCollateral(loanID, amount);
        // Transfer collateral tokens to this contract.
        _collateralTokenTransferFrom(msg.sender, amount);
    }

    /**
        @notice It transfers an amount of collateral tokens to a specific address.
        @param recipient The address which will receive the tokens.
        @param amount The amount of tokens to transfer.
     */
    function _collateralTokenTransfer(address recipient, uint256 amount) internal {
        ERC20Detailed(collateralToken).tokenTransfer(recipient, amount);
    }

    /**
        @notice It transfers an amount of collateral tokens from an address to this contract.
        @param from The address where the tokens will transfer from.
        @param amount The amount to be transferred.
     */
    function _collateralTokenTransferFrom(address from, uint256 amount) internal {
        ERC20Detailed(collateralToken).tokenTransferFrom(from, amount);
    }
}
