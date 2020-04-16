pragma solidity 0.5.17;


interface LendersInterface {
    function zTokenTransfer(address sender, address recipient, uint256 amount) external;

    function zTokenBurnt(address recipient, uint256 amount) external;

    function withdrawInterest(address recipient, uint256 amount)
        external
        returns (uint256);

    event AccruedInterestUpdated(
        address indexed lender,
        uint256 totalNotWithdrawn,
        uint256 totalAccruedInterest
    );

    event InterestUpdateRequested(address indexed lender, uint256 blockNumber);

    event CancelInterestUpdate(address indexed lender, uint256 blockNumber);

    event AccruedInterestWithdrawn(address indexed recipient, uint256 amount);
}
