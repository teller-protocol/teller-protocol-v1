pragma solidity 0.5.17;
pragma experimental ABIEncoderV2;

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
        @param tokenAddress address of the token.
        @param amount amount of tokens to mint.
    */
    function lend(address tokenAddress, uint256 amount) public onlyOwner() {
        require(_balanceOf(tokenAddress) >= amount, "COMPOUND_INSUFFICIENT_UNDERLYING");

        CErc20Interface cToken = _getCToken(tokenAddress);
        uint256 balanceBeforeMint = cToken.balanceOf(address(this));
        IERC20(tokenAddress).approve(address(cToken), amount);
        uint256 result = cToken.mint(amount);
        require(result == 0, "COMPOUND_DEPOSIT_ERROR");

        uint256 balanceAfterMint = cToken.balanceOf(address(this));
        require(
            balanceAfterMint >= balanceBeforeMint,
            "COMPOUND_BALANCE_NOT_INCREASED"
        );

        _tokenUpdated(address(cToken));
        _tokenUpdated(tokenAddress);

        uint256 underlyingBalance = _balanceOf(tokenAddress);
        emit CompoundLended(
            msg.sender,
            address(this),
            amount,
            address(cToken),
            balanceAfterMint,
            tokenAddress,
            underlyingBalance
        );
    }

    /**
        @notice This function calls Compound redeemUnderlying().
        @param tokenAddress address of the token.
        @param amount amount of underlying tokens to redeem.
    */
    function redeem(address tokenAddress, uint256 amount) public onlyOwner() {
        CErc20Interface cToken = _getCToken(tokenAddress);
        uint256 balanceBeforeRedeem = _balanceOf(tokenAddress);
        uint256 result = cToken.redeem(amount);
        require(result == 0, "COMPOUND_WITHDRAWAL_ERROR");

        uint256 balanceAfterRedeem = _balanceOf(tokenAddress);
        require(
            balanceAfterRedeem >= balanceBeforeRedeem,
            "COMPOUND_BALANCE_NOT_INCREASED"
        );

        _tokenUpdated(address(cToken));
        _tokenUpdated(tokenAddress);

        uint256 cTokenBalanceAfterRedeem = cToken.balanceOf(address(this));
        emit CompoundRedeemed(
            msg.sender,
            address(this),
            amount,
            address(cToken),
            cTokenBalanceAfterRedeem,
            tokenAddress,
            balanceAfterRedeem
        );
    }

    /**
        @notice This function redeems complete token balance.
        @param tokenAddress address of the token.
    */
    function redeemAll(address tokenAddress) public onlyOwner() {
        uint256 amount = _balanceOf(settings().getCTokenAddress(tokenAddress));
        redeem(tokenAddress, amount);
    }

    /* Internal Functions */

    /**
        @notice Grabs the cToken address for an token from the asset settings.
        @notice The cToken underlying address must match the supplied token address.
        @param tokenAddress The token address to get the cToken for.
        @return cToken instance
     */
    function _getCToken(address tokenAddress) internal view returns (CErc20Interface cToken) {
        address cTokenAddress = settings().getCTokenAddress(tokenAddress);
        require(cTokenAddress.isContract(), "CTOKEN_ADDRESS_MUST_BE_CONTRACT");

        cToken = CErc20Interface(cTokenAddress);
        require(cToken.underlying() == tokenAddress, "UNDERLYING_ADDRESS_NOT_MATCH");
    }
}
