pragma solidity 0.5.17;
pragma experimental ABIEncoderV2;

import "../../base/Escrow.sol";
import "../../util/TellerCommon.sol";

contract EscrowMock is Escrow {
    bool private _mockIsOwner;
    bool public _isOwner;
    address public _borrower;
    TellerCommon.LoanStatus public _loanStatus;

    function mockIsOwner(bool mockIsAOwner, bool isAOwner) external {
        _mockIsOwner = mockIsAOwner;
        _isOwner = isAOwner;
    }

    function getBorrower() public view returns (address) {
        return _borrower;
    }

    function mockSettings(address settingsAddress) public {
        _setSettings(settingsAddress);
    }

    function mockBorrowerAndStatus(address borrower, TellerCommon.LoanStatus loanStatus) public {
        _borrower = borrower;
        _loanStatus = loanStatus;
    }

    function isOwner() public view returns (bool) {
        if (_mockIsOwner) {
            return _isOwner;
        } else {
            return super.isOwner();
        }
    }

    function externalIsOwner() external onlyOwner() {}

    function testImplementationFunctionMultiply(uint256 num1, uint256 num2) external pure returns (uint256) {
        return num1 * num2;
    }

    function getLoan() public view returns (TellerCommon.Loan memory) {
        return
            TellerCommon.Loan({
                id: 0,
                loanTerms: TellerCommon.LoanTerms({
                    borrower: msg.sender,
                    recipient: address(0x0),
                    interestRate: 0,
                    collateralRatio: 0,
                    maxLoanAmount: 0,
                    duration: 0
                }),
                termsExpiry: 0,
                loanStartTime: 0,
                collateral: 0,
                lastCollateralIn: 0,
                principalOwed: 0,
                interestOwed: 0,
                borrowedAmount: 0,
                status: _loanStatus,
                liquidated: false
            });
    }
}
