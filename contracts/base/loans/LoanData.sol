pragma solidity 0.5.17;
pragma experimental ABIEncoderV2;

// Libraries
import "@openzeppelin/contracts-ethereum-package/contracts/math/SafeMath.sol";

// Interfaces
import "../../interfaces/loans/ILoanData.sol";
import "../../interfaces/SettingsInterface.sol";
import "../../interfaces/escrow/IEscrow.sol";
import "../../interfaces/loans/ILoanManager.sol";
import "../../providers/openzeppelin/SignedSafeMath.sol";

// Contracts
import "../BaseStorage.sol";
import "./LoanStorage.sol";

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
 * @notice This contract stores the logic for calculating loan information.
 * @dev It is used by the LoanManager contract to delegatecall from.
 *
 * @author develop@teller.finance.
 */
contract LoanData is ILoanData, LoanStorage {
    using SafeMath for uint256;
    using SignedSafeMath for int256;
    using NumbersLib for uint256;
    using NumbersLib for int256;

    /**
     * @notice Checks whether the status of a loan is Active or has Terms Set
     * @param loanID The loan ID for which to check the status
     * @return bool value indicating if the loan is active or has terms set
     */
    function isActiveOrSet(uint256 loanID) public view returns (bool) {
        return
            loans[loanID].status == TellerCommon.LoanStatus.Active ||
            loans[loanID].status == TellerCommon.LoanStatus.TermsSet;
    }

    /**
     * @notice Checks whether a loan is allowed to be deposited to an Externally Owned Account.
     * @param loanID The loan ID to check the collateral ratio for.
     * @return bool indicating whether the loan with specified parameters can be deposited to an EOA.
     */
    function canGoToEOA(uint256 loanID) public view returns (bool) {
        uint256 overCollateralizedBuffer =
            settings.getOverCollateralizedBufferValue();
        return
            loans[loanID].loanTerms.collateralRatio >= overCollateralizedBuffer;
    }

    /**
     * @notice Checks whether the loan's collateral ratio is considered to be secured based on the settings collateral buffer value.
     * @param loanID The loan ID to check.
     * @return bool value of it being secured or not.
     */
    function isLoanSecured(uint256 loanID) public view returns (bool) {
        return
            loans[loanID].loanTerms.collateralRatio >=
            settings.getCollateralBufferValue();
    }

    /**
     * @notice Returns the total amount owed for a specified loan.
     * @param loanID The loan ID to get the total amount owed.
     * @return uint256 The total owed amount.
     */
    function getTotalOwed(uint256 loanID) public view returns (uint256) {
        if (loans[loanID].status == TellerCommon.LoanStatus.TermsSet) {
            uint256 interestOwed =
                getInterestOwedFor(
                    loanID,
                    loans[loanID].loanTerms.maxLoanAmount
                );
            return loans[loanID].loanTerms.maxLoanAmount.add(interestOwed);
        } else if (loans[loanID].status == TellerCommon.LoanStatus.Active) {
            return loans[loanID].principalOwed.add(loans[loanID].interestOwed);
        }
        return 0;
    }

    /**
     * @notice Returns the total amount owed for a specified loan.
     * @param loanID The loan ID to get the total amount owed.
     * @return uint256 The amount owed.
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
     * @notice Returns the amount of interest owed for a given loan and loan amount.
     * @param loanID The loan ID to get the owed interest.
     * @param amountBorrow The principal of the loan to take out.
     * @return uint256 The interest owed.
     */
    function getInterestOwedFor(uint256 loanID, uint256 amountBorrow)
        public
        view
        returns (uint256)
    {
        return amountBorrow.percent(getInterestRatio(loanID));
    }

    /**
     * @notice Returns the interest ratio based on the loan interest rate for the loan duration.
     * @dev The interest rate on the loan terms is APY.
     * @param loanID The loan ID to get the interest rate for.
     */
    function getInterestRatio(uint256 loanID) public view returns (uint256) {
        return
            loans[loanID]
                .loanTerms
                .interestRate
                .mul(loans[loanID].loanTerms.duration)
                .div(SECONDS_PER_YEAR);
    }

    /**
     * @notice Returns the collateral needed for a loan, in the lending token, needed to take out the loan or for it be liquidated.
     * @param loanID The loan ID for which to get collateral information for
     * @return uint256 Collateral needed in lending token value
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
                collateralToken,
                lendingToken,
                loans[loanID].collateral
            );
    }

    /**
     * @notice Get information on the collateral needed for the loan.
     * @param loanID The loan ID to get collateral info for.
     * @return int256 Collateral needed in Lending tokens.
     * @return int256 Collateral needed in Collateral tokens (wei)
     * @return uint256 The value of the loan held in the escrow contract
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
                    collateralToken,
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
     * @notice Returns the minimum collateral value threshold, in the lending token, needed to take out the loan or for it be liquidated.
     * @dev If the loan status is TermsSet, then the value is whats needed to take out the loan.
     * @dev If the loan status is Active, then the value is the threshold at which the loan can be liquidated at.
     * @param loanID The loan ID to get needed collateral info for.
     * @return int256 The minimum collateral value threshold required.
     * @return uint256 The value of the loan held in the escrow contract.
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
            uint256 bufferPercent = settings.getCollateralBufferValue();
            uint256 requiredRatio =
                loans[loanID]
                    .loanTerms
                    .collateralRatio
                    .sub(getInterestRatio(loanID))
                    .sub(bufferPercent);
            if (loans[loanID].escrow != address(0)) {
                escrowLoanValue = IEscrow(loans[loanID].escrow)
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
     * @notice It checks if a loan can be liquidated.
     * @param loanID The loan ID to check.
     * @return true if the loan is liquidable.
     */
    function isLiquidable(uint256 loanID) public view returns (bool) {
        // Check if loan can be liquidated
        if (loans[loanID].status != TellerCommon.LoanStatus.Active) {
            return false;
        }

        if (loans[loanID].loanTerms.collateralRatio > 0) {
            // If loan has a collateral ratio, check how much is needed
            (, int256 neededInCollateral, ) = getCollateralNeededInfo(loanID);
            return neededInCollateral > int256(loans[loanID].collateral);
        } else {
            // Otherwise, check if the loan has expired
            return
                now >=
                loans[loanID].loanStartTime.add(
                    loans[loanID].loanTerms.duration
                );
        }
    }

    /**
     * @notice It gets the current liquidation reward for a given loan.
     * @param loanID The loan ID to get the info.
     * @return The value the liquidator will receive denoted in collateral tokens.
     */
    function getLiquidationReward(uint256 loanID) public view returns (int256) {
        uint256 amountToLiquidate = getTotalOwed(loanID);
        uint256 availableValue =
            getCollateralInLendingTokens(loanID).add(
                IEscrow(loans[loanID].escrow).calculateTotalValue()
            );
        uint256 maxReward =
            amountToLiquidate.percent(
                settings.getLiquidateEthPriceValue().diffOneHundredPercent()
            );
        if (availableValue < amountToLiquidate + maxReward) {
            return int256(availableValue);
        } else {
            return int256(maxReward).add(int256(amountToLiquidate));
        }
    }
}
