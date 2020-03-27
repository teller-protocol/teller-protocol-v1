pragma solidity 0.5.17;

interface DAIPoolInterface {
    function depositDai(uint256 amount) external;

    function withdrawDai(uint256 amount) external;

    function repayDai(uint256 amount, address borrower) external;

    function liquidationPayment(uint256 amount, address liquidator) external;

    function createLoan(uint256 amount, address borrower) external returns (bool);

    function withdrawInterest(uint256 amount) external;
}
