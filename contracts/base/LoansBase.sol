pragma solidity 0.5.17;
pragma experimental ABIEncoderV2;

// Libraries and common
import "../util/ZeroCollateralCommon.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";

// Contracts
import "@openzeppelin/contracts/token/ERC20/ERC20Detailed.sol";
import "./Base.sol";

// Interfaces
import "../interfaces/PairAggregatorInterface.sol";
import "../interfaces/LendingPoolInterface.sol";
import "../interfaces/LoanTermsConsensusInterface.sol";
import "../interfaces/LoansInterface.sol";


/**
    @notice This contract is used as a basis for the creation of the different types of loans across the platform
    @notice It implements the Base contract from Teller and the LoansInterface

    @author develop@teller.finance
 */
contract LoansBase is LoansInterface, Base {
    using SafeMath for uint256;

    /* State Variables */

    // Used to calculate one whole token.
    uint256 internal constant TEN = 10;

    // Loan length will be inputted in days, with 4 decimal places. i.e. 30 days will be inputted as
    // 300000. Therefore in interest calculations we must divide by 365000
    uint256 internal constant DAYS_PER_YEAR_4DP = 3650000;

    // For interestRate, collateral, and liquidation price, 7% is represented as 700. To find the value
    // of something we must divide 700 by 100 to remove decimal places, and another 100 for percentage.
    uint256 internal constant TEN_THOUSAND = 10000;

    uint256 public totalCollateral;

    address public collateralToken;

    // At any time, this variable stores the next available loan ID
    uint256 public loanIDCounter;

    PairAggregatorInterface public priceOracle;
    LendingPoolInterface public lendingPool;
    LoanTermsConsensusInterface public loanTermsConsensus;

    mapping(address => uint256[]) public borrowerLoans;

    mapping(uint256 => ZeroCollateralCommon.Loan) public loans;

    /* Modifiers */

    /**
        @notice Checks if the sender is a borrower or not
        @dev It throws a require error if the sender is not a borrower
        @param borrower Account address to check
     */
    modifier isBorrower(address borrower) {
        require(msg.sender == borrower, "BORROWER_MUST_BE_SENDER");
        _;
    }

    /**
        @notice Checks whether the loan is active or not
        @dev Throws a require error if the loan is not active
        @param loanID number of loan to check
     */
    modifier loanActive(uint256 loanID) {
        require(
            loans[loanID].status == ZeroCollateralCommon.LoanStatus.Active,
            "LOAN_NOT_ACTIVE"
        );
        _;
    }

    /**
        @notice Checks if the loan has been set or not
        @dev Throws a require error if the loan terms have not been set
        @param loanID number of loan to check
     */
    modifier loanTermsSet(uint256 loanID) {
        require(
            loans[loanID].status == ZeroCollateralCommon.LoanStatus.TermsSet,
            "LOAN_NOT_SET"
        );
        _;
    }

    /**
        @notice Checks whether the loan is active and has been set or not
        @dev Throws a require error if the loan is not active or has not been set
        @param loanID number of loan to check
     */
    modifier loanActiveOrSet(uint256 loanID) {
        require(
            loans[loanID].status == ZeroCollateralCommon.LoanStatus.TermsSet ||
                loans[loanID].status == ZeroCollateralCommon.LoanStatus.Active,
            "LOAN_NOT_ACTIVE_OR_SET"
        );
        _;
    }

    modifier withValidLoanRequest(ZeroCollateralCommon.LoanRequest memory loanRequest) {
        require(
            settings.maximumLoanDuration() >= loanRequest.duration,
            "DURATION_EXCEEDS_MAX_DURATION"
        );
        _;
    }

    /**
        @notice Get a list of all loans for a borrower
        @param borrower The borrower's address
     */
    function getBorrowerLoans(address borrower) external view returns (uint256[] memory) {
        return borrowerLoans[borrower];
    }

    /**
        @notice Returns the lending token in the lending pool
        @return Address of the lending token
     */
    function lendingToken() external view returns (address) {
        return lendingPool.lendingToken();
    }

    /**
     * @notice Withdraw collateral from a loan, unless this isn't allowed
     * @param amount The amount of collateral token or ether the caller is hoping to withdraw.
     * @param loanID The ID of the loan the collateral is for
     */
    function withdrawCollateral(uint256 amount, uint256 loanID)
        external
        loanActiveOrSet(loanID)
        isInitialized()
        whenNotPaused()
        whenLendingPoolNotPaused(address(lendingPool))
        nonReentrant()
    {
        require(msg.sender == loans[loanID].loanTerms.borrower, "CALLER_DOESNT_OWN_LOAN");
        require(amount > 0, "CANNOT_WITHDRAW_ZERO");

        // Find the minimum collateral amount this loan is allowed in tokens or ether.
        uint256 collateralNeededToken = _getCollateralNeededInTokens(
            _getTotalOwed(loanID),
            loans[loanID].loanTerms.collateralRatio
        );
        uint256 collateralNeededWei = _convertTokenToWei(collateralNeededToken);

        // Withdrawal amount holds the amount of excess collateral in the loan
        uint256 withdrawalAmount = loans[loanID].collateral.sub(collateralNeededWei);
        if (withdrawalAmount > amount) {
            withdrawalAmount = amount;
        }

        if (withdrawalAmount > 0) {
            // Update the contract total and the loan collateral total
            _payOutCollateral(loanID, withdrawalAmount, msg.sender);
        }

        emit CollateralWithdrawn(loanID, msg.sender, withdrawalAmount);
    }

    /**
     * @notice Take out a loan
     *
     * @dev collateral ratio is a percentage of the loan amount that's required in collateral
     * @dev the percentage will be *(10**2). I.e. collateralRatio of 5244 means 52.44% collateral
     * @dev is required in the loan. Interest rate is also a percentage with 2 decimal points.
     */
    function takeOutLoan(uint256 loanID, uint256 amountBorrow)
        external
        loanTermsSet(loanID)
        isInitialized()
        whenNotPaused()
        whenLendingPoolNotPaused(address(lendingPool))
        nonReentrant()
        isBorrower(loans[loanID].loanTerms.borrower)
    {
        require(
            loans[loanID].loanTerms.maxLoanAmount >= amountBorrow,
            "MAX_LOAN_EXCEEDED"
        );

        require(loans[loanID].termsExpiry >= now, "LOAN_TERMS_EXPIRED");

        require(
            loans[loanID].lastCollateralIn <= now.sub(settings.safetyInterval()),
            "COLLATERAL_DEPOSITED_RECENTLY"
        );

        loans[loanID].borrowedAmount = amountBorrow;
        loans[loanID].principalOwed = amountBorrow;
        loans[loanID].interestOwed = amountBorrow
            .mul(loans[loanID].loanTerms.interestRate)
            .mul(loans[loanID].loanTerms.duration)
            .div(TEN_THOUSAND)
            .div(DAYS_PER_YEAR_4DP);

        // check that enough collateral has been provided for this loan
        (, , , bool moreCollateralRequired) = _getCollateralInfo(loanID);

        require(!moreCollateralRequired, "MORE_COLLATERAL_REQUIRED");

        loans[loanID].loanStartTime = now;

        loans[loanID].status = ZeroCollateralCommon.LoanStatus.Active;

        // give the recipient their requested amount of tokens
        if (loans[loanID].loanTerms.recipient != address(0)) {
            lendingPool.createLoan(amountBorrow, loans[loanID].loanTerms.recipient);
        } else {
            lendingPool.createLoan(amountBorrow, loans[loanID].loanTerms.borrower);
        }

        emit LoanTakenOut(loanID, loans[loanID].loanTerms.borrower, amountBorrow);
    }

    /**
     * @notice Make a payment to a loan
     * @param amount The amount of tokens to pay back to the loan
     * @param loanID The ID of the loan the payment is for
     */
    function repay(uint256 amount, uint256 loanID)
        external
        loanActive(loanID)
        isInitialized()
        whenNotPaused()
        whenLendingPoolNotPaused(address(lendingPool))
        nonReentrant()
    {
        require(amount > 0, "AMOUNT_VALUE_REQUIRED");
        // calculate the actual amount to repay
        uint256 toPay = amount;
        uint256 totalOwed = _getTotalOwed(loanID);
        if (totalOwed < toPay) {
            toPay = totalOwed;
        }

        // update the amount owed on the loan
        totalOwed = totalOwed.sub(toPay);
        _payLoan(loanID, toPay);

        // if the loan is now fully paid, close it and return collateral
        if (totalOwed == 0) {
            loans[loanID].status = ZeroCollateralCommon.LoanStatus.Closed;

            uint256 collateralAmount = loans[loanID].collateral;
            _payOutCollateral(loanID, collateralAmount, loans[loanID].loanTerms.borrower);

            emit CollateralWithdrawn(
                loanID,
                loans[loanID].loanTerms.borrower,
                collateralAmount
            );
        }

        // collect the money from the payer
        lendingPool.repay(toPay, msg.sender);

        emit LoanRepaid(
            loanID,
            loans[loanID].loanTerms.borrower,
            toPay,
            msg.sender,
            totalOwed
        );
    }

    /**
     * @notice Liquidate a loan if it is expired or undercollateralised
     * @param loanID The ID of the loan to be liquidated
     */
    function liquidateLoan(uint256 loanID)
        external
        loanActive(loanID)
        isInitialized()
        whenNotPaused()
        whenLendingPoolNotPaused(address(lendingPool))
        nonReentrant()
    {
        // calculate the amount of collateral the loan needs in tokens
        (uint256 loanCollateral, , , bool moreCollateralRequired) = _getCollateralInfo(
            loanID
        );

        // calculate when the loan should end
        uint256 loanEndTime = loans[loanID].loanStartTime.add(
            loans[loanID].loanTerms.duration
        );

        // to liquidate it must be undercollateralised, or expired
        require(moreCollateralRequired || loanEndTime < now, "DOESNT_NEED_LIQUIDATION");

        loans[loanID].status = ZeroCollateralCommon.LoanStatus.Closed;
        loans[loanID].liquidated = true;

        uint256 collateralInTokens = _convertWeiToToken(loanCollateral);

        // the caller gets the collateral from the loan
        _payOutCollateral(loanID, loanCollateral, msg.sender);

        uint256 tokenPayment = collateralInTokens.mul(settings.liquidateEthPrice()).div(
            TEN_THOUSAND
        );
        // the liquidator pays x% of the collateral price
        lendingPool.liquidationPayment(tokenPayment, msg.sender);

        emit LoanLiquidated(
            loanID,
            loans[loanID].loanTerms.borrower,
            msg.sender,
            loanCollateral,
            tokenPayment
        );
    }

    /**
        @notice Get collateral infomation of a specific loan
        @param loanID of the loan to get info for
        @return uint256 Collateral needed
        @return uint256 Collaternal needed in Lending tokens
        @return uint256 Collateral needed in Collateral tokens (wei)
        @return bool If more collateral is needed or not
     */
    function getCollateralInfo(uint256 loanID)
        external
        view
        returns (
            uint256 collateral,
            uint256 collateralNeededLendingTokens,
            uint256 collateralNeededCollateralTokens,
            bool moreCollateralRequired
        )
    {
        return _getCollateralInfo(loanID);
    }

    /** Internal Functions */
    /**
        @notice Pays out the collateral for a loan
        @param loanID ID of loan from which collateral is to be paid out
        @param amount Amount of collateral paid out
        @param recipient Account address of the recipient of the collateral
     */
    function _payOutCollateral(uint256 loanID, uint256 amount, address payable recipient)
        internal;

    /**
        @notice Get collateral infomation of a specific loan
        @param loanID of the loan to get info for
        @return uint256 Collateral needed
        @return uint256 Collaternal needed in Lending tokens
        @return uint256 Collateral needed in Collateral tokens (wei)
        @return bool If more collateral is needed or not
     */
    function _getCollateralInfo(uint256 loanID)
        internal
        view
        returns (
            uint256 collateral,
            uint256 collateralNeededLendingTokens,
            uint256 collateralNeededCollateralTokens,
            bool moreCollateralRequired
        )
    {
        collateral = loans[loanID].collateral;
        (
            collateralNeededLendingTokens,
            collateralNeededCollateralTokens
        ) = _getCollateralNeededInfo(
            _getTotalOwed(loanID),
            loans[loanID].loanTerms.collateralRatio
        );
        moreCollateralRequired = collateralNeededCollateralTokens > collateral;
    }

    /**
       @notice Get information on the collateral needed for the loan
       @param totalOwed Total amount owed for the loan
       @param collateralRatio Collateral ratio set in the loan terms
       @return uint256 Collaternal needed in Lending tokens
       @return uint256 Collateral needed in Collateral tokens (wei)
     */
    function _getCollateralNeededInfo(uint256 totalOwed, uint256 collateralRatio)
        internal
        view
        returns (
            uint256 collateralNeededLendingTokens,
            uint256 collateralNeededCollateralTokens
        )
    {
        // Get collateral needed in lending tokens.
        uint256 collateralNeededToken = _getCollateralNeededInTokens(
            totalOwed,
            collateralRatio
        );
        // Convert collateral (in lending tokens) into collateral tokens.
        return (collateralNeededToken, _convertTokenToWei(collateralNeededToken));
    }

    /**
        @notice Initializes the current contract instance setting the required parameters.
        @param priceOracleAddress Contract address of the price oracle
        @param lendingPoolAddress Contract address of the lending pool
        @param loanTermsConsensusAddress Contract adddress for loan term consensus
        @param settingsAddress Contract address for the configuration of the platform
     */
    function _initialize(
        address priceOracleAddress,
        address lendingPoolAddress,
        address loanTermsConsensusAddress,
        address settingsAddress
    ) internal isNotInitialized() {
        priceOracleAddress.requireNotEmpty("PROVIDE_ORACLE_ADDRESS");
        lendingPoolAddress.requireNotEmpty("PROVIDE_LENDINGPOOL_ADDRESS");
        loanTermsConsensusAddress.requireNotEmpty("PROVIDED_LOAN_TERMS_ADDRESS");

        _initialize(settingsAddress);

        priceOracle = PairAggregatorInterface(priceOracleAddress);
        lendingPool = LendingPoolInterface(lendingPoolAddress);
        loanTermsConsensus = LoanTermsConsensusInterface(loanTermsConsensusAddress);
    }

    /**
        @notice Pays collateral in for the associated loan
        @param loanID The ID of the loan the collateral is for
        @param amount The amount of collateral to be paid
     */
    function _payInCollateral(uint256 loanID, uint256 amount) internal {
        totalCollateral = totalCollateral.add(amount);
        loans[loanID].collateral = loans[loanID].collateral.add(amount);
        loans[loanID].lastCollateralIn = now;
    }

    /**
        @notice Make a payment towards the prinicial and interest for a specified loan
        @param loanID The ID of the loan the payment is for
        @param toPay The amount of tokens to pay to the loan
     */
    function _payLoan(uint256 loanID, uint256 toPay) internal {
        if (toPay > loans[loanID].principalOwed) {
            uint256 leftToPay = toPay;
            leftToPay = leftToPay.sub(loans[loanID].principalOwed);
            loans[loanID].principalOwed = 0;
            loans[loanID].interestOwed = loans[loanID].interestOwed.sub(leftToPay);
        } else {
            loans[loanID].principalOwed = loans[loanID].principalOwed.sub(toPay);
        }
    }

    /**
        @notice Returns the total owed amount remaining for a specified loan
        @param loanID The ID of the loan to be queried
        @return uint256 The total amount owed remaining
     */
    function _getTotalOwed(uint256 loanID) internal view returns (uint256) {
        return loans[loanID].interestOwed.add(loans[loanID].principalOwed);
    }

    /**
        @notice Returns a calculated whole lending token
        @return uint256 A whole lending token calcuated using token case units
     */
    function _getAWholeLendingToken() internal view returns (uint256) {
        uint8 decimals = ERC20Detailed(lendingPool.lendingToken()).decimals();
        return TEN**decimals;
    }

    /**
        @notice Returns the value of collateral
        @param loanAmount The total amount of the loan for which collateral is needed
        @param collateralRatio Collateral ratio set in the loan terms
        @return uint256 The amount of collateral needed in lending tokens (not wei)
     */
    function _getCollateralNeededInTokens(uint256 loanAmount, uint256 collateralRatio)
        internal
        pure
        returns (uint256)
    {
        return loanAmount.mul(collateralRatio).div(TEN_THOUSAND);
    }

    /**
        @notice Converts the collateral tokens to lending tokens
        @param weiAmount The amount of wei to be converted
        @return uint256 The value the collateal tokens (wei) in lending tokens (not wei)
     */
    function _convertWeiToToken(uint256 weiAmount) internal view returns (uint256) {
        // wei amount / lending token price in wei * the lending token decimals.
        uint256 aWholeLendingToken = _getAWholeLendingToken();
        uint256 oneLendingTokenPriceWei = uint256(priceOracle.getLatestAnswer());
        uint256 tokenValue = weiAmount.mul(aWholeLendingToken).div(
            oneLendingTokenPriceWei
        );
        return tokenValue;
    }

    /**
        @notice Converts the lending token to collareal tokens
        @param tokenAmount The amount in lending tokens (not wei) to be converted
        @return uint256 The value of lending tokens (not wei) in collateral tokens (wei)
     */
    function _convertTokenToWei(uint256 tokenAmount) internal view returns (uint256) {
        // tokenAmount is in token units, chainlink price is in whole tokens
        // token amount in tokens * lending token price in wei / the lending token decimals.
        uint256 aWholeLendingToken = _getAWholeLendingToken();
        uint256 oneLendingTokenPriceWei = uint256(priceOracle.getLatestAnswer());
        uint256 weiValue = tokenAmount.mul(oneLendingTokenPriceWei).div(
            aWholeLendingToken
        );
        return weiValue;
    }

    /**
        @notice Returns the current loan ID and increments it by 1
        @return uint256 The current loan ID before incrementing
     */
    function getAndIncrementLoanID() internal returns (uint256 newLoanID) {
        newLoanID = loanIDCounter;
        loanIDCounter += 1;
    }

    /**
        @notice Creates a loan with the loan request
        @param loanID The ID of the loan
        @param request Loan request as per the struct of the Teller platform
        @param interestRate Interest rate set in the loan terms
        @param collateralRatio Collateral ratio set in the loan terms
        @param maxLoanAmount Maximum loan amount that can be taken out, set in the loan terms
        @return memory ZeroCollateralCommon.Loan Loan struct as per the Teller platform
     */
    function createLoan(
        uint256 loanID,
        ZeroCollateralCommon.LoanRequest memory request,
        uint256 interestRate,
        uint256 collateralRatio,
        uint256 maxLoanAmount
    ) internal view returns (ZeroCollateralCommon.Loan memory) {
        uint256 termsExpiry = now.add(settings.termsExpiryTime());
        return
            ZeroCollateralCommon.Loan({
                id: loanID,
                loanTerms: ZeroCollateralCommon.LoanTerms({
                    borrower: request.borrower,
                    recipient: request.recipient,
                    interestRate: interestRate,
                    collateralRatio: collateralRatio,
                    maxLoanAmount: maxLoanAmount,
                    duration: request.duration
                }),
                termsExpiry: termsExpiry,
                loanStartTime: 0,
                collateral: 0,
                lastCollateralIn: 0,
                principalOwed: 0,
                interestOwed: 0,
                borrowedAmount: 0,
                status: ZeroCollateralCommon.LoanStatus.TermsSet,
                liquidated: false
            });
    }

    function _emitLoanTermsSetAndCollateralDepositedEventsIfApplicable(
        uint256 loanID,
        ZeroCollateralCommon.LoanRequest memory request,
        uint256 interestRate,
        uint256 collateralRatio,
        uint256 maxLoanAmount,
        uint256 depositedAmount
    ) internal {
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
        if (depositedAmount > 0) {
            emit CollateralDeposited(loanID, request.borrower, depositedAmount);
        }
    }
}
