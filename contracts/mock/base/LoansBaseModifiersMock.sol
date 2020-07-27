pragma solidity 0.5.17;
pragma experimental ABIEncoderV2;

import "../../base/EtherCollateralLoans.sol";

/**
    This contract is created ONLY for testing purposes.
 */
contract LoansBaseModifiersMock is EtherCollateralLoans {

    function setLoanStatus(uint256 loanID, ZeroCollateralCommon.LoanStatus status) external {
        loans[loanID].status = status;
    }

    function externalLoanActive(uint256 loanID) loanActive(loanID) external {}

    function externalLoanTermsSet(uint256 loanID) loanTermsSet(loanID) external {}

    function externalLoanActiveOrSet(uint256 loanID) loanActiveOrSet(loanID) external {}

    function externalIsBorrower(address anAddress) isBorrower(anAddress) external {}

    function externalWithValidLoanRequest(ZeroCollateralCommon.LoanRequest calldata loanRequest) withValidLoanRequest(loanRequest) external {}
}
