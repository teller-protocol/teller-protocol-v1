pragma solidity 0.5.17;
pragma experimental ABIEncoderV2;

// Libraries and common
import "@openzeppelin/contracts-ethereum-package/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/ERC20Detailed.sol";
import "../util/TellerCommon.sol";
import "../util/NumbersLib.sol";
import "../util/ERC20DetailedLib.sol";

// Contracts
import "./Base.sol";

// Interfaces
import "../interfaces/LendingPoolInterface.sol";
import "../interfaces/LoanTermsConsensusInterface.sol";
import "../interfaces/LoansInterface.sol";
import "../atm/ATMGovernanceInterface.sol";
import "../interfaces/EscrowInterface.sol";

/*****************************************************************************************************/
/**                                             WARNING                                             **/
/**                              THIS CONTRACT IS AN UPGRADEABLE BASE!                              **/
/**  ---------------------------------------------------------------------------------------------  **/
/**  Do NOT change the order of, PREPEND, or APPEND any storage variables to this or new versions   **/
/**  of this contract as this will cause a ripple affect to the storage slots of all child          **/
/**  contracts that inherit from this contract to be overwritten on the deployed proxy contract!!   **/
/**                                                                                                 **/
/**  Visit https://docs.openzeppelin.com/upgrades/2.6/proxies#upgrading-via-the-proxy-pattern for   **/
/**  more information.                                                                              **/
/*****************************************************************************************************/
/**
    @notice This contract is used as a basis for the creation of the different types of loans across the platform
    @notice It implements the Base contract from Teller and the LoansInterface

    @author develop@teller.finance
 */
