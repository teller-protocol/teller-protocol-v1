pragma solidity 0.5.17;
pragma experimental ABIEncoderV2;

// Libraries and common
import "@openzeppelin/contracts-ethereum-package/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/SafeERC20.sol";
import "../../util/TellerCommon.sol";
import "../../util/NumbersLib.sol";

// Contracts
import "@openzeppelin/contracts-ethereum-package/contracts/utils/ReentrancyGuard.sol";
import "../Base.sol";
import "./LoanStorage.sol";
import "./../proxies/DynamicProxy.sol";

// Interfaces
import "../../interfaces/loans/ILoanManager.sol";
import "../../interfaces/loans/ILoanStorage.sol";
import "../../interfaces/LendingPoolInterface.sol";
import "../../interfaces/LoanTermsConsensusInterface.sol";
import "../../interfaces/escrow/IEscrow.sol";
import "../../interfaces/IEscrowDynamicProxy.sol";

/*****************************************************************************************************/
/**                                             WARNING                                             **/
/**                              THIS CONTRACT IS AN UPGRADEABLE FACET!                             **/
/**  ---------------------------------------------------------------------------------------------  **/
/**  Do NOT place ANY storage/state variables directly in this contract! If you wish to make        **/
/**  make changes to the state variables used by this contract, do so in its defined Storage        **/
/**  contract that this contract inherits from                                                      **/
/**                                                                                                 **/
/**  Visit https://docs.openzeppelin.com/upgrades/2.6/proxies#upgrading-via-the-proxy-pattern for   **/
/**  more information.                                                                              **/
/*****************************************************************************************************/
/**
 * @notice This contract is used as a basis for the creation of the different types of loans across the platform
 * @notice It implements the Base contract from Teller and the ILoanManager
 *
 * @author develop@teller.finance
 */
