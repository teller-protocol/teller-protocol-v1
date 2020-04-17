pragma solidity 0.5.17;


interface LendersInterface {
    function zTokenTransfer(address sender, address recipient, uint256 amount) external;

    function zTokenMinted(address recipient, uint256 amount) external;

    function zTokenBurnt(address recipient, uint256 amount) external;

    function withdrawInterest(address recipient, uint256 amount)
        external
        returns (uint256);

    event AccruedInterestUpdated(
        address lender,
        uint256 lastBlockAccrued,
        uint256 totalAccruedInterest
    );

    event AccruedInterestWithdrawn(address recipient, uint256 amount);
}
