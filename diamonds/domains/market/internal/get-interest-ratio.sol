import "../storage/loans.sol";

abstract contract int_getInterestRatio_v1 is sto_Loans {
    function _getInterestRatio(uint256 loanID)
        internal
        view
        returns (uint256)
    {}
}
