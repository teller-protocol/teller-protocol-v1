pragma solidity 0.5.17;
pragma experimental ABIEncoderV2;

// External Libraries
import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/ERC20Detailed.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/utils/Address.sol";

// Common
import "../../../util/AddressLib.sol";

//Contracts
import "../../BaseEscrowDapp.sol";

// Interfaces
import "./ICompound.sol";
import "../../../providers/compound/CErc20Interface.sol";

/*****************************************************************************************************/
/**                                             WARNING                                             **/
/**                      DAPP CONTRACT IS AN EXTENSION OF THE ESCROW CONTRACT                       **/
/**  ---------------------------------------------------------------------------------------------  **/
/**  Because there are multiple dApp contracts, and they all extend the Escrow contract that is     **/
/**  itself upgradeable, they cannot have their own storage variables as they would cause the the   **/
/**  storage slots to be overwritten on the Escrow proxy contract!                                  **/
/**                                                                                                 **/
/**  Visit https://docs.openzeppelin.com/upgrades/2.6/proxies#upgrading-via-the-proxy-pattern for   **/
/**  more information.                                                                              **/
/*****************************************************************************************************/
/**
    @notice This contract is used to define Compound dApp actions available. All dapp actions are invoked via
        delegatecalls from Escrow contract, so this contract's state is really Escrow.
    @author develop@teller.finance
 */
contract Compound is ICompound, BaseEscrowDapp {
    using AddressLib for address;
    using Address for address;
    using SafeERC20 for IERC20;

    /* State Variables */

    /* Error Codes */

    uint256 public constant NO_ERROR = 0;

    // @notice Caller does not have sufficient balance in the ERC-20 contract to complete the desired action.
    uint256 public constant TOKEN_INSUFFICIENT_BALANCE = 13;

    // State is shared with Escrow contract as it uses delegateCall() to interact with this contract.

    /**
        @notice To lend we first have to approve the cToken to access the token balance then mint.
        @param tokenAddress address of the token.
        @param amount amount of tokens to mint.
    */
    function lend(address tokenAddress, uint256 amount) public onlyOwner() {
        require(_balanceOf(tokenAddress) >= amount, "COMPOUND_INSUFFICIENT_UNDERLYING");

        CErc20Interface cToken = _getCToken(tokenAddress);
        uint256 cTokenBalanceBeforeLend = cToken.balanceOf(address(this));
        IERC20(tokenAddress).safeApprove(address(cToken), amount);
        uint256 result = cToken.mint(amount);
        require(result == NO_ERROR, "COMPOUND_DEPOSIT_ERROR");

        uint256 cTokenBalanceAfterLend = cToken.balanceOf(address(this));
        require(
            cTokenBalanceAfterLend > cTokenBalanceBeforeLend,
            "COMPOUND_BALANCE_NOT_INCREASED"
        );

        _tokenUpdated(address(cToken));
        _tokenUpdated(tokenAddress);

        uint256 tokenBalanceAfterLend = _balanceOf(tokenAddress);
        emit CompoundLended(
            tokenAddress,
            address(cToken),
            amount,
            tokenBalanceAfterLend,
            cTokenBalanceAfterLend
        );
    }

    /**
        @notice This function redeems the user's cTokens for a specific amount of the underlying token.
        @param tokenAddress address of the token.
        @param amount amount of underlying tokens to redeem.
    */
    function redeem(address tokenAddress, uint256 amount) public onlyOwner() {
        CErc20Interface cToken = _getCToken(tokenAddress);
        _redeem(cToken, amount, true);
    }

    /**
        @notice This function redeems the complete cToken balance.
        @param tokenAddress address of the token.
    */
    function redeemAll(address tokenAddress) public onlyOwner() {
        CErc20Interface cToken = _getCToken(tokenAddress);
        _redeem(cToken, cToken.balanceOf(address(this)), false);
    }

    /* Internal Functions */

    /**
        @notice This function calls on Compound cToken to redeem an amount of the underlying token.
        @param cToken the instance of the cToken.
        @param amount amount of cToken or underlying token to redeem.
        @param isUnderlying boolean indicating if the amount to redeem is in the underlying token amount.
    */
    function _redeem(
        CErc20Interface cToken,
        uint256 amount,
        bool isUnderlying
    ) internal {
        address tokenAddress = cToken.underlying();
        uint256 tokenBalanceBeforeRedeem = _balanceOf(tokenAddress);
        uint256 result = isUnderlying
            ? cToken.redeemUnderlying(amount)
            : cToken.redeem(amount);
        require(result != TOKEN_INSUFFICIENT_BALANCE, "COMPOUND_INSUFFICIENT_BALANCE");
        require(result == NO_ERROR, "COMPOUND_WITHDRAWAL_ERROR");

        uint256 tokenBalanceAfterRedeem = _balanceOf(tokenAddress);
        bool afterRedeemBalanceCheck = isUnderlying
            ? tokenBalanceAfterRedeem == tokenBalanceBeforeRedeem + amount
            : tokenBalanceAfterRedeem > tokenBalanceBeforeRedeem;
        require(afterRedeemBalanceCheck, "COMPOUND_BALANCE_NOT_INCREASED");

        _tokenUpdated(address(cToken));
        _tokenUpdated(tokenAddress);

        uint256 cTokenBalanceAfterRedeem = cToken.balanceOf(address(this));
        emit CompoundRedeemed(
            tokenAddress,
            address(cToken),
            amount,
            isUnderlying,
            tokenBalanceAfterRedeem,
            cTokenBalanceAfterRedeem
        );
    }

    /**
        @notice Grabs the cToken address for an token from the asset settings.
        @notice The cToken underlying address must match the supplied token address.
        @param tokenAddress The token address to get the cToken for.
        @return cToken instance
     */
    function _getCToken(address tokenAddress) internal view returns (CErc20Interface) {
        return CErc20Interface(_getSettings().getCTokenAddress(tokenAddress));
    }
}
