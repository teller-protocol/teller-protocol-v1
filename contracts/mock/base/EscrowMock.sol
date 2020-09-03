pragma solidity 0.5.17;
pragma experimental ABIEncoderV2;

import "../../base/Escrow.sol";
import "../../util/TellerCommon.sol";
import "./BaseEscrowDappMock.sol";

contract EscrowMock is Escrow, BaseEscrowDappMock {
    bool private _mockIsOwner;
    bool public _isOwner;
    address public _borrower;
    TellerCommon.LoanStatus public _loanStatus;
    address internal mockedAggregator;
    bool internal mockedCanPurchase;

    bool private _mockValueOfIn;

    mapping(address => mapping(address => uint256)) public _valueOfInMapMock;

    function externalSetSettings(address settingsAddress) external {
        _setSettings(settingsAddress);
    }

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

    function mockLoans(address loansAddress) external {
        loans = LoansInterface(loansAddress);
    }

    function mockCanPurchase() external {
        mockedCanPurchase = true;
    }

    function mockInitialize(address loansAddress, uint256 aLoanID) external {
        loans = LoansInterface(loansAddress);
        loanID = aLoanID;

        Ownable.initialize(msg.sender);
        TInitializable._initialize();
    }

    function mockValueOfIn(address base, address quote, uint256 value) external {
        _mockValueOfIn = true;
        _valueOfInMapMock[base][quote] = value;
    }

    function externalValueOfIn(address baseAddress, address quoteAddress, uint256 baseAmount) external returns (uint256) {
        return super._valueOfIn(baseAddress, quoteAddress, baseAmount);
    }

    function _valueOfIn(address baseAddress, address quoteAddress, uint256 baseAmount) internal view returns (uint256) {
        if (_mockValueOfIn) {
            return _valueOfInMapMock[baseAddress][quoteAddress];
        } else {
            return Escrow._valueOfIn(baseAddress, quoteAddress, baseAmount);
        }
    }

    function mockGetAggregatorFor(address aggregatorAddress) external {
        mockedAggregator = aggregatorAddress;
    }

    function _getAggregatorFor(address base, address quote) internal view returns (PairAggregatorInterface) {
        if (mockedAggregator != address(0x0)) {
            return PairAggregatorInterface(mockedAggregator);
        } else {
            return super._getAggregatorFor(base, quote);
        }
    }

    function externalGetAggregatorFor(address base, address quote) external returns (PairAggregatorInterface) {
        return _getAggregatorFor(base, quote);
    }
}
