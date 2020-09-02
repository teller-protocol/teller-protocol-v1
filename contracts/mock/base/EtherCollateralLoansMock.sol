pragma solidity 0.5.17;
pragma experimental ABIEncoderV2;

import "../../base/EtherCollateralLoans.sol";
import "./LoansBaseMock.sol";

contract EtherCollateralLoansMock is EtherCollateralLoans, LoansBaseMock {
    function setLoanIDCounter(uint256 newLoanIdCounter) external {
        loanIDCounter = newLoanIdCounter;
    }

    function setBorrowerLoans(address borrower, uint256[] calldata loanIDs) external {
        borrowerLoans[borrower] = loanIDs;
    }

    function setTotalCollateral(uint256 amount) external {
        totalCollateral = amount;
    }

    function externalSetSettings(address settingsAddress) external {
        _setSettings(settingsAddress);
    }

    function() external payable {}
}
