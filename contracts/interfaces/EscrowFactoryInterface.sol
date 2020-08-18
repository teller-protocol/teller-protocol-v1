pragma solidity 0.5.17;
pragma experimental ABIEncoderV2;

import "./LoansInterface.sol";


interface EscrowFactoryInterface {
    function isDappWhitelisted(address dapp) external view returns (bool);

    function createEscrow(uint256 loanID) external returns (address);

    event EscrowCreated(
        address borrower,
        address loansAddress,
        uint256 loanID,
        address escrowAddress
    );
}
