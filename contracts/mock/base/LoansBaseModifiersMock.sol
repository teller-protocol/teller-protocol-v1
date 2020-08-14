pragma solidity 0.5.17;
pragma experimental ABIEncoderV2;

import "../../base/EtherCollateralLoans.sol";


/**
    This contract is created ONLY for testing purposes.
 */
contract LoansBaseModifiersMock is EtherCollateralLoans {

    bool public mockIsSupplyToDebtRatioValid;
    bool public returnIsSupplyToDebtRatioValid;

    function setMockIsSupplyToDebtRatioValid(bool result, bool aResponseIsSupplyToDebtRatioValid) external {
        mockIsSupplyToDebtRatioValid = result;
        returnIsSupplyToDebtRatioValid = aResponseIsSupplyToDebtRatioValid;
    }

    function _isSupplyToDebtRatioValid(uint256 newLoanAmount) internal view returns (bool) {
        if(!mockIsSupplyToDebtRatioValid) {
            return super._isSupplyToDebtRatioValid(newLoanAmount);
        }
        return returnIsSupplyToDebtRatioValid;
    }

    function setLoanStatus(uint256 loanID, ZeroCollateralCommon.LoanStatus status)
        external
    {
        loans[loanID].status = status;
    }

    function externalLoanActive(uint256 loanID) external loanActive(loanID) {}

    function externalLoanTermsSet(uint256 loanID) external loanTermsSet(loanID) {}

    function externalLoanActiveOrSet(uint256 loanID) external loanActiveOrSet(loanID) {}

    function externalIsBorrower(address anAddress) external isBorrower(anAddress) {}

    function externalWithValidLoanRequest(
        ZeroCollateralCommon.LoanRequest calldata loanRequest
    ) external withValidLoanRequest(loanRequest) {}
}