contract LoanManager is ILoanManager, Base, LoanStorage {
    using SafeMath for uint256;
    using SafeERC20 for ERC20Detailed;
    using NumbersLib for uint256;
    using NumbersLib for int256;

    /* Modifiers */

    /**
     * @notice Checks whether the loan is active or not
     * @dev Throws a require error if the loan is not active
     * @param loanID number of loan to check
     */
    modifier loanActive(uint256 loanID) {
        require(
            loans[loanID].status == TellerCommon.LoanStatus.Active,
            "LOAN_NOT_ACTIVE"
        );
        _;
    }

    /**
     * @notice Checks whether the loan is active and has been set or not
     * @dev Throws a require error if the loan is not active or has not been set
     * @param loanID number of loan to check
     */
    modifier loanActiveOrSet(uint256 loanID) {
        require(isActiveOrSet(loanID), "LOAN_NOT_ACTIVE_OR_SET");
        _;
    }

    /**
     * @notice Checks the given loan request is valid.
     * @dev It throws an require error if the duration exceeds the maximum loan duration.
     * @dev It throws an require error if the loan amount exceeds the maximum loan amount for the given asset.
     * @param loanRequest to validate.
     */
    modifier withValidLoanRequest(TellerCommon.LoanRequest memory loanRequest) {
        uint256 maxLoanDuration = settings.getMaximumLoanDurationValue();
        require(
            maxLoanDuration >= loanRequest.duration,
            "DURATION_EXCEEDS_MAX_DURATION"
        );

        bool exceedsMaxLoanAmount =
            settings.assetSettings().exceedsMaxLoanAmount(
                lendingToken,
                loanRequest.amount
            );
        require(!exceedsMaxLoanAmount, "AMOUNT_EXCEEDS_MAX_AMOUNT");

        require(
            _isDebtRatioValid(loanRequest.amount),
            "SUPPLY_TO_DEBT_EXCEEDS_MAX"
        );
        _;
    }

    /* Public Functions */

    /**
     * @notice See LoanData.getBorrowerLoans
     */
    function getBorrowerLoans(address borrower)
        public
        view
        returns (uint256[] memory)
    {
        return borrowerLoans[borrower];
    }

    /**
     * @notice See LoanData.isActiveOrSet
     */
    function isActiveOrSet(uint256 loanID) public view returns (bool) {
        bytes memory data =
            _delegateViewLoanData(
                abi.encodeWithSignature("isActiveOrSet(uint256)", loanID)
            );
        return abi.decode(data, (bool));
    }

    /**
     * @notice See LoanData.getTotalOwed
     */
    function getTotalOwed(uint256 loanID) public view returns (uint256) {
        bytes memory data =
            _delegateViewLoanData(
                abi.encodeWithSignature("getTotalOwed(uint256)", loanID)
            );
        return abi.decode(data, (uint256));
    }

    /**
     * @notice See LoanData.getLoanAmount
     */
    function getLoanAmount(uint256 loanID) public view returns (uint256) {
        bytes memory data =
            _delegateViewLoanData(
                abi.encodeWithSignature("getLoanAmount(uint256)", loanID)
            );
        return abi.decode(data, (uint256));
    }

    /**
     * @notice See LoanData.isLoanSecured
     */
    function isLoanSecured(uint256 loanID) public view returns (bool) {
        bytes memory data =
            _delegateViewLoanData(
                abi.encodeWithSignature("isLoanSecured(uint256)", loanID)
            );
        return abi.decode(data, (bool));
    }

    /**
     * @notice See LoanData.canGoToEOA
     */
    function canGoToEOA(uint256 loanID) public view returns (bool) {
        bytes memory data =
            _delegateViewLoanData(
                abi.encodeWithSignature("canGoToEOA(uint256)", loanID)
            );
        return abi.decode(data, (bool));
    }

    /**
     * @notice See LoanData.getInterestOwedFor
     */
    function getInterestOwedFor(uint256 loanID, uint256 amountBorrow)
        public
        view
        returns (uint256)
    {
        bytes memory data =
            _delegateViewLoanData(
                abi.encodeWithSignature(
                    "getInterestOwedFor(uint256,uint256)",
                    loanID,
                    amountBorrow
                )
            );
        return abi.decode(data, (uint256));
    }

    /**
     * @notice See LoanData.getInterestRatio
     */
    function getInterestRatio(uint256 loanID) public view returns (uint256) {
        bytes memory data =
            _delegateViewLoanData(
                abi.encodeWithSignature("getInterestRatio(uint256)", loanID)
            );
        return abi.decode(data, (uint256));
    }

    /**
     * @notice See LoanData.getCollateralInLendingTokens
     */
    function getCollateralInLendingTokens(uint256 loanID)
        public
        view
        returns (uint256)
    {
        bytes memory data =
            _delegateViewLoanData(
                abi.encodeWithSignature(
                    "getCollateralInLendingTokens(uint256)",
                    loanID
                )
            );
        return abi.decode(data, (uint256));
    }

    /**
     * @notice See LoanData.getCollateralNeededInfo
     */
    function getCollateralNeededInfo(uint256 loanID)
        public
        view
        returns (
            int256,
            int256,
            uint256
        )
    {
        bytes memory data =
            _delegateViewLoanData(
                abi.encodeWithSignature(
                    "getCollateralNeededInfo(uint256)",
                    loanID
                )
            );
        return abi.decode(data, (int256, int256, uint256));
    }

    /**
     * @notice See LoanData.getCollateralNeededInTokens
     */
    function getCollateralNeededInTokens(uint256 loanID)
        public
        view
        returns (int256, uint256)
    {
        bytes memory data =
            _delegateViewLoanData(
                abi.encodeWithSignature(
                    "getCollateralNeededInTokens(uint256)",
                    loanID
                )
            );
        return abi.decode(data, (int256, uint256));
    }

    /**
     * @notice See LoanData.isLiquidable
     */
    function isLiquidable(uint256 loanID) public view returns (bool) {
        bytes memory data =
            _delegateViewLoanData(
                abi.encodeWithSignature("isLiquidable(uint256)", loanID)
            );
        return abi.decode(data, (bool));
    }

    /**
     * @notice See LoanData.getLiquidationReward
     */
    function getLiquidationReward(uint256 loanID) public view returns (int256) {
        bytes memory data =
            _delegateViewLoanData(
                abi.encodeWithSignature("getLiquidationReward(uint256)", loanID)
            );
        return abi.decode(data, (int256));
    }

    /* External Functions */

    /**
     * @notice Creates a loan with the loan request and terms
     * @param request Struct of the protocol loan request
     * @param responses List of structs of the protocol loan responses
     * @param collateralAmount Amount of collateral required for the loan
     */
    function createLoanWithTerms(
        TellerCommon.LoanRequest calldata request,
        TellerCommon.LoanResponse[] calldata responses,
        uint256 collateralAmount
    )
        external
        payable
        whenNotPaused
        withValidLoanRequest(request)
        onlyAuthorized
    {
        require(msg.sender == request.borrower, "NOT_LOAN_REQUESTER");

        (uint256 interestRate, uint256 collateralRatio, uint256 maxLoanAmount) =
            loanTermsConsensus.processRequest(request, responses);

        uint256 loanID =
            _createNewLoan(
                request,
                interestRate,
                collateralRatio,
                maxLoanAmount
            );

        if (collateralAmount > 0) {
            _payInCollateral(loanID, collateralAmount);
        }

        if (request.recipient.isNotEmpty()) {
            require(canGoToEOA(loanID), "UNDER_COLL_WITH_RECIPIENT");
        }

        borrowerLoans[request.borrower].push(loanID);

        emit LoanTermsSet(
            loanID,
            msg.sender,
            loans[loanID].loanTerms.recipient
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
        whenNotPaused
        whenLendingPoolNotPaused(address(lendingPool))
        onlyAuthorized
    {
        require(
            msg.sender == loans[loanID].loanTerms.borrower,
            "CALLER_DOESNT_OWN_LOAN"
        );
        require(amount > 0, "CANNOT_WITHDRAW_ZERO");
        (, int256 neededInCollateralTokens, ) = getCollateralNeededInfo(loanID);
        _withdrawCollateral(amount, loanID, neededInCollateralTokens);
    }

    function _withdrawCollateral(
        uint256 amount,
        uint256 loanID,
        int256 neededInCollateralTokens
    ) private {
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
        whenNotPaused
        whenLendingPoolNotPaused(address(lendingPool))
        onlyAuthorized
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
        whenNotPaused
        whenLendingPoolNotPaused(address(lendingPool))
        onlyAuthorized
    {
        require(msg.sender == loans[loanID].loanTerms.borrower, "NOT_BORROWER");
        require(
            loans[loanID].status == TellerCommon.LoanStatus.TermsSet,
            "LOAN_NOT_SET"
        );
        require(loans[loanID].termsExpiry >= now, "LOAN_TERMS_EXPIRED");
        require(_isDebtRatioValid(amountBorrow), "SUPPLY_TO_DEBT_EXCEEDS_MAX");
        require(
            loans[loanID].loanTerms.maxLoanAmount >= amountBorrow,
            "MAX_LOAN_EXCEEDED"
        );
        // check that enough collateral has been provided for this loan
        (, int256 neededInCollateral, ) = getCollateralNeededInfo(loanID);
        require(
            neededInCollateral <= int256(loans[loanID].collateral),
            "MORE_COLLATERAL_REQUIRED"
        );
        require(
            loans[loanID].lastCollateralIn <=
                now.sub(settings.getSafetyIntervalValue()),
            "COLLATERAL_DEPOSITED_RECENTLY"
        );

        loans[loanID].borrowedAmount = amountBorrow;
        loans[loanID].principalOwed = amountBorrow;
        loans[loanID].interestOwed = getInterestOwedFor(loanID, amountBorrow);
        loans[loanID].status = TellerCommon.LoanStatus.Active;
        loans[loanID].loanStartTime = now;

        address loanRecipient;
        bool eoaAllowed = canGoToEOA(loanID);
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
            IEscrow(loans[loanID].escrow).initialize(
                address(settings),
                address(lendingPool),
                loanID,
                lendingToken,
                loans[loanID].loanTerms.borrower
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
        whenNotPaused
        whenLendingPoolNotPaused(address(lendingPool))
        onlyAuthorized
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

        // Deduct the interest and principal owed
        uint256 principalPaid;
        uint256 interestPaid;
        if (toPay < loans[loanID].interestOwed) {
            interestPaid = toPay;
            loans[loanID].interestOwed = loans[loanID].interestOwed.sub(toPay);
        } else {
            if (loans[loanID].interestOwed > 0) {
                interestPaid = loans[loanID].interestOwed;
                toPay = toPay.sub(interestPaid);
                loans[loanID].interestOwed = 0;
            }

            if (toPay > 0) {
                principalPaid = toPay;
                loans[loanID].principalOwed = loans[loanID].principalOwed.sub(
                    toPay
                );
            }
        }

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
        lendingPool.repay(principalPaid, interestPaid, msg.sender);

        emit LoanRepaid(
            loanID,
            loans[loanID].loanTerms.borrower,
            principalPaid.add(interestPaid),
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
        whenNotPaused
        whenLendingPoolNotPaused(address(lendingPool))
    {
        require(isLiquidable(loanID), "DOESNT_NEED_LIQUIDATION");

        int256 rewardInCollateral = getLiquidationReward(loanID);

        // the liquidator pays the amount still owed on the loan
        uint256 amountToLiquidate =
            loans[loanID].principalOwed.add(loans[loanID].interestOwed);
        lendingPool.repay(
            loans[loanID].principalOwed,
            loans[loanID].interestOwed,
            msg.sender
        );

        loans[loanID].status = TellerCommon.LoanStatus.Closed;
        loans[loanID].liquidated = true;

        // the caller gets the collateral from the loan
        _payOutLiquidator(loanID, rewardInCollateral, msg.sender);

        emit LoanLiquidated(
            loanID,
            loans[loanID].loanTerms.borrower,
            msg.sender,
            rewardInCollateral,
            amountToLiquidate
        );
    }

    /**
     *  @notice It calls the LogicVersionRegistry to update the stored logic address for LoanData.
     */
    function updateLoanDataLogic() public {
        (, , loanData) = logicRegistry.getLogicVersion(LOAN_DATA_LOGIC_NAME);
    }

    /**
     * @notice Initializes the current contract instance setting the required parameters.
     * @param lendingPoolAddress Address of the LendingPool.
     * @param loanTermsConsensusAddress Address for LoanTermConsensus contract.
     * @param settingsAddress Address for the platform Settings contract.
     * @param collateralTokenAddress Address of the collateral token for loans in this contract.
     * @param escrowProxyLogicAddress e
     */
    function initialize(
        address lendingPoolAddress,
        address loanTermsConsensusAddress,
        address settingsAddress,
        address collateralTokenAddress,
        address escrowProxyLogicAddress
    ) external {
        lendingPoolAddress.requireNotEmpty("PROVIDE_LENDING_POOL_ADDRESS");
        loanTermsConsensusAddress.requireNotEmpty(
            "PROVIDED_LOAN_TERMS_ADDRESS"
        );

        _initialize(settingsAddress);

        lendingPool = LendingPoolInterface(lendingPoolAddress);
        lendingToken = address(lendingPool.lendingToken());
        cToken = CErc20Interface(lendingPool.cToken());
        loanTermsConsensus = LoanTermsConsensusInterface(
            loanTermsConsensusAddress
        );
        escrowProxyLogic = escrowProxyLogicAddress;

        // ETH is the only collateral token allowed currently
        collateralToken = settings.ETH_ADDRESS();

        updateLoanDataLogic();
    }

    /** Internal Functions */

    function _delegateTo(address imp, bytes memory sigWithData)
        internal
        returns (bytes memory returnData)
    {
        bool success;
        (success, returnData) = imp.delegatecall(sigWithData);
        assembly {
            if eq(success, 0) {
                revert(add(returnData, 0x20), returndatasize)
            }
        }
    }

    function delegateTo(address imp, bytes memory sigWithData)
        public
        returns (bytes memory returnData)
    {
        require(msg.sender == address(this), "INVALID_CALLER");
        return _delegateTo(imp, sigWithData);
    }

    function _delegateViewLoanData(bytes memory sigWithData)
        internal
        view
        returns (bytes memory)
    {
        (bool success, bytes memory returnData) =
            address(this).staticcall(
                abi.encodeWithSignature(
                    "delegateTo(address,bytes)",
                    loanData,
                    sigWithData
                )
            );
        assembly {
            if eq(success, 0) {
                revert(add(returnData, 0x20), returndatasize)
            }
        }
        return abi.decode(returnData, (bytes));
    }

    /**
     * @notice Checks if the loan has an Escrow and claims any tokens then pays out the loan collateral.
     * @dev See Escrow.claimTokens for more info.
     * @param loanID The ID of the loan which is being liquidated
     * @param rewardInCollateral The total amount of reward based in the collateral token to pay the liquidator
     * @param recipient The address of the liquidator where the liquidation reward will be sent to
     */
    function _payOutLiquidator(
        uint256 loanID,
        int256 rewardInCollateral,
        address payable recipient
    ) internal {
        if (rewardInCollateral <= 0) {
            return;
        }
        uint256 reward = uint256(rewardInCollateral);
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
                IEscrow(loans[loanID].escrow).claimTokensByCollateralValue(
                    recipient,
                    remainingCollateralAmount
                );
            }
        }
    }

    /**
     * @notice Pays out an amount of collateral for a loan.
     * @param loanID ID of loan from which collateral is to be paid out.
     * @param amount Amount of collateral paid out.
     * @param recipient Address of the recipient of the collateral.
     */
    function _payOutCollateral(
        uint256 loanID,
        uint256 amount,
        address payable recipient
    ) internal {
        totalCollateral = totalCollateral.sub(amount);
        loans[loanID].collateral = loans[loanID].collateral.sub(amount);
        recipient.transfer(amount);
    }

    /**
     * @notice Pays collateral in for the associated loan
     * @param loanID The ID of the loan the collateral is for
     * @param amount The amount of collateral to be paid
     */
    function _payInCollateral(uint256 loanID, uint256 amount) internal {
        require(msg.value == amount, "INCORRECT_ETH_AMOUNT");

        totalCollateral = totalCollateral.add(amount);
        loans[loanID].collateral = loans[loanID].collateral.add(amount);
        loans[loanID].lastCollateralIn = now;
        emit CollateralDeposited(loanID, msg.sender, amount);
    }

    /**
     * @notice It validates whether supply to debt (StD) ratio is valid including the loan amount.
     * @param newLoanAmount the new loan amount to consider o the StD ratio.
     * @return true if the ratio is valid. Otherwise it returns false.
     */
    function _isDebtRatioValid(uint256 newLoanAmount)
        internal
        view
        returns (bool)
    {
        uint256 maxDebtRatio =
            settings.assetSettings().getMaxDebtRatio(lendingToken);
        uint256 currentDebtRatio = lendingPool.getDebtRatioFor(newLoanAmount);
        return currentDebtRatio <= maxDebtRatio;
    }

    /**
     * @notice Creates a loan with the loan request.
     * @param request Loan request as per the struct of the Teller platform.
     * @param interestRate Interest rate set in the loan terms.
     * @param collateralRatio Collateral ratio set in the loan terms.
     * @param maxLoanAmount Maximum loan amount that can be taken out, set in the loan terms.
     */
    function _createNewLoan(
        TellerCommon.LoanRequest memory request,
        uint256 interestRate,
        uint256 collateralRatio,
        uint256 maxLoanAmount
    ) internal returns (uint256) {
        // Get and increment new loan ID
        uint256 loanID = loanIDCounter;
        loanIDCounter = loanIDCounter.add(1);

        require(
            loans[loanID].status == TellerCommon.LoanStatus.NonExistent,
            "LOAN_ALREADY_EXISTS"
        );
        require(request.borrower != address(0), "BORROWER_EMPTY");

        loans[loanID].id = loanID;
        loans[loanID].status = TellerCommon.LoanStatus.TermsSet;
        loans[loanID].loanTerms = TellerCommon.LoanTerms({
            borrower: request.borrower,
            recipient: request.recipient,
            interestRate: interestRate,
            collateralRatio: collateralRatio,
            maxLoanAmount: maxLoanAmount,
            duration: request.duration
        });

        uint256 termsExpiryTime = settings.getTermsExpiryTimeValue();
        loans[loanID].termsExpiry = now.add(termsExpiryTime);

        return loanID;
    }

    /**
     * @notice It creates an Escrow contract instance for a given loan id.
     * @param loanID loan id associated to the Escrow contract.
     * @return the new Escrow contract address.
     */
    function _createEscrow(uint256 loanID) internal returns (address escrow) {
        require(
            loans[loanID].escrow == address(0x0),
            "LOAN_ESCROW_ALREADY_EXISTS"
        );

        escrow = clone(escrowProxyLogic);
        IEscrowDynamicProxy(escrow).initialize(address(logicRegistry));
        // The escrow must be added as an authorized address since it will be interacting with the protocol
        // TODO: Remove after non-guarded launch
        settings.addEscrowAuthorized(escrow);
    }

    function clone(address target) internal returns (address result) {
        // convert address to 20 bytes
        bytes20 targetBytes = bytes20(target);

        // actual code //
        // 3d602d80600a3d3981f3363d3d373d3d3d363d73bebebebebebebebebebebebebebebebebebebebe5af43d82803e903d91602b57fd5bf3

        // creation code //
        // copy runtime code into memory and return it
        // 3d602d80600a3d3981f3

        // runtime code //
        // code to delegatecall to address
        // 363d3d373d3d3d363d73 address 5af43d82803e903d91602b57fd5bf3

        assembly {
            /*
        reads the 32 bytes of memory starting at pointer stored in 0x40

        In solidity, the 0x40 slot in memory is special: it contains the "free memory pointer"
        which points to the end of the currently allocated memory.
        */
            let clone := mload(0x40)
            // store 32 bytes to memory starting at "clone"
            mstore(
                clone,
                0x3d602d80600a3d3981f3363d3d373d3d3d363d73000000000000000000000000
            )

            /*
          |              20 bytes                |
        0x3d602d80600a3d3981f3363d3d373d3d3d363d73000000000000000000000000
                                                  ^
                                                  pointer
        */
            // store 32 bytes to memory starting at "clone" + 20 bytes
            // 0x14 = 20
            mstore(add(clone, 0x14), targetBytes)

            /*
          |               20 bytes               |                 20 bytes              |
        0x3d602d80600a3d3981f3363d3d373d3d3d363d73bebebebebebebebebebebebebebebebebebebebe
                                                                                          ^
                                                                                          pointer
        */
            // store 32 bytes to memory starting at "clone" + 40 bytes
            // 0x28 = 40
            mstore(
                add(clone, 0x28),
                0x5af43d82803e903d91602b57fd5bf30000000000000000000000000000000000
            )

            /*
          |               20 bytes               |                 20 bytes              |           15 bytes          |
        0x3d602d80600a3d3981f3363d3d373d3d3d363d73bebebebebebebebebebebebebebebebebebebebe5af43d82803e903d91602b57fd5bf3
        */
            // create new contract
            // send 0 Ether
            // code starts at pointer stored in "clone"
            // code size 0x37 (55 bytes)
            result := create(0, clone, 0x37)
        }
    }
}
