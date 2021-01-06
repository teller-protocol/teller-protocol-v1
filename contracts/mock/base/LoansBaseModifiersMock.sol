pragma solidity 0.5.17;
pragma experimental ABIEncoderV2;

import "../../base/EtherCollateralLoans.sol";

/**
    This contract is created ONLY for testing purposes.
 */
contract LoansBaseModifiersMock is EtherCollateralLoans {
    bool public _mockIsDebtRatioValid;
    bool public returnIsDebtRatioValid;

    function mockIsDebtRatioValid(
        bool result,
        bool aResponseIsDebtRatioValid
    ) external {
        _mockIsDebtRatioValid = result;
        returnIsDebtRatioValid = aResponseIsDebtRatioValid;
    }

    function _isDebtRatioValid(uint256 newLoanAmount)
        internal
        view
        returns (bool)
    {
        if (!_mockIsDebtRatioValid) {
            return super._isDebtRatioValid(newLoanAmount);
        }
        return returnIsDebtRatioValid;
    }

    function setLoanStatus(uint256 loanID, TellerCommon.LoanStatus status) external {
        loans[loanID].status = status;
    }

    function externalLoanActive(uint256 loanID) external loanActive(loanID) {}

    function externalLoanTermsSet(uint256 loanID) external loanTermsSet(loanID) {}

    function externalLoanActiveOrSet(uint256 loanID) external loanActiveOrSet(loanID) {}

    function externalIsBorrower(address anAddress) external isBorrower(anAddress) {}

    function externalWithValidLoanRequest(TellerCommon.LoanRequest calldata loanRequest)
        external
        withValidLoanRequest(loanRequest)
    {}
}
