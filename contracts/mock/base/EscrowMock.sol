pragma solidity 0.5.17;
pragma experimental ABIEncoderV2;

import "../../base/Escrow.sol";

contract EscrowMock is Escrow {
    bool private _mockIsBorrower;
    bool public isBorrower;

    function mockIsBorrower(bool mockIsABorrower, bool isABorrower) external {
        _mockIsBorrower = mockIsABorrower;
        isBorrower = isABorrower;
    }

    function mockInitialize(
        address settingsAddress,
        address loansAddress,
        uint256 aLoanID
    ) external {
        settings = SettingsInterface(settingsAddress);
        loans = LoansInterface(loansAddress);
        loanID = aLoanID;
    }

    function _isBorrower() internal view returns (bool) {
        if (_mockIsBorrower) {
            return isBorrower;
        } else {
            return super._isBorrower();
        }
    }

    function externalIsBorrower() external onlyBorrower() {}

    function testImplementationFunctionRevert(string calldata message) external {
        revert(message);
    }

    function testImplementationFunctionMultiply(uint256 num1, uint256 num2) external returns (uint256) {
        return num1 * num2;
    }
}
