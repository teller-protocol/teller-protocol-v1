pragma solidity 0.5.17;


interface LendersInterface {
    function withdrawInterest(address recipient, uint256 amount)
        external
        returns (uint256);

    function setAccruedInterest(address lender, uint256 endBlock, uint256 amount)
        external;

    event AccruedInterestUpdated(
        address indexed lender,
        uint256 totalNotWithdrawn,
        uint256 totalAccruedInterest
    );

    event InterestUpdateRequested(address indexed lender, uint256 blockNumber);

    event CancelInterestUpdate(address indexed lender, uint256 blockNumber);

    event AccruedInterestWithdrawn(address indexed recipient, uint256 amount);
}
