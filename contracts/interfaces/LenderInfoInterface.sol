pragma solidity 0.5.17;

interface LenderInfoInterface {

    function zDaiTransfer(address sender,address recipient, uint256 amount) external returns (bool);

    function zDaiMinted(address recipient, uint256 amount) external returns (bool);

    function zDaiBurnt(address recipient, uint256 amount) external returns (bool);

    function withdrawInterest(address recipient, uint256 amount) external returns (uint256);

}
