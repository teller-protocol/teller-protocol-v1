pragma solidity 0.5.17;

import "../../token/ERC20Mock.sol";

contract CERC20Mock is ERC20Mock {
    uint8 public constant CTOKEN_DECIMALS = 8;
    uint256 public constant NO_ERROR = 0;
    uint256 public constant RETURN_ERROR = 9999;
    uint256 public constant SIMULATE_COMPOUND_MINT_RETURN_ERROR = 88888888;
    uint256 public constant SIMULATE_COMPOUND_MINT_ERROR = 77777777;
    uint256 public constant SIMULATE_COMPOUND_REDEEM_UNDERLYING_RETURN_ERROR = 66666666;
    uint256 public constant SIMULATE_COMPOUND_REDEEM_UNDERLYING_ERROR = 55555555;

    IERC20 public underlying;
    uint256 public multiplier;

    constructor(
        string memory aName,
        string memory aSymbol,
        uint8 aDecimals,
        address underlyingToken,
        uint256 multiplierValue
    ) public ERC20Mock(aName, aSymbol, aDecimals, 0) {
        require(underlyingToken != address(0x0), "PROVIDE_UNDERLYIG_TOKEN");
        require(multiplierValue > 0, "PROVIDE_MULTIPLIER");
        underlying = IERC20(underlyingToken);
        multiplier = multiplierValue;
    }

    function mint(uint256 mintAmount) external returns (uint256) {
        if (SIMULATE_COMPOUND_MINT_ERROR == mintAmount) {
            return NO_ERROR;
        }
        uint256 cAmount = _getCTokensAmount(mintAmount);
        underlying.transferFrom(msg.sender, address(this), mintAmount);
        require(super.mint(msg.sender, cAmount), "CTOKEN_MINT_FAILED");
        if (SIMULATE_COMPOUND_MINT_RETURN_ERROR == mintAmount) {
            return RETURN_ERROR;
        }
        return NO_ERROR;
    }

    function redeem(uint256 redeemTokens) external returns (uint256) {
        underlying;
        redeemTokens;
        _mockChange();
        return NO_ERROR;
    }

    // https://compound.finance/docs/ctokens#redeem-underlying
    function redeemUnderlying(uint256 redeemAmount) external returns (uint256) {
        if (SIMULATE_COMPOUND_REDEEM_UNDERLYING_ERROR == redeemAmount) {
            redeemAmount = 1;
        }
        uint256 tokenAmount = _getTokensAmount(redeemAmount);
        require(super.transfer(msg.sender, tokenAmount), "UNDERLYING_TRANSFER_FAILED");
        super.burn(redeemAmount);
        require(
            ((ERC20Mock(address(underlying))).mint(msg.sender, redeemAmount)),
            "UNDERLYING_MINT_FAILED"
        );
        if (SIMULATE_COMPOUND_REDEEM_UNDERLYING_RETURN_ERROR == redeemAmount) {
            return RETURN_ERROR;
        }
        return NO_ERROR;
    }

    function borrow(uint256 borrowAmount) external returns (uint256) {
        underlying;
        borrowAmount;
        _mockChange();
        return NO_ERROR;
    }

    function repayBorrow(uint256 repayAmount) external returns (uint256) {
        underlying;
        repayAmount;
        _mockChange();
        return NO_ERROR;
    }

    function repayBorrowBehalf(address borrower, uint256 repayAmount)
        external
        returns (uint256)
    {
        underlying;
        borrower;
        repayAmount;
        _mockChange();
        return NO_ERROR;
    }

    function liquidateBorrow(
        address borrower,
        uint256 repayAmount,
        address cTokenCollateral
    ) external returns (uint256) {
        underlying;
        borrower;
        repayAmount;
        cTokenCollateral;
        _mockChange();
        return NO_ERROR;
    }

    /*** Admin Functions ***/

    function _addReserves(uint256 addAmount) external returns (uint256) {
        underlying;
        addAmount;
        _mockChange();
        return NO_ERROR;
    }

    function _getCTokensAmount(uint256 tokenAmount) internal view returns (uint256) {
        return _exchangeRateCurrent() * tokenAmount;
    }

    function _getTokensAmount(uint256 cTokenAmount) internal view returns (uint256) {
        uint256 exchangeRateCurrent = _exchangeRateCurrent();
        return exchangeRateCurrent == 0 ? 0 : cTokenAmount / exchangeRateCurrent;
    }

    function _mockChange() internal {}

    function exchangeRateCurrent() external view returns (uint256) {
        return _exchangeRateCurrent();
    }

    function _exchangeRateCurrent() internal view returns (uint256) {
        return block.number == 0 ? 0 : block.number / multiplier;
    }

    function balanceOfUnderlying(address account) external view returns (uint256) {
        return balanceOf(account);
    }
}
