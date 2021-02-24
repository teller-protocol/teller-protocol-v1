pragma solidity 0.5.17;
pragma experimental ABIEncoderV2;

// Libraries and common
import "@openzeppelin/contracts-ethereum-package/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/SafeERC20.sol";
import "../util/TellerCommon.sol";
import "../util/NumbersLib.sol";
import "../util/LoanLib.sol";

// Contracts
import "./Base.sol";

// Interfaces
import "../interfaces/LendingPoolInterface.sol";
import "../interfaces/LoanTermsConsensusInterface.sol";
import "../interfaces/LoansInterface.sol";
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
contract Loans is LoansInterface, Base {
    using SafeMath for uint256;
    using SafeERC20 for ERC20Detailed;
    using NumbersLib for uint256;
    using NumbersLib for int256;
    using LoanLib for TellerCommon.Loan;

    /* State Variables */

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
        require(
            loans[loanID].status == TellerCommon.LoanStatus.TermsSet,
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
        require(loans[loanID].isActiveOrSet(), "LOAN_NOT_ACTIVE_OR_SET");
        _;
    }

    /**
        @notice Checks the given loan request is valid.
        @dev It throws an require error if the duration exceeds the maximum loan duration.
        @dev It throws an require error if the loan amount exceeds the maximum loan amount for the given asset.
        @param loanRequest to validate.
     */
    modifier withValidLoanRequest(TellerCommon.LoanRequest memory loanRequest) {
        uint256 maxLoanDuration =
            _getSettings().getPlatformSettingValue(
                _getSettings().consts().MAXIMUM_LOAN_DURATION_SETTING()
            );
        require(
            maxLoanDuration >= loanRequest.duration,
            "DURATION_EXCEEDS_MAX_DURATION"
        );

        bool exceedsMaxLoanAmount =
            _getSettings().assetSettings().exceedsMaxLoanAmount(
                address(lendingPool.lendingToken()),
                loanRequest.amount
            );
        require(!exceedsMaxLoanAmount, "AMOUNT_EXCEEDS_MAX_AMOUNT");

        require(
            _isDebtRatioValid(loanRequest.amount),
            "SUPPLY_TO_DEBT_EXCEEDS_MAX"
        );
        _;
    }

    /**
        @notice Get a list of all loans for a borrower
        @param borrower The borrower's address
     */
    function getBorrowerLoans(address borrower)
        external
        view
        returns (uint256[] memory)
    {
        return borrowerLoans[borrower];
    }

    /**
        @notice Returns the lending token in the lending pool
        @return Address of the lending token
     */
    function lendingToken() external view returns (address) {
        return address(lendingPool.lendingToken());
    }

    /**
        @notice Returns the tToken in the lending pool
        @return Address of the tToken
     */
    function tToken() external view returns (TToken) {
        return lendingPool.tToken();
    }

    /**
        @notice Returns the cToken in the lending pool
        @return Address of the cToken
     */
    function cToken() external view returns (address) {
        return lendingPool.cToken();
    }

    // See more details LoanLib.isSecured
    function isLoanSecured(uint256 loanID) external view returns (bool) {
        return loans[loanID].isSecured(_getSettings());
    }

    // See more details in LoanLib.canGoToEOA
    function canLoanGoToEOA(uint256 loanID) external view returns (bool) {
        return loans[loanID].canGoToEOA(_getSettings());
    }

    // See more details LoanLib.getTotalOwed
    function getTotalOwed(uint256 loanID) external view returns (uint256) {
        return loans[loanID].getTotalOwed();
    }

    // See more details LoanLib.getCollateralInfo
    function getCollateralInfo(uint256 loanID)
        external
        view
        returns (TellerCommon.LoanCollateralInfo memory)
    {
        return _getCollateralInfo(loanID);
    }

    // See more details LoanLib.getLiquidationInfo
    function getLiquidationInfo(uint256 loanID)
        external
        view
        returns (TellerCommon.LoanLiquidationInfo memory)
    {
        return _getLiquidationInfo(loanID);
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
        isInitialized()
        whenNotPaused()
        isBorrower(request.borrower)
        withValidLoanRequest(request)
    {
        uint256 loanID = _getAndIncrementLoanID();
        if (collateralAmount > 0) {
            _payInCollateral(loanID, collateralAmount);
        }

        (uint256 interestRate, uint256 collateralRatio, uint256 maxLoanAmount) =
            loanTermsConsensus.processRequest(request, responses);

        loans[loanID].init(
            request,
            _getSettings(),
            loanID,
            interestRate,
            collateralRatio,
            maxLoanAmount
        );

        if (request.recipient.isNotEmpty()) {
            require(
                loans[loanID].canGoToEOA(_getSettings()),
                "UNDER_COLL_WITH_RECIPIENT"
            );
        }

        borrowerLoans[request.borrower].push(loanID);

        emit LoanTermsSet(
            loanID,
            msg.sender,
            loans[loanID].loanTerms.recipient,
            interestRate,
            collateralRatio,
            maxLoanAmount,
            loans[loanID].loanTerms.duration,
            loans[loanID].termsExpiry
        );
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
    {
        require(
            msg.sender == loans[loanID].loanTerms.borrower,
            "CALLER_DOESNT_OWN_LOAN"
        );
        require(amount > 0, "CANNOT_WITHDRAW_ZERO");
        (, int256 neededInCollateralTokens, ) =
            _getCollateralNeededInfo(loanID);
        _withdrawCollateral(amount, loanID, neededInCollateralTokens);
    }

    function _withdrawCollateral(
        uint256 amount,
        uint256 loanID,
        int256 neededInCollateralTokens
    ) private nonReentrant() {
        if (loans[loanID].status == TellerCommon.LoanStatus.Active) {
            if (neededInCollateralTokens > 0) {
                // Withdrawal amount holds the amount of excess collateral in the loan
                uint256 withdrawalAmount =
                    loans[loanID].collateral.sub(
                        uint256(neededInCollateralTokens)
                    );
                require(
                    withdrawalAmount >= amount,
                    "COLLATERAL_AMOUNT_TOO_HIGH"
                );
            }
        } else {
            require(
                loans[loanID].collateral >= amount,
                "COLLATERAL_AMOUNT_NOT_MATCH"
            );
        }

        // Update the contract total and the loan collateral total
        _payOutCollateral(loanID, amount, msg.sender);

        emit CollateralWithdrawn(loanID, msg.sender, amount);
    }

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
        require(_isDebtRatioValid(amountBorrow), "SUPPLY_TO_DEBT_EXCEEDS_MAX");
        require(
            loans[loanID].loanTerms.maxLoanAmount >= amountBorrow,
            "MAX_LOAN_EXCEEDED"
        );

        require(loans[loanID].termsExpiry >= now, "LOAN_TERMS_EXPIRED");

        require(
            loans[loanID].lastCollateralIn <=
                now.sub(
                    _getSettings().getPlatformSettingValue(
                        _getSettings().consts().SAFETY_INTERVAL_SETTING()
                    )
                ),
            "COLLATERAL_DEPOSITED_RECENTLY"
        );

        loans[loanID].borrowedAmount = amountBorrow;
        loans[loanID].principalOwed = amountBorrow;
        loans[loanID].interestOwed = loans[loanID].getInterestOwedFor(
            amountBorrow
        );
        loans[loanID].status = TellerCommon.LoanStatus.Active;

        // check that enough collateral has been provided for this loan
        TellerCommon.LoanCollateralInfo memory collateralInfo =
            _getCollateralInfo(loanID);
        require(
            !collateralInfo.moreCollateralRequired,
            "MORE_COLLATERAL_REQUIRED"
        );

        loans[loanID].loanStartTime = now;

        address loanRecipient;
        bool eoaAllowed = loans[loanID].canGoToEOA(_getSettings());
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
            EscrowInterface(loans[loanID].escrow).initialize(
                address(this),
                loanID
            );
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
        uint256 totalOwed = loans[loanID].getTotalOwed();
        if (totalOwed < toPay) {
            toPay = totalOwed;
        }

        // update the amount owed on the loan
        totalOwed = totalOwed.sub(toPay);
        (uint256 principalAmount, uint256 interestAmount) =
            loans[loanID].payOff(toPay);

        // if the loan is now fully paid, close it and return collateral
        if (totalOwed == 0) {
            loans[loanID].status = TellerCommon.LoanStatus.Closed;

            uint256 collateralAmount = loans[loanID].collateral;
            _payOutCollateral(
                loanID,
                collateralAmount,
                loans[loanID].loanTerms.borrower
            );

            emit CollateralWithdrawn(
                loanID,
                loans[loanID].loanTerms.borrower,
                collateralAmount
            );
        }

        // collect the money from the payer
        lendingPool.repay(principalAmount, interestAmount, msg.sender);

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
        TellerCommon.LoanLiquidationInfo memory liquidationInfo =
            _getLiquidationInfo(loanID);
        require(liquidationInfo.liquidable, "DOESNT_NEED_LIQUIDATION");

        // the liquidator pays the amount still owed on the loan
        lendingPool.repay(
            loans[loanID].principalOwed,
            loans[loanID].interestOwed,
            msg.sender
        );

        loans[loanID].status = TellerCommon.LoanStatus.Closed;
        loans[loanID].liquidated = true;

        // the caller gets the collateral from the loan
        _payOutLiquidator(loanID, liquidationInfo, msg.sender);

        emit LoanLiquidated(
            loanID,
            loans[loanID].loanTerms.borrower,
            msg.sender,
            liquidationInfo.collateralInfo.collateral,
            liquidationInfo.amountToLiquidate
        );
    }

    /** Internal Functions */

    // See LoanLib.getCollateralInfo
    function _getCollateralInfo(uint256 loanID)
        internal
        view
        returns (TellerCommon.LoanCollateralInfo memory)
    {
        return loans[loanID].getCollateralInfo(this);
    }

    // See LoanLib.getCollateralNeededInfo
    function _getCollateralNeededInfo(uint256 loanID)
        internal
        view
        returns (
            int256 neededInLendingTokens,
            int256 neededInCollateralTokens,
            uint256 escrowLoanValue
        )
    {
        return loans[loanID].getCollateralNeededInfo(this);
    }

    // See LoanLib.getLiquidationInfo
    function _getLiquidationInfo(uint256 loanID)
        internal
        view
        returns (TellerCommon.LoanLiquidationInfo memory liquidationInfo)
    {
        return loans[loanID].getLiquidationInfo(this);
    }

    /**
        @notice Checks if the loan has an Escrow and claims any tokens then pays out the loan collateral.
        @dev See Escrow.claimTokens for more info.
        @param loanID The ID of the loan which is being liquidated
        @param liquidationInfo The Teller common liquidation struct that holds all the relevant liquidation info,
        such as the liquidation info
        @param recipient The address of the liquidator where the liquidation reward will be sent to
    */
    function _payOutLiquidator(
        uint256 loanID,
        TellerCommon.LoanLiquidationInfo memory liquidationInfo,
        address payable recipient
    ) internal {
        if (liquidationInfo.rewardInCollateral <= 0) {
            return;
        }
        uint256 reward = uint256(liquidationInfo.rewardInCollateral);
        if (reward < loans[loanID].collateral) {
            _payOutCollateral(loanID, reward, recipient);
        } else if (reward >= loans[loanID].collateral) {
            uint256 remainingCollateralAmount =
                reward.sub(loans[loanID].collateral);
            _payOutCollateral(loanID, loans[loanID].collateral, recipient);
            if (
                remainingCollateralAmount > 0 &&
                loans[loanID].escrow != address(0x0)
            ) {
                EscrowInterface(loans[loanID].escrow)
                    .claimTokensByCollateralValue(
                    recipient,
                    remainingCollateralAmount
                );
            }
        }
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
        loanTermsConsensusAddress.requireNotEmpty(
            "PROVIDED_LOAN_TERMS_ADDRESS"
        );

        _initialize(settingsAddress);

        lendingPool = LendingPoolInterface(lendingPoolAddress);
        loanTermsConsensus = LoanTermsConsensusInterface(
            loanTermsConsensusAddress
        );
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
        emit CollateralDeposited(loanID, msg.sender, amount);
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
        @notice It validates whether supply to debt (StD) ratio is valid including the loan amount.
        @param newLoanAmount the new loan amount to consider o the StD ratio.
        @return true if the ratio is valid. Otherwise it returns false.
     */
    function _isDebtRatioValid(uint256 newLoanAmount)
        internal
        view
        returns (bool)
    {
        uint256 maxDebtRatio =
            _getSettings().assetSettings().getMaxDebtRatio(
                address(lendingPool.lendingToken())
            );
        uint256 currentDebtRatio = lendingPool.getDebtRatioFor(newLoanAmount);
        return currentDebtRatio <= maxDebtRatio;
    }

    /**
        @notice It creates an Escrow contract instance for a given loan id.
        @param loanID loan id associated to the Escrow contract.
        @return the new Escrow contract address.
     */
    function _createEscrow(uint256 loanID) internal returns (address) {
        return
            _getSettings().escrowFactory().createEscrow(address(this), loanID);
    }
}