contract LoansBase is LoansInterface, Base {
    using AddressLib for address payable;
    using SafeMath for uint256;
    using NumbersLib for uint256;
    using ERC20DetailedLib for ERC20Detailed;

    /* State Variables */

    // Loan length will be inputted in seconds, with 4 decimal places. i.e. 30 days will be inputted as
    // 31536. Therefore in interest calculations we must divide by 31536000
    uint256 internal constant SECONDS_PER_YEAR_4DP = 31536000;

    bytes32 internal constant SUPPLY_TO_DEBT_ATM_SETTING = "SupplyToDebt";

    uint256 public totalCollateral;

    address public collateralToken;

    // At any time, this variable stores the next available loan ID
    uint256 public loanIDCounter;

    LendingPoolInterface public lendingPool;

    LoanTermsConsensusInterface public loanTermsConsensus;

    mapping(address => uint256[]) public borrowerLoans;

    mapping(uint256 => TellerCommon.Loan) public loans;

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
            loans[loanID].status == TellerCommon.LoanStatus.Active,
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
        require(loans[loanID].status == TellerCommon.LoanStatus.TermsSet, "LOAN_NOT_SET");
        _;
    }

    /**
        @notice Checks whether the loan is active and has been set or not
        @dev Throws a require error if the loan is not active or has not been set
        @param loanID number of loan to check
     */
    modifier loanActiveOrSet(uint256 loanID) {
        require(
            loans[loanID].status == TellerCommon.LoanStatus.TermsSet ||
                loans[loanID].status == TellerCommon.LoanStatus.Active,
            "LOAN_NOT_ACTIVE_OR_SET"
        );
        _;
    }

    /**
        @notice Checks the given loan request is valid.
        @dev It throws an require error if the duration exceeds the maximum loan duration.
        @dev It throws an require error if the loan amount exceeds the maximum loan amount for the given asset.
        @param loanRequest to validate.
     */
    modifier withValidLoanRequest(TellerCommon.LoanRequest memory loanRequest) {
        uint256 maxLoanDuration = settings().getPlatformSettingValue(
            settings().consts().MAXIMUM_LOAN_DURATION_SETTING()
        );
        require(maxLoanDuration >= loanRequest.duration, "DURATION_EXCEEDS_MAX_DURATION");

        bool exceedsMaxLoanAmount = settings().exceedsMaxLoanAmount(
            lendingPool.lendingToken(),
            loanRequest.amount
        );
        require(!exceedsMaxLoanAmount, "AMOUNT_EXCEEDS_MAX_AMOUNT");

        require(
            _isSupplyToDebtRatioValid(loanRequest.amount),
            "SUPPLY_TO_DEBT_EXCEEDS_MAX"
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
        @notice Returns the tToken in the lending pool
        @return Address of the tToken
     */
    function tToken() external view returns (address) {
        return lendingPool.tToken();
    }

    /**
        @notice Returns the cToken in the lending pool
        @return Address of the cToken
     */
    function cToken() external view returns (address) {
        return lendingPool.cToken();
    }

    /**
        @notice Checks whether the loan's collateral ratio is considered to be secured based on the settings collateral buffer value.
        @param loanID Id of the loan to check.
        @return bool value of it being secured or not.
    */
    function isLoanSecured(uint256 loanID) external view returns (bool) {
        return _isLoanSecured(loanID);
    }

    /**
        @notice Checks whether a loan is allowed to be deposited to an Externally Owned Account.
        @param loanID Id of the loan to check.
        @return bool indicating whether the loan with specified parameters can be deposited to an EOA.
     */
    function canLoanGoToEOA(uint256 loanID) external view returns (bool) {
        return _canLoanGoToEOA(loans[loanID].loanTerms.collateralRatio);
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

        // Get the current collateral info.
        TellerCommon.LoanCollateralInfo memory collateralInfo = _getCollateralInfo(
            loanID
        );

        // Withdrawal amount holds the amount of excess collateral in the loan
        uint256 withdrawalAmount = collateralInfo.collateral.sub(
            collateralInfo.neededInCollateralTokens
        );
        require(withdrawalAmount >= amount, "COLLATERAL_AMOUNT_TOO_HIGH");

        // Update the contract total and the loan collateral total
        _payOutCollateral(loanID, amount, msg.sender);

        emit CollateralWithdrawn(loanID, msg.sender, amount);
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
            loans[loanID].lastCollateralIn <=
                now.sub(
                    settings().getPlatformSettingValue(
                        settings().consts().SAFETY_INTERVAL_SETTING()
                    )
                ),
            "COLLATERAL_DEPOSITED_RECENTLY"
        );

        loans[loanID].borrowedAmount = amountBorrow;
        loans[loanID].principalOwed = amountBorrow;
        loans[loanID].interestOwed = _getInterestOwed(loanID, amountBorrow);
        loans[loanID].status = TellerCommon.LoanStatus.Active;

        // check that enough collateral has been provided for this loan
        TellerCommon.LoanCollateralInfo memory collateralInfo = _getCollateralInfo(
            loanID
        );

        require(!collateralInfo.moreCollateralRequired, "MORE_COLLATERAL_REQUIRED");

        loans[loanID].loanStartTime = now;

        address loanRecipient;
        bool eoaAllowed = _canLoanGoToEOA(loans[loanID].loanTerms.collateralRatio);
        if (eoaAllowed) {
            loanRecipient = loans[loanID].loanTerms.recipient.isEmpty()
                ? loans[loanID].loanTerms.borrower
                : loans[loanID].loanTerms.recipient;
        } else {
            loans[loanID].escrow = _createEscrow(loanID);
            loanRecipient = loans[loanID].escrow;
        }

        lendingPool.createLoan(amountBorrow, loanRecipient);

        if (!eoaAllowed) {
            loans[loanID].escrow.requireNotEmpty("ESCROW_CONTRACT_NOT_DEFINED");
            EscrowInterface(loans[loanID].escrow).initialize(address(this), loanID);
        }

        emit LoanTakenOut(
            loanID,
            loans[loanID].loanTerms.borrower,
            loans[loanID].escrow,
            amountBorrow
        );
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
        uint256 totalOwed = getTotalOwed(loanID);
        if (totalOwed < toPay) {
            toPay = totalOwed;
        }

        // update the amount owed on the loan
        totalOwed = totalOwed.sub(toPay);
        _payLoan(loanID, toPay);

        // if the loan is now fully paid, close it and return collateral
        if (totalOwed == 0) {
            loans[loanID].status = TellerCommon.LoanStatus.Closed;

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
     * @notice Liquidate a loan if it is expired or under collateralized
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
        TellerCommon.LoanLiquidationInfo memory liquidationInfo = _getLiquidationInfo(
            loanID
        );
        require(liquidationInfo.liquidable, "DOESNT_NEED_LIQUIDATION");

        loans[loanID].status = TellerCommon.LoanStatus.Closed;
        loans[loanID].liquidated = true;

        // the caller gets the collateral from the loan
        _payOutLoan(loanID, liquidationInfo.collateral, msg.sender);

        // the liquidator pays x% of the collateral price
        lendingPool.liquidationPayment(liquidationInfo.amountToLiquidate, msg.sender);

        emit LoanLiquidated(
            loanID,
            loans[loanID].loanTerms.borrower,
            msg.sender,
            liquidationInfo.collateral,
            liquidationInfo.amountToLiquidate
        );
    }

    /**
        @notice It getss the current liquidation info for a given loan id.
        @param loanID loan id to get the info.
        @return liquidationInfo get current liquidation info for the given loan id.
     */
    function getLiquidationInfo(uint256 loanID)
        external
        view
        returns (TellerCommon.LoanLiquidationInfo memory liquidationInfo)
    {
        return _getLiquidationInfo(loanID);
    }

    /**
        @notice A loan can be liquidated if it is: under collateralized or expired
        @param loanID The ID of the loan to check
        @return bool weather the loan can be liquidated
     */
    function canLiquidateLoan(uint256 loanID) public view returns (bool) {
        if (
            _isPaused() ||
            _isPoolPaused(address(lendingPool)) ||
            loans[loanID].status != TellerCommon.LoanStatus.Active
        ) {
            return false;
        }

        uint256 startTime = loans[loanID].loanStartTime;
        uint256 duration = loans[loanID].loanTerms.duration;
        bool isExpired = startTime.add(duration) < now;
        if (isExpired) {
            return true;
        }

        address escrowAddress = loans[loanID].escrow;
        if (escrowAddress != address(0x0)) {
            return EscrowInterface(escrowAddress).isUnderValued();
        }

        return _getCollateralInfo(loanID).moreCollateralRequired;
    }

    /**
        @notice Returns the total owed amount remaining for a specified loan
        @param loanID The ID of the loan to be queried
        @return uint256 The total amount owed remaining
     */
    function getTotalOwed(uint256 loanID) public view returns (uint256) {
        return _getTotalOwed(loanID);
    }

    /**
        @notice Get collateral information of a specific loan
        @param loanID of the loan to get info for
        @return memory TellerCommon.LoanCollateralInfo Collateral information of the loan
     */
    function getCollateralInfo(uint256 loanID)
        external
        view
        returns (TellerCommon.LoanCollateralInfo memory)
    {
        return _getCollateralInfo(loanID);
    }

    /** Internal Functions */

    /**
        @notice Checks whether the loan's collateral ratio is considered to be secured based on the settings collateral buffer value.
        @param loanID Id of the loan to check.
        @return bool value of it being secured or not.
    */
    function _isLoanSecured(uint256 loanID) internal view returns (bool) {
        return
            loans[loanID].loanTerms.collateralRatio >=
            settings().getPlatformSettingValue(
                settings().consts().COLLATERAL_BUFFER_SETTING()
            );
    }

    /**
        @notice Checks whether a loan is allowed to be deposited to an Externally Owned Account.
        @param collateralRatio Collateral ratio required by loan.
        @return bool indicating whether the loan with specified parameters can be deposited to an EOA.
     */
    function _canLoanGoToEOA(uint256 collateralRatio) internal view returns (bool) {
        uint256 overCollateralizedBuffer = settings().getPlatformSettingValue(
            settings().consts().OVER_COLLATERALIZED_BUFFER_SETTING()
        );
        uint256 collateralBuffer = settings().getPlatformSettingValue(
            settings().consts().COLLATERAL_BUFFER_SETTING()
        );
        uint256 liquidationReward = settings().consts().ONE_HUNDRED_PERCENT().sub(
            settings().getPlatformSettingValue(
                settings().consts().LIQUIDATE_ETH_PRICE_SETTING()
            )
        );

        return
            collateralRatio >=
            overCollateralizedBuffer.add(collateralBuffer).add(liquidationReward);
    }

    /**
        @notice Checks if the loan has an Escrow and claims any tokens then pays out the loan collateral.
        @dev See Escrow.claimTokens for more info.
    */
    function _payOutLoan(
        uint256 loanID,
        uint256 amount,
        address payable recipient
    ) internal {
        if (loans[loanID].escrow != address(0x0)) {
            EscrowInterface(loans[loanID].escrow).claimTokens(recipient);
        }

        _payOutCollateral(loanID, amount, recipient);
    }

    /**
        @notice Pays out the collateral for a loan
        @param loanID ID of loan from which collateral is to be paid out
        @param amount Amount of collateral paid out
        @param recipient Account address of the recipient of the collateral
     */
    function _payOutCollateral(
        uint256 loanID,
        uint256 amount,
        address payable recipient
    ) internal;

    /**
        @notice Get collateral information of a specific loan
        @param loanID of the loan to get info for
        @return memory TellerCommon.LoanCollateralInfo Collateral information of the loan
     */
    function _getCollateralInfo(uint256 loanID)
        internal
        view
        returns (TellerCommon.LoanCollateralInfo memory)
    {
        uint256 collateral = loans[loanID].collateral;
        (uint256 neededInLending, uint256 neededInCollateral) = _getCollateralNeededInfo(
            loanID
        );
        return
            TellerCommon.LoanCollateralInfo({
                collateral: collateral,
                neededInLendingTokens: neededInLending,
                neededInCollateralTokens: neededInCollateral,
                moreCollateralRequired: neededInCollateral > collateral
            });
    }

    /**
        @notice Get information on the collateral needed for the loan
        @param loanID The loan ID to get collateral info for
        @return uint256 Collateral needed in Lending tokens
        @return uint256 Collateral needed in Collateral tokens (wei)
     */
    function _getCollateralNeededInfo(uint256 loanID)
        internal
        view
        returns (uint256 neededInLendingTokens, uint256 neededInCollateralTokens)
    {
        // Get collateral needed in lending tokens.
        neededInLendingTokens = _getCollateralNeededInTokens(loanID);
        neededInCollateralTokens = settings().chainlinkAggregator().valueFor(
            lendingPool.lendingToken(),
            collateralToken,
            neededInLendingTokens
        );
    }

    /**
        @notice Initializes the current contract instance setting the required parameters.
        @param lendingPoolAddress Contract address of the lending pool
        @param loanTermsConsensusAddress Contract address for loan term consensus
        @param settingsAddress Contract address for the configuration of the platform
     */
    function _initialize(
        address lendingPoolAddress,
        address loanTermsConsensusAddress,
        address settingsAddress
    ) internal isNotInitialized() {
        lendingPoolAddress.requireNotEmpty("PROVIDE_LENDING_POOL_ADDRESS");
        loanTermsConsensusAddress.requireNotEmpty("PROVIDED_LOAN_TERMS_ADDRESS");

        _initialize(settingsAddress);

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
        @notice Make a payment towards the principal and interest for a specified loan
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
        @notice Returns the value of collateral
        @param loanID The loan ID to get collateral info for
        @return uint256 The amount of collateral needed in lending tokens (not wei)
     */
    function _getCollateralNeededInTokens(uint256 loanID)
        internal
        view
        returns (uint256)
    {
        uint256 loanAmount = _getTotalOwed(loanID);
        uint256 collateralRatio = loans[loanID].loanTerms.collateralRatio;
        return loanAmount.percent(collateralRatio);
    }

    /**
        @notice Returns the total amount owed for a specified loan
        @param loanID The id of the loan to get the total amount owed
     */
    function _getTotalOwed(uint256 loanID) internal view returns (uint256) {
        TellerCommon.LoanStatus currentStatus = loans[loanID].status;
        if (currentStatus == TellerCommon.LoanStatus.TermsSet) {
            uint256 interestOwed = _getInterestOwed(
                loanID,
                loans[loanID].loanTerms.maxLoanAmount
            );
            return loans[loanID].loanTerms.maxLoanAmount.add(interestOwed);
        } else if (currentStatus == TellerCommon.LoanStatus.Active) {
            return loans[loanID].principalOwed.add(loans[loanID].interestOwed);
        } else {
            return 0;
        }
    }

    /**
        @notice Returns the amount of interest owed for a given loan and loan amount
        @param loanID The id of the loan to get the owed interest
        @param amountBorrow The principal of the loan to take out
     */
    function _getInterestOwed(uint256 loanID, uint256 amountBorrow)
        internal
        view
        returns (uint256)
    {
        return 
            amountBorrow
                .percent(loans[loanID].loanTerms.interestRate)
                .mul(loans[loanID].loanTerms.duration)
                .div(SECONDS_PER_YEAR_4DP);
    }

    /**
        @notice It gets the current liquidation info for a given loan id.
        @param loanID loan id to get the info.
        @return liquidationInfo get current liquidation info for the given loan id.
     */
    function _getLiquidationInfo(uint256 loanID)
        internal
        view
        returns (TellerCommon.LoanLiquidationInfo memory liquidationInfo)
    {
        uint256 collateral = loans[loanID].collateral;
        uint256 liquidateEthPrice = settings().getPlatformSettingValue(
            settings().consts().LIQUIDATE_ETH_PRICE_SETTING()
        );
        uint256 collateralInTokens = settings().chainlinkAggregator().valueFor(
            collateralToken,
            lendingPool.lendingToken(),
            collateral
        );
        liquidationInfo = TellerCommon.LoanLiquidationInfo({
            liquidable: canLiquidateLoan(loanID),
            collateral: collateral,
            collateralInTokens: collateralInTokens,
            amountToLiquidate: collateralInTokens.percent(liquidateEthPrice)
        });
    }

    /**
        @notice Returns the current loan ID and increments it by 1
        @return uint256 The current loan ID before incrementing
     */
    function _getAndIncrementLoanID() internal returns (uint256 newLoanID) {
        newLoanID = loanIDCounter;
        loanIDCounter = loanIDCounter.add(1);
    }

    /**
        @notice Creates a loan with the loan request
        @param loanID The ID of the loan
        @param request Loan request as per the struct of the Teller platform
        @param interestRate Interest rate set in the loan terms
        @param collateralRatio Collateral ratio set in the loan terms
        @param maxLoanAmount Maximum loan amount that can be taken out, set in the loan terms
        @return memory TellerCommon.Loan Loan struct as per the Teller platform
     */
    function _createLoan(
        uint256 loanID,
        TellerCommon.LoanRequest memory request,
        uint256 interestRate,
        uint256 collateralRatio,
        uint256 maxLoanAmount
    ) internal view returns (TellerCommon.Loan memory loan) {
        request.borrower.requireNotEmpty("BORROWER_EMPTY");
        if (request.recipient.isNotEmpty()) {
            require(_canLoanGoToEOA(collateralRatio), "UNDER_COLL_WITH_RECIPIENT");
        }

        uint256 termsExpiryTime = settings().getPlatformSettingValue(
            settings().consts().TERMS_EXPIRY_TIME_SETTING()
        );
        uint256 termsExpiry = now.add(termsExpiryTime);
        return
            TellerCommon.Loan({
                id: loanID,
                loanTerms: TellerCommon.LoanTerms({
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
                escrow: address(0x0),
                status: TellerCommon.LoanStatus.TermsSet,
                liquidated: false
            });
    }

    function _emitLoanTermsSetAndCollateralDepositedEventsIfApplicable(
        uint256 loanID,
        TellerCommon.LoanRequest memory request,
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

    /**
        @notice It validates whether supply to debt (StD) ratio is valid including the loan amount.
        @param newLoanAmount the new loan amount to consider o the StD ratio.
        @return true if the ratio is valid. Otherwise it returns false.
     */
    function _isSupplyToDebtRatioValid(uint256 newLoanAmount)
        internal
        view
        returns (bool)
    {
        address atmAddressForMarket = settings().atmSettings().getATMForMarket(
            lendingPool.lendingToken(),
            collateralToken
        );
        require(atmAddressForMarket != address(0x0), "ATM_NOT_FOUND_FOR_MARKET");
        uint256 supplyToDebtMarketLimit = ATMGovernanceInterface(atmAddressForMarket)
            .getGeneralSetting(SUPPLY_TO_DEBT_ATM_SETTING);
        uint256 currentSupplyToDebtMarket = _markets().getSupplyToDebtFor(
            lendingPool.lendingToken(),
            collateralToken,
            newLoanAmount
        );
        return currentSupplyToDebtMarket <= supplyToDebtMarketLimit;
    }

    /**
        @notice It creates an Escrow contract instance for a given loan id.
        @param loanID loan id associated to the Escrow contract.
        @return the new Escrow contract address.
     */
    function _createEscrow(uint256 loanID) internal returns (address) {
        return settings().escrowFactory().createEscrow(address(this), loanID);
    }
}
