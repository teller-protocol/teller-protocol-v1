pragma solidity 0.5.17;

// External Libraries
import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/IERC20.sol";
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

    /* State Variables */
    // State is shared with Escrow contract as it uses delegateCall() to interact with this contract.

    /**
        @notice To lend we first have to approve the cToken to access the token balance then mint. 
        @param cTokenAddress address of the token.
        @param amount amount of tokens to mint. 
    */
    function lend(address cTokenAddress, uint256 amount) public onlyOwner() {
        require(cTokenAddress.isContract(), "CTOKEN_ADDRESS_MUST_BE_CONTRACT");
        CErc20Interface cToken = CErc20Interface(cTokenAddress);
        uint256 balanceBeforeMint = cToken.balanceOf(address(this));
        IERC20 underlying = IERC20(cToken.underlying());
        require(
            underlying.balanceOf(address(this)) >= amount,
            "COMPOUND_INSUFFICIENT_UNDERLYING"
        );

        underlying.approve(cTokenAddress, amount);
        uint256 result = cToken.mint(amount);
        require(result == 0, "COMPOUND_DEPOSIT_ERROR");

        uint256 balanceAfterMint = cToken.balanceOf(address(this));
        require(
            balanceAfterMint >= (balanceBeforeMint + amount),
            "COMPOUND_BALANCE_NOT_INCREASED"
        );

        _tokenUpdated(cTokenAddress);
        _tokenUpdated(address(underlying));

        uint256 underlyingBalance = underlying.balanceOf(address(this));
        emit CompoundLended(
            msg.sender,
            address(this),
            amount,
            cTokenAddress,
            balanceAfterMint,
            address(underlying),
            underlyingBalance
        );
    }

    /**
        @notice This function calls Compound redeemUnderlying().
        @param cTokenAddress address of the token.
        @param amount amount of underlying tokens to redeem.
    */
    function redeem(address cTokenAddress, uint256 amount) public onlyOwner() {
        require(cTokenAddress.isContract(), "CTOKEN_ADDRESS_MUST_BE_CONTRACT");
        require(_balance(cTokenAddress) >= amount, "COMPOUND_INSUFFICIENT_BALANCE");
        CErc20Interface cToken = CErc20Interface(cTokenAddress);
        IERC20 underlying = IERC20(cToken.underlying());
        uint256 balanceBeforeRedeem = underlying.balanceOf(address(this));

        uint256 result = cToken.redeemUnderlying(amount);
        require(result == 0, "COMPOUND_WITHDRAWAL_ERROR");

        uint256 underlyingBalanceAfterRedeem = underlying.balanceOf(address(this));
        require(
            underlyingBalanceAfterRedeem >= (balanceBeforeRedeem + amount),
            "COMPOUND_BALANCE_NOT_INCREASED"
        );

        _tokenUpdated(cTokenAddress);
        _tokenUpdated(address(underlying));

        uint256 cTokenBalanceAfterRedeem = cToken.balanceOf(address(this));
        emit CompoundRedeemed(
            msg.sender,
            address(this),
            amount,
            cTokenAddress,
            cTokenBalanceAfterRedeem,
            address(underlying),
            underlyingBalanceAfterRedeem
        );
    }

    /**
        @notice This function redeems complete token balance.
        @param cTokenAddress address of the token.
    */
    function redeemAll(address cTokenAddress) public onlyOwner() {
        uint256 amount = _balanceOf(cTokenAddress);
        redeem(cTokenAddress, amount);
    }
}
