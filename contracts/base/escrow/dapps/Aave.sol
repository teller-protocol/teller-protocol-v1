pragma solidity 0.5.17;
pragma experimental ABIEncoderV2;

// External Libraries
import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/utils/Address.sol";

//Contracts
import "../../BaseEscrowDapp.sol";

// Interfaces
import "./IAave.sol";
import "../../../providers/aave/IAToken.sol";
import "../../../providers/aave/IAaveLendingPoolAddressesProvider.sol";
import "../../../providers/aave/IAaveLendingPool.sol";

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
    @notice This contract is used to define Aave dApp actions available. All dapp actions are invoked via
        delegatecalls from Escrow contract, so this contract's state is really Escrow.
    @author develop@teller.finance
 */
contract Aave is IAave, BaseEscrowDapp {
    using Address for address;
    using SafeERC20 for IERC20;

    /**
        @notice The deposit, the aToken needs to be approved to have access to the token balance
        @param tokenAddress address of the token
        @param amount amount of tokens to deposit
     */
    function deposit(address tokenAddress, uint256 amount) public onlyOwner() {
        IAToken aToken = _getAToken(tokenAddress);
        IAaveLendingPool aaveLendingPool = _getAavePoolAddress(tokenAddress);
        uint256 aTokenBalanceBeforeDeposit = aToken.balanceOf(address(this));
        IERC20(tokenAddress).safeApprove(address(aaveLendingPool), amount);
        aaveLendingPool.deposit(tokenAddress, amount, address(this), 0);

        uint256 aTokenBalanceAfterDeposit = aToken.balanceOf(address(this));
        require(
            aTokenBalanceAfterDeposit > aTokenBalanceBeforeDeposit,
            "AAVE_BALANCE_NOT_INCREASED"
        );

        _tokenUpdated(address(aToken));
        _tokenUpdated(tokenAddress);

        uint256 tokenBalanceAfterDeposit = _balanceOf(tokenAddress);
        emit AaveDeposited(
            tokenAddress,
            address(aToken),
            amount,
            tokenBalanceAfterDeposit,
            aTokenBalanceAfterDeposit
        );
    }

    /**
        @notice This function withdraws the user's aTokens for a specific amount 
        @param tokenAddress address of the token
        @param amount amount of the underlying tokens to withdraw
     */
    function withdraw(address tokenAddress, uint256 amount) public onlyOwner() {
        IAToken aToken = _getAToken(tokenAddress);
        IAaveLendingPool aaveLendingPool = _getAavePoolAddress(tokenAddress);
        uint256 aTokenBalanceBeforeWithdraw = aToken.balanceOf(address(this));
        require(aTokenBalanceBeforeWithdraw >= 0, "NO_BALANCE_TO_WITHDRAW");
        uint256 result = aaveLendingPool.withdraw(tokenAddress, amount, address(this));
        uint256 aTokenBalanceAfterWithdraw = aToken.balanceOf(address(this));
        require(
            aTokenBalanceAfterWithdraw < aTokenBalanceBeforeWithdraw,
            "AAVE_WITHDRAWAL_ERROR"
        );

        _tokenUpdated(address(aToken));
        _tokenUpdated(tokenAddress);

        uint256 tokenBalanceAfterWithdrawal = _balanceOf(tokenAddress);
        emit AaveWithdrawn(
            tokenAddress,
            address(aToken),
            amount,
            tokenBalanceAfterWithdrawal,
            aTokenBalanceAfterWithdraw
        );
    }

    /**
        @notice Grabs the Aave lending pool instance from the Aave lending pool address provider
        @param tokenAddress The token address to get the lending pool for
        @return IAaveLendingPool instance address
     */
    function _getAavePoolAddress(address tokenAddress)
        internal
        view
        returns (IAaveLendingPool)
    {
        return
            IAaveLendingPool(
                IAaveLendingPoolAddressesProvider(tokenAddress).getLendingPool()
            );
    }

    /**
        @notice Grabs the aToken instance from the lending pool
        @param tokenAddress The underlying asset address to get the aToken for
        @return IAToken instance
     */
    function _getAToken(address tokenAddress) internal view returns (IAToken) {
        return
            IAToken(
                _getAavePoolAddress(tokenAddress)
                    .getReserveData(tokenAddress)
                    .aTokenAddress
            );
    }
}
