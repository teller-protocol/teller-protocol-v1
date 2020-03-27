pragma solidity 0.5.17;


interface LenderInfoInterface {
    function zDaiTransfer(address sender, address recipient, uint256 amount) external;

    function zDaiMinted(address recipient, uint256 amount) external;

    function zDaiBurnt(address recipient, uint256 amount) external;

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
