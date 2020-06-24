pragma solidity 0.5.17;

import "../../token/ERC20Mock.sol";

contract CERC20Mock is ERC20Mock {
    uint8 constant public CTOKEN_DECIMALS = 8;
    uint256 constant public NO_ERROR = 0;

    ERC20Detailed public underlying;
    uint256 public multiplier;

    constructor(string memory aName, string memory aSymbol, uint8 aDecimals, address underlyingToken, uint256 multiplierValue)
        public
        ERC20Mock(aName, aSymbol, aDecimals, 0) {
        require(underlyingToken != address(0x0), "PROVIDE_UNDERLYIG_TOKEN");
        require(multiplierValue > 0, "PROVIDE_MULTIPLIER");
        underlying = ERC20Detailed(underlyingToken);
        multiplier = multiplierValue;
    }

    function mint(uint256 mintAmount) external returns (uint256) {
        uint256 cAmount = _getCTokensAmount(mintAmount);
        require(
            super.mint(msg.sender, cAmount),
            "CTOKEN_MINT_FAILED"
        );
        return NO_ERROR;
    }

    function redeem(uint256 redeemTokens) external returns (uint256) {
        underlying;
        redeemTokens;
        _mockChange();
        return 1;
    }

    function redeemUnderlying(uint256 redeemAmount) external returns (uint256) {
        uint256 tokenAmount = _getTokensAmount(redeemAmount);
        require(
            super.transfer(msg.sender, tokenAmount),
            "UNDERLYING_TRANSFER_FAILED"
        );
        return NO_ERROR;
    }

    function borrow(uint256 borrowAmount) external returns (uint256) {
        underlying;
        borrowAmount;
        _mockChange();
        return 1;
    }

    function repayBorrow(uint256 repayAmount) external returns (uint256) {
        underlying;
        repayAmount;
        _mockChange();
        return 1;
    }

    function repayBorrowBehalf(address borrower, uint256 repayAmount)
        external
        returns (uint256) {
            underlying;
            borrower;
            repayAmount;
            _mockChange();
            return 1;
        }

    function liquidateBorrow(address borrower, uint repayAmount, address cTokenCollateral) external returns (uint) {
        underlying;
        borrower;
        repayAmount;
        cTokenCollateral;
        _mockChange();
        return 1;
    }

    /*** Admin Functions ***/

    function _addReserves(uint256 addAmount) external returns (uint256) {
        underlying;
        addAmount;
        _mockChange();
        return 1;
    }

    function _getCTokensAmount(uint256 tokenAmount) internal view returns (uint256) {
        return multiplier * tokenAmount;
    }

    function _getTokensAmount(uint256 cTokenAmount) internal view returns (uint256) {
        return cTokenAmount / multiplier;
    }

    function _mockChange() internal {
        
    }
}
