pragma solidity 0.5.17;
pragma experimental ABIEncoderV2;

// Contracts
import "../../BaseEscrowDapp.sol";

// External Libraries
import "@openzeppelin/contracts-ethereum-package/contracts/utils/Address.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/SafeERC20.sol";

// Interfaces
import "./YVaultInterface.sol";
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
contract YVault is YVaultInterface, BaseEscrowDapp {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;
    

    /** External Functions */
    /**
        @notice Deposits the specified amount of the native unwrapped token (same as token() returns) into the Vault
        @param tokenAddress The address of the token being deposited
        @param amount The amount of tokens to be deposited into the vault
     */
    function deposit(
        address tokenAddress,
        uint256 amount
    )
        public
        onlyOwner()
    {
        IVault iVault = _getYVault(tokenAddress);
        IERC20 underlyingToken = IERC20(iVault.underlying());
        uint256 tokenBalanceBeforeDeposit = underlyingToken.balanceOf(address(this));
        IERC20(tokenAddress).safeApprove(address(iVault), amount);
        uint256 result = iVault.deposit(amount);
        require(result == 0, "YEARN_DEPOSIT_ERROR");
        uint256 tokenBalanceAfterDeposit = underlyingToken.balanceOf(address(this));
        require(
            tokenBalanceAfterDeposit > tokenBalanceBeforeDeposit,
            "YEARN_BALANCE_NOT_INCREASED"
        );
        _tokenUpdated(tokenAddress);

        emit YearnDeposited(
            tokenAddress,
            address(iVault),
            amount,
            tokenBalanceAfterDeposit
        );
    }

    /**
        @notice Withdraws the specified amount of the native unwrapped token (same as token() returns) from the Vault
        @param tokenAddress The address of the token being deposited
        @param amount The amount of tokens to be deposited into the vault
     */
    function withdraw(
        address tokenAddress,
        uint256 amount
    ) 
        public
        onlyOwner()
    {
        IVault iVault = _getYVault(tokenAddress);
        _withdraw(iVault, amount);
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
        public
        view
        returns (uint256)
    {
        IVault iVault = _getYVault(tokenAddress);
        return iVault.getPricePerFullShare();
    }

    /** Internal Functions */
    /**
        @notice Redeems funds from a yVault from a previous deposit
        @param iVault The instance of the yVault
        @param amount The amount of funds to withdraw from the vault
     */
    function _withdraw(
        IVault iVault,
        uint256 amount
    )
        internal
    {   
        IERC20 underlyingToken = IERC20(iVault.underlying());
        uint256 tokenBalanceBeforeWithdrawal = underlyingToken.balanceOf(address(this));
        uint256 result = iVault.withdraw(amount);
        require(result == 0, "YEARN_WITHDRAWAL_ERROR");
        uint256 tokenBalanceAfterWithdrawl = underlyingToken.balanceOf(address(this));
        require(tokenBalanceAfterWithdrawl > tokenBalanceBeforeWithdrawal, "WITHDRAWL_UNSUCCESSFUL");

        _tokenUpdated(underlyingToken);

        emit YearnWithdrawn(
            underlyingToken,
            amount,
            tokenBalanceAfterWithdrawl
        );
    }

    /**
        @notice Grabs the yVault address for a token from the asset settings
        @param tokenAddress The underlying token address for the associated yVault
        @return yVault instance
     */
    function _getYVault(address tokenAddress) 
        internal
        view
        returns (IVault) 
    {
        return IVault(_getSettings().getYVaultAddress(tokenAddress));
    }

}