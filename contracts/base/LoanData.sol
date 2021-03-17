pragma solidity 0.5.17;
pragma experimental ABIEncoderV2;

// Libraries
import "../providers/openzeppelin/SignedSafeMath.sol";
import "../util/AddressLib.sol";

// Commons
import "../util/TellerCommon.sol";

// Interfaces
import "../interfaces/SettingsInterface.sol";
import "../interfaces/ILoanData.sol";

// Contracts
import "./Base.sol";

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
    @notice The LendingPool contract holds all of the tokens that lenders transfer into the protocol.
    It is the contract that lenders interact with to deposit and withdraw their tokens including interest.

    @author develop@teller.finance
 */
contract LoanData is ILoanData, Base {
    using SafeMath for uint256;
    using SignedSafeMath for int256;
    using NumbersLib for uint256;
    using NumbersLib for int256;
    using AddressLib for address payable;

    /* State Variables */

    address public owner;

    /**
        @notice It is the address of the token for all related loans stored in this contract.
     */
    address lendingToken;

    /**
        @notice At any time, this variable stores the next available loan ID.
     */
    uint256 public loanIDCounter;

    /**
        @notice It stores all of the loan data by its ID.
        @param uint256 the loan ID.
     */
    mapping(uint256 => TellerCommon.Loan) public loans;

    /**
        @notice It stores an array of loan IDs for each borrower.
        @param address of the borrower.
     */
    mapping(address => uint256[]) public borrowerLoans;

    // Loan length will be inputted in seconds.
    uint256 internal constant SECONDS_PER_YEAR = 31536000;

    /* Modifiers */

    modifier onlyOwner() {
        require(msg.sender == owner, "NOT_OWNER");
    }

    /* External Functions */

    function liquidateLoan(uint256 loanID) external {}

    /**
        @notice Creates a loan with the loan request.
        @param loan The loan struct to initialize.
        @param request Loan request as per the struct of the Teller platform.
        @param loanID The id to use for the loan.
        @param interestRate Interest rate set in the loan terms.
        @param collateralRatio Collateral ratio set in the loan terms.
        @param maxLoanAmount Maximum loan amount that can be taken out, set in the loan terms.
     */
    function createNewLoan(
        TellerCommon.LoanRequest memory request,
        uint256 interestRate,
        uint256 collateralRatio,
        uint256 maxLoanAmount
    ) external onlyOwner {
        require(
            loan.status == TellerCommon.LoanStatus.NonExistent,
            "LOAN_ALREADY_EXISTS"
        );
        request.borrower.requireNotEmpty("BORROWER_EMPTY");

        uint256 loanID = _getAndIncrementLoanID();
        TellerCommon.Loan storage loan = loans[loanID];
        loan.id = loanID;
        loan.status = TellerCommon.LoanStatus.TermsSet;
        loan.loanTerms = TellerCommon.LoanTerms({
            borrower: request.borrower,
            recipient: request.recipient,
            interestRate: interestRate,
            collateralRatio: collateralRatio,
            maxLoanAmount: maxLoanAmount,
            duration: request.duration
        });

        uint256 termsExpiryTime =
            settings.getPlatformSettingValue(
                settings.consts().TERMS_EXPIRY_TIME_SETTING()
            );
        loan.termsExpiry = now.add(termsExpiryTime);
    }

    /**
        @notice Checks whether a loan is allowed to be deposited to an Externally Owned Account.
        @param loanID The loan ID to check the collateral ratio for.
        @return bool indicating whether the loan with specified parameters can be deposited to an EOA.
     */
    function canGoToEOA(uint256 loanID) public view returns (bool) {
        uint256 overCollateralizedBuffer =
            settings.getPlatformSettingValue(
                settings.consts().OVER_COLLATERALIZED_BUFFER_SETTING()
            );
        return
            loans[loanID].loanTerms.collateralRatio >= overCollateralizedBuffer;
    }

    /**
        @notice Checks whether the loan's collateral ratio is considered to be secured based on the settings collateral buffer value.
        @param loanID The loan ID to check.
        @return bool value of it being secured or not.
    */
    function isSecured(uint256 loanID) public view returns (bool) {
        return
            loans[loanID].loanTerms.collateralRatio >=
            settings.getPlatformSettingValue(
                settings.consts().COLLATERAL_BUFFER_SETTING()
            );
    }

    /**
        @notice Checks whether the status of a loan is Active or has Terms Set.
        @param loanID The loan ID for which to check the status.
        @return bool value indicating if the loan is active or has terms set.
     */
    function isActiveOrSet(uint256 loanID) public view returns (bool) {
        return
            loans[loanID].status == TellerCommon.LoanStatus.Active ||
            loans[loanID].status == TellerCommon.LoanStatus.TermsSet;
    }

    /**
        @notice Returns the total amount owed for a specified loan.
        @param loanID The loan ID to get the total amount owed.
        @return uint256 The total owed amount.
     */
    function getTotalOwed(uint256 loanID) public view returns (uint256) {
        if (loans[loanID].status == TellerCommon.LoanStatus.TermsSet) {
            uint256 interestOwed =
                getInterestOwedFor(
                    loans[loanID],
                    loans[loanID].loanTerms.maxLoanAmount
                );
            return loans[loanID].loanTerms.maxLoanAmount.add(interestOwed);
        } else if (loans[loanID].status == TellerCommon.LoanStatus.Active) {
            return loans[loanID].principalOwed.add(loans[loanID].interestOwed);
        }
        return 0;
    }

    /**
        @notice Returns the total amount owed for a specified loan.
        @param loanID The loan ID to get the total amount owed.
        @return uint256 The amount owed.
     */
    function getLoanAmount(uint256 loanID) public view returns (uint256) {
        if (loans[loanID].status == TellerCommon.LoanStatus.TermsSet) {
            return loans[loanID].loanTerms.maxLoanAmount;
        } else if (loans[loanID].status == TellerCommon.LoanStatus.Active) {
            return loans[loanID].borrowedAmount;
        }
        return 0;
    }

    /**
        @notice Returns the amount of interest owed for a given loan and loan amount.
        @param loanID The loan ID to get the owed interest.
        @param amountBorrow The principal of the loan to take out.
        @return uint256 The interest owed.
     */
    function getInterestOwedFor(uint256 loanID, uint256 amountBorrow)
        public
        view
        returns (uint256)
    {
        return amountBorrow.percent(getInterestRatio(loanID));
    }

    /**
        @notice Returns the interest ratio based on the loan interest rate for the loan duration.
        @dev The interest rate on the loan terms is APY.
        @param loanID The loan ID to get the interest rate for.
     */
    function getInterestRatio(uint256 loanID) public pure returns (uint256) {
        return
            loans[loanID]
                .loanTerms
                .interestRate
                .mul(loans[loanID].loanTerms.duration)
                .div(SECONDS_PER_YEAR);
    }

    /**
        @notice Get collateral information of a specific loan.
        @param loanID The loan ID to get collateral info for.
        @return memory TellerCommon.LoanCollateralInfo Collateral information of the loan.
     */
    function getCollateralInfo(uint256 loanID)
        public
        view
        returns (TellerCommon.LoanCollateralInfo memory)
    {
        (
            int256 neededInLending,
            int256 neededInCollateral,
            uint256 escrowLoanValue
        ) = getCollateralNeededInfo(loans[loanID]);

        return
            TellerCommon.LoanCollateralInfo({
                collateral: loans[loanID].collateral,
                valueInLendingTokens: getCollateralInLendingTokens(loanID),
                escrowLoanValue: escrowLoanValue,
                neededInLendingTokens: neededInLending,
                neededInCollateralTokens: neededInCollateral,
                moreCollateralRequired: neededInCollateral >
                    int256(loans[loanID].collateral)
            });
    }

    /**
        @notice Returns the collateral needed for a loan, in the lending token, needed to take out the loan or for it be liquidated.
        @param loanID The loan ID for which to get collateral information for.
        @return uint256 Collateral needed in lending token value.
     */
    function getCollateralInLendingTokens(uint256 loanID)
        public
        view
        returns (uint256)
    {
        if (!isActiveOrSet(loanID)) {
            return 0;
        }

        return
            settings.chainlinkAggregator().valueFor(
                loans[loanID].collateralToken,
                lendingToken,
                loans[loanID].collateral
            );
    }

    /**
        @notice Get information on the collateral needed for the loan.
        @param loanID The loan ID to get collateral info for.
        @return int256 Collateral needed in Lending tokens.
        @return int256 Collateral needed in Collateral tokens (wei)
        @return uint256 The value of the loan held in the escrow contract.
     */
    function getCollateralNeededInfo(uint256 loanID)
        public
        view
        returns (
            int256 neededInLendingTokens,
            int256 neededInCollateralTokens,
            uint256 escrowLoanValue
        )
    {
        // Get collateral needed in lending tokens.
        (neededInLendingTokens, escrowLoanValue) = getCollateralNeededInTokens(
            loanID
        );

        if (neededInLendingTokens == 0) {
            neededInCollateralTokens = 0;
        } else {
            uint256 value =
                settings.chainlinkAggregator().valueFor(
                    lendingToken,
                    loans[loanID].collateralToken,
                    uint256(
                        neededInLendingTokens < 0
                            ? -neededInLendingTokens
                            : neededInLendingTokens
                    )
                );
            neededInCollateralTokens = int256(value);
            if (neededInLendingTokens < 0) {
                neededInCollateralTokens = neededInCollateralTokens.mul(-1);
            }
        }
    }

    /**
        @notice Returns the minimum collateral value threshold, in the lending token, needed to take out the loan or for it be liquidated.
        @dev If the loan status is TermsSet, then the value is whats needed to take out the loan.
        @dev If the loan status is Active, then the value is the threshold at which the loan can be liquidated at.
        @param loanID The loan ID to get needed collateral info for.
        @param settings The settings instance that holds the platform setting values.
        @return int256 The minimum collateral value threshold required.
        @return uint256 The value of the loan held in the escrow contract.
     */
    function getCollateralNeededInTokens(uint256 loanID)
        public
        view
        returns (int256 neededInLendingTokens, uint256 escrowLoanValue)
    {
        if (
            !isActiveOrSet(loanID) ||
            loans[loanID].loanTerms.collateralRatio == 0
        ) {
            return (0, 0);
        }

        /*
            The collateral to principal owed ratio is the sum of:
                * collateral buffer percent
                * loan interest rate
                * liquidation reward percent
                * X factor of additional collateral
        */
        // * To take out a loan (if status == TermsSet), the required collateral is (max loan amount * the collateral ratio).
        // * For the loan to not be liquidated (when status == Active), the minimum collateral is (principal owed * (X collateral factor + liquidation reward)).
        // * If the loan has an escrow account, the minimum collateral is ((principal owed - escrow value) * (X collateral factor + liquidation reward)).
        if (loans[loanID].status == TellerCommon.LoanStatus.TermsSet) {
            neededInLendingTokens = int256(getLoanAmount(loanID)).percent(
                loans[loanID].loanTerms.collateralRatio
            );
        } else {
            neededInLendingTokens = int256(loans[loanID].principalOwed);
            uint256 bufferPercent =
                settings.getPlatformSettingValue(
                    settings.consts().COLLATERAL_BUFFER_SETTING()
                );
            uint256 requiredRatio =
                loans[loanID]
                    .loanTerms
                    .collateralRatio
                    .sub(getInterestRatio(loanID))
                    .sub(bufferPercent);
            if (loans[loanID].escrow != address(0)) {
                escrowLoanValue = EscrowInterface(loans[loanID].escrow)
                    .calculateTotalValue();
                neededInLendingTokens = neededInLendingTokens.add(
                    neededInLendingTokens.sub(int256(escrowLoanValue))
                );
            }
            neededInLendingTokens = neededInLendingTokens
                .add(int256(loans[loanID].interestOwed))
                .percent(requiredRatio);
        }
    }

    /**
        @notice It gets the current liquidation info for a given loan.
        @param loanID The loan ID to get the info.
        @return liquidationInfo get current liquidation info for the given loan id.
     */
    function getLiquidationInfo(uint256 loanID)
        public
        view
        returns (TellerCommon.LoanLiquidationInfo memory liquidationInfo)
    {
        liquidationInfo.collateralInfo = getCollateralInfo(loanID);
        liquidationInfo.amountToLiquidate = getTotalOwed(loanID);

        // Maximum reward is the calculated value of required collateral minus the principal owed (see LoanLib.getCollateralNeededInTokens).+
        uint256 availableValue =
            liquidationInfo.collateralInfo.valueInLendingTokens.add(
                liquidationInfo.collateralInfo.escrowLoanValue
            );
        uint256 liquidationSetting =
            settings.getPlatformSettingValue(
                settings.consts().LIQUIDATE_ETH_PRICE_SETTING()
            );
        uint256 maxReward =
            liquidationInfo.amountToLiquidate.percent(
                liquidationSetting.diffOneHundredPercent()
            );
        if (availableValue < liquidationInfo.amountToLiquidate + maxReward) {
            liquidationInfo.rewardInCollateral = int256(availableValue);
        } else {
            liquidationInfo.rewardInCollateral = int256(maxReward).add(
                int256(liquidationInfo.amountToLiquidate)
            );
        }

        liquidationInfo.liquidable =
            loans[loanID].status == TellerCommon.LoanStatus.Active &&
            (loans[loanID].loanStartTime.add(
                loans[loanID].loanTerms.duration
            ) <=
                now ||
                (loans[loanID].loanTerms.collateralRatio > 0 &&
                    liquidationInfo.collateralInfo.moreCollateralRequired));
    }

    /**
        @notice Make a payment towards the interest and principal for a specified loan.
        @notice Payments are made towards the interest first.
        @param loanID The loan ID the payment is for.
        @param toPay The amount of tokens to pay to the loan.
        @return principalPaid the amount of principal paid back
        @return interestPaid the amount of interest paid back
    */
    function payOff(uint256 loanID, uint256 toPay)
        public
        returns (uint256 principalPaid, uint256 interestPaid)
    {
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
    }

    /* Internal Functions */

    /**
        @notice Returns the current loan ID and increments it by 1
        @return uint256 The current loan ID before incrementing
     */
    function _getAndIncrementLoanID() internal returns (uint256 newLoanID) {
        newLoanID = loanIDCounter;
        loanIDCounter = loanIDCounter.add(1);
    }
}
