pragma solidity 0.5.17;
pragma experimental ABIEncoderV2;

// Contracts
import "../../BaseEscrowDapp.sol";

// Common
import "../../../util/AddressLib.sol";

// External Libraries
import "@openzeppelin/contracts-ethereum-package/contracts/utils/Address.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/SafeERC20.sol";

// Interfaces
import "./IYearn.sol";
import "../../../providers/yearn/IVault.sol";

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
    @notice This contract is used to define the yVault dApp actions available. All dapp actions are invoked via
        delegatecalls from Escrow contract, so this contract's state is really Escrow.
    @author develop@teller.finance
 */
contract Yearn is IYearn, BaseEscrowDapp {
    using AddressLib for address;
    using Address for address;
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    /** External Functions */
    /**
        @notice Deposits the specified amount of the native unwrapped token (same as token() returns) into the Vault
        @param tokenAddress The address of the token being deposited
        @param amount The amount of tokens to be deposited into the vault
     */
    function deposit(address tokenAddress, uint256 amount) public onlyBorrower {
        IVault iVault = _getYVault(tokenAddress);
        uint256 tokenBalanceBeforeDeposit = iVault.balanceOf(address(this));
        IERC20(tokenAddress).safeApprove(address(iVault), amount);
        iVault.deposit(amount);
        uint256 tokenBalanceAfterDeposit = iVault.balanceOf(address(this));
        require(
            tokenBalanceAfterDeposit > tokenBalanceBeforeDeposit,
            "YEARN_BALANCE_NOT_INCREASED"
        );
        _tokenUpdated(tokenAddress);
        emit YearnDeposited(
            tokenAddress,
            address(iVault),
            amount,
            tokenBalanceBeforeDeposit,
            tokenBalanceAfterDeposit
        );
    }

    /**
        @notice Withdraws the specified amount of the native unwrapped token (same as token() returns) from the Vault
        @param tokenAddress The address of the token being deposited
        @param amount The amount of tokens to be deposited into the vault
     */
    function withdraw(address tokenAddress, uint256 amount)
        public
        onlyBorrower
    {
        IVault iVault = _getYVault(tokenAddress);
        uint256 price = iVault.getPricePerShare();
        uint256 shares = amount / price;
        uint256 tokenBalanceBeforeWithdrawal =
            ERC20(tokenAddress).balanceOf(address(this));
        require(
            shares >= iVault.balanceOf(address(this)),
            "INSUFFICIENT_DEPOSIT"
        );
        iVault.withdraw(shares);
        uint256 tokenBalanceAfterWithdrawal =
            ERC20(tokenAddress).balanceOf(address(this));
        require(
            tokenBalanceAfterWithdrawal > tokenBalanceBeforeWithdrawal,
            "WITHDRAWAL_UNSUCCESSFUL"
        );

        _tokenUpdated(address(iVault));

        emit YearnWithdrawn(
            iVault.token(),
            address(iVault),
            amount,
            tokenBalanceBeforeWithdrawal,
            tokenBalanceAfterWithdrawal
        );
    }

    /**
        @notice Redeems all funds from a yVault from a previous deposit
        @param tokenAddress The address of the token being deposited
     */
    function withdrawAll(address tokenAddress) public onlyBorrower {
        IVault iVault = _getYVault(tokenAddress);
        uint256 tokenBalanceBeforeWithdrawal =
            ERC20(tokenAddress).balanceOf(address(this));
        iVault.withdraw();
        uint256 tokenBalanceAfterWithdrawal =
            ERC20(tokenAddress).balanceOf(address(this));
        require(
            tokenBalanceAfterWithdrawal > tokenBalanceBeforeWithdrawal,
            "WITHDRAWAL_UNSUCCESSFUL"
        );
        emit YearnWithdrawn(
            iVault.token(),
            address(iVault),
            tokenBalanceBeforeWithdrawal,
            tokenBalanceBeforeWithdrawal,
            tokenBalanceAfterWithdrawal
        );
    }

    /**
        @notice Returns the price of the Vault's wrapped token, denominated in the unwrapped native token
        @notice Calculation is: nativeTokenBalance/yTokenTotalSupply,
            - nativeTokenBalance is the current balance of the native token (example DAI) in the Vault
            - yTokenTotalSupply is the total supply of the Vault's wrapped token (example yDAI)
        @param tokenAddress The address of the underlying token for the associated yVault
        @return The token price
     */
    function getPricePerFullShare(address tokenAddress)
        external
        view
        returns (uint256)
    {
        IVault iVault = _getYVault(tokenAddress);
        return iVault.getPricePerFullShare();
    }

    /** Internal Functions */

    /**
        @notice Grabs the yVault address for a token from the asset settings
        @param tokenAddress The underlying token address for the associated yVault
        @return yVault instance
     */
    function _getYVault(address tokenAddress) internal view returns (IVault) {
        return IVault(settings.assetSettings().getYVaultAddress(tokenAddress));
    }
}
