pragma solidity 0.5.17;
pragma experimental ABIEncoderV2;

// Libraries
import "@openzeppelin/contracts-ethereum-package/contracts/math/SafeMath.sol";
import "../util/TellerCommon.sol";
import "../util/AddressLib.sol";

// Interfaces
import "../interfaces/SettingsInterface.sol";
import "../interfaces/EscrowInterface.sol";
import "../interfaces/LoansInterface.sol";

// Contracts

library LoanLib {
    using SafeMath for uint256;
    using NumbersLib for uint256;
    using NumbersLib for int256;
    using AddressLib for address payable;

    // Loan length will be inputted in seconds.
    uint256 internal constant SECONDS_PER_YEAR = 31536000;

    /**
        @notice Creates a loan with the loan request.
        @param loan The loan struct to initialize.
        @param request Loan request as per the struct of the Teller platform.
        @param loanID The id to use for the loan.
        @param interestRate Interest rate set in the loan terms.
        @param collateralRatio Collateral ratio set in the loan terms.
        @param maxLoanAmount Maximum loan amount that can be taken out, set in the loan terms.
     */
    function init(
        TellerCommon.Loan storage loan,
        TellerCommon.LoanRequest memory request,
        SettingsInterface settings,
        uint256 loanID,
        uint256 interestRate,
        uint256 collateralRatio,
        uint256 maxLoanAmount
    ) internal {
        require(
            loan.status == TellerCommon.LoanStatus.NonExistent,
            "LOAN_ALREADY_EXISTS"
        );
        request.borrower.requireNotEmpty("BORROWER_EMPTY");

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
        @param loan The loan to check the collateral ratio for.
        @param settings The settings instance for the platform.
        @return bool indicating whether the loan with specified parameters can be deposited to an EOA.
     */
    function canGoToEOA(
        TellerCommon.Loan storage loan,
        SettingsInterface settings
    ) public view returns (bool) {
        uint256 overCollateralizedBuffer =
            settings.getPlatformSettingValue(
                settings.consts().OVER_COLLATERALIZED_BUFFER_SETTING()
            );
        return loan.loanTerms.collateralRatio >= overCollateralizedBuffer;
    }

    /**
        @notice Checks whether the loan's collateral ratio is considered to be secured based on the settings collateral buffer value.
        @param loan The loan to check.
        @param settings The settings instance for the platform.
        @return bool value of it being secured or not.
    */
    function isSecured(
        TellerCommon.Loan storage loan,
        SettingsInterface settings
    ) public view returns (bool) {
        return
            loan.loanTerms.collateralRatio >=
            settings.getPlatformSettingValue(
                settings.consts().COLLATERAL_BUFFER_SETTING()
            );
    }

    /**
        @notice Checks whether the status of a loan is Active or has Terms Set
        @param loan The loan for which to check the status
        @return bool value indicating if the loan is active or has terms set
     */
    function isActiveOrSet(TellerCommon.Loan storage loan)
        public
        view
        returns (bool)
    {
        return
            loan.status == TellerCommon.LoanStatus.Active ||
            loan.status == TellerCommon.LoanStatus.TermsSet;
    }

    /**
        @notice Returns the total amount owed for a specified loan.
        @param loan The loan to get the total amount owed.
        @return uint256 The total owed amount.
     */
    function getTotalOwed(TellerCommon.Loan storage loan)
        public
        view
        returns (uint256)
    {
        if (loan.status == TellerCommon.LoanStatus.TermsSet) {
            uint256 interestOwed =
                getInterestOwedFor(loan, loan.loanTerms.maxLoanAmount);
            return loan.loanTerms.maxLoanAmount.add(interestOwed);
        } else if (loan.status == TellerCommon.LoanStatus.Active) {
            return loan.principalOwed.add(loan.interestOwed);
        }
        return 0;
    }

    /**
        @notice Returns the total amount owed for a specified loan.
        @param loan The loan to get the total amount owed.
        @return uint256 The amount owed.
     */
    function getLoanAmount(TellerCommon.Loan storage loan)
        public
        view
        returns (uint256)
    {
        if (loan.status == TellerCommon.LoanStatus.TermsSet) {
            return loan.loanTerms.maxLoanAmount;
        } else if (loan.status == TellerCommon.LoanStatus.Active) {
            return loan.borrowedAmount;
        }
        return 0;
    }

    /**
        @notice Returns the amount of interest owed for a given loan and loan amount.
        @param loan The loan to get the owed interest.
        @param amountBorrow The principal of the loan to take out.
        @return uint256 The interest owed.
     */
    function getInterestOwedFor(
        TellerCommon.Loan storage loan,
        uint256 amountBorrow
    ) public view returns (uint256) {
        return amountBorrow.percent(getInterestRatio(loan));
    }

    /**
        @notice Returns the interest ratio based on the loan interest rate for the loan duration.
        @dev The interest rate on the loan terms is APY.
        @param loan The loan to get the interest rate for.
     */
    function getInterestRatio(TellerCommon.Loan memory loan)
        public
        pure
        returns (uint256)
    {
        return
            loan.loanTerms.interestRate.mul(loan.loanTerms.duration).div(
                SECONDS_PER_YEAR
            );
    }

    /**
        @notice Get collateral information of a specific loan.
        @param loan The loan to get collateral info for.
        @param loansContract The loans contract instance for the loan.
        @return memory TellerCommon.LoanCollateralInfo Collateral information of the loan.
     */
    function getCollateralInfo(
        TellerCommon.Loan storage loan,
        LoansInterface loansContract
    ) public view returns (TellerCommon.LoanCollateralInfo memory) {
        (
            int256 neededInLending,
            int256 neededInCollateral,
            uint256 escrowLoanValue
        ) = getCollateralNeededInfo(loan, loansContract);
        return
            TellerCommon.LoanCollateralInfo({
                collateral: loan.collateral,
                valueInLendingTokens: getCollateralInLendingTokens(
                    loan,
                    loansContract
                ),
                escrowLoanValue: escrowLoanValue,
                neededInLendingTokens: neededInLending,
                neededInCollateralTokens: neededInCollateral,
                moreCollateralRequired: neededInCollateral >
                    int256(loan.collateral)
            });
    }

    /**
        @notice Returns the collateral needed for a loan, in the lending token, needed to take out the loan or for it be liquidated.
        @param loan The loan for which to get collateral information for
        @param loansContract The loans contract instance associated with the loan
        @return uint256 Collateral needed in lending token value
     */
    function getCollateralInLendingTokens(
        TellerCommon.Loan storage loan,
        LoansInterface loansContract
    ) public view returns (uint256) {
        if (!isActiveOrSet(loan)) {
            return 0;
        }
        return
            loansContract.settings().chainlinkAggregator().valueFor(
                loansContract.collateralToken(),
                loansContract.lendingToken(),
                loan.collateral
            );
    }

    /**
        @notice Get information on the collateral needed for the loan.
        @param loan The loan to get collateral info for.
        @param loansContract The loans contract instance for the loan.
        @return int256 Collateral needed in Lending tokens.
        @return int256 Collateral needed in Collateral tokens (wei)
        @return uint256 The value of the loan held in the escrow contract
     */
    function getCollateralNeededInfo(
        TellerCommon.Loan storage loan,
        LoansInterface loansContract
    )
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
            loan,
            loansContract.settings()
        );

        if (neededInLendingTokens == 0) {
            neededInCollateralTokens = 0;
        } else {
            uint256 value =
                loansContract.settings().chainlinkAggregator().valueFor(
                    loansContract.lendingToken(),
                    loansContract.collateralToken(),
                    uint256(
                        neededInLendingTokens < 0
                            ? -neededInLendingTokens
                            : neededInLendingTokens
                    )
                );
            neededInCollateralTokens = int256(value);
            if (neededInLendingTokens < 0) {
                neededInCollateralTokens *= -1;
            }
        }
    }

    /**
        @notice Returns the minimum collateral value threshold, in the lending token, needed to take out the loan or for it be liquidated.
        @dev If the loan status is TermsSet, then the value is whats needed to take out the loan.
        @dev If the loan status is Active, then the value is the threshold at which the loan can be liquidated at.
        @param loan The loan to get needed collateral info for.
        @param settings The settings instance that holds the platform setting values.
        @return int256 The minimum collateral value threshold required.
        @return uint256 The value of the loan held in the escrow contract.
     */
    function getCollateralNeededInTokens(
        TellerCommon.Loan storage loan,
        SettingsInterface settings
    )
        public
        view
        returns (int256 neededInLendingTokens, uint256 escrowLoanValue)
    {
        if (!isActiveOrSet(loan) || loan.loanTerms.collateralRatio == 0) {
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
        if (loan.status == TellerCommon.LoanStatus.TermsSet) {
            neededInLendingTokens = int256(getLoanAmount(loan)).percent(
                loan.loanTerms.collateralRatio
            );
        } else {
            neededInLendingTokens = int256(
                loan.principalOwed.add(loan.interestOwed)
            );
            uint256 bufferPercent =
                settings.getPlatformSettingValue(
                    settings.consts().COLLATERAL_BUFFER_SETTING()
                );
            uint256 requiredRatio =
                loan.loanTerms.collateralRatio.sub(getInterestRatio(loan)).sub(
                    bufferPercent
                );
            if (loan.escrow != address(0)) {
                escrowLoanValue = EscrowInterface(loan.escrow)
                    .calculateTotalValue();
                neededInLendingTokens +=
                    neededInLendingTokens -
                    int256(escrowLoanValue);
            }
            neededInLendingTokens = neededInLendingTokens.percent(
                requiredRatio
            );
        }
    }

    /**
        @notice It gets the current liquidation info for a given loan.
        @param loan The loan to get the info.
        @param loansContract The loans contract instance for the loan.
        @return liquidationInfo get current liquidation info for the given loan id.
     */
    function getLiquidationInfo(
        TellerCommon.Loan storage loan,
        LoansInterface loansContract
    )
        public
        view
        returns (TellerCommon.LoanLiquidationInfo memory liquidationInfo)
    {
        liquidationInfo.collateralInfo = getCollateralInfo(loan, loansContract);
        liquidationInfo.amountToLiquidate = getTotalOwed(loan);

        // Maximum reward is the calculated value of required collateral minus the principal owed (see LoanLib.getCollateralNeededInTokens).+
        uint256 availableValue =
            liquidationInfo.collateralInfo.valueInLendingTokens.add(
                liquidationInfo.collateralInfo.escrowLoanValue
            );
        uint256 liquidationSetting =
            loansContract.settings().getPlatformSettingValue(
                loansContract.settings().consts().LIQUIDATE_ETH_PRICE_SETTING()
            );
        uint256 maxReward =
            liquidationInfo.amountToLiquidate.percent(
                liquidationSetting.diffOneHundredPercent()
            );
        if (availableValue < liquidationInfo.amountToLiquidate + maxReward) {
            liquidationInfo.rewardInCollateral = int256(availableValue);
        } else {
            liquidationInfo.rewardInCollateral = int256(maxReward);
        }

        liquidationInfo.liquidable =
            loan.status == TellerCommon.LoanStatus.Active &&
            (loan.loanStartTime.add(loan.loanTerms.duration) <= now ||
                (loan.loanTerms.collateralRatio > 0 &&
                    liquidationInfo.collateralInfo.moreCollateralRequired));
    }

    /**
        @notice Make a payment towards the interest and principal for a specified loan.
        @notice Payments are made towards the interest first.
        @param loan The loan the payment is for.
        @param toPay The amount of tokens to pay to the loan.
        @return principalPaid the amount of principal paid back
        @return interestPaid the amount of interest paid back
    */
    function payOff(TellerCommon.Loan storage loan, uint256 toPay)
        public
        returns (uint256 principalPaid, uint256 interestPaid)
    {
        if (toPay < loan.interestOwed) {
            interestPaid = toPay;
            loan.interestOwed = loan.interestOwed.sub(toPay);
        } else {
            if (loan.interestOwed > 0) {
                interestPaid = loan.interestOwed;
                toPay = toPay.sub(interestPaid);
                loan.interestOwed = 0;
            }

            if (toPay > 0) {
                principalPaid = toPay;
                loan.principalOwed = loan.principalOwed.sub(toPay);
            }
        }
    }
}
