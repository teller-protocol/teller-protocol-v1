pragma solidity 0.5.17;
pragma experimental ABIEncoderV2;

import "../../base/Escrow.sol";

contract EscrowMock is Escrow {
    bool private _mockIsOwner;
    bool public _isOwner;
    address public _borrower;

    function mockIsOwner(bool mockIsAOwner, bool isAOwner) external {
        _mockIsOwner = mockIsAOwner;
        _isOwner = isAOwner;
    }

    // function mockInitialize(
    //     address settingsAddress,
    //     address loansAddress,
    //     uint256 aLoanID
    // ) external {
    //     settings = SettingsInterface(settingsAddress);
    //     loans = LoansInterface(loansAddress);
    //     loanID = aLoanID;
    // }

    function getBorrower() public view returns (address) {
        return _borrower;
    }

    function mockBorrower(address borrower) public {
        _borrower = borrower;
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
}
