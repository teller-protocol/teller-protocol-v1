pragma solidity 0.5.17;

// External Libraries
import "@openzeppelin/contracts-ethereum-package/contracts/utils/Address.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/SafeERC20.sol";

// Common
import "../../../util/AddressLib.sol";

// Contracts
import "../../BaseEscrowDapp.sol";

// Interfaces
import "./IUniswap.sol";
import "../../../providers/uniswap/IUniswapV2Router02.sol";

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
    @notice This contract is used to define Uniswap dApp actions available. All dapp actions are invoked via 
        delegatecalls from Escrow contract, so this contract's state is really Escrow.
    @author develop@teller.finance
 */
contract Uniswap is IUniswap, BaseEscrowDapp {
    using AddressLib for address;
    using Address for address;
    using SafeERC20 for IERC20;

    /* Constants */
    /**
        @notice Based on the docs https://uniswap.org/docs/v2/smart-contracts/router02/ the Router V2 instance is deployed on the same address in the testnets and mainnet. So, we can hardcode the address here.
     */
    IUniswapV2Router02 public constant router = IUniswapV2Router02(
        0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D
    );

    // State is shared with Escrow contract as it uses delegateCall() to interact with this contract.

    /**
        @notice Swaps ETH/Tokens for Tokens/ETH using different Uniswap v2 Router 02 methods.
        @param path An array of token addresses. path.length must be >= 2. Pools for each consecutive pair of addresses must exist and have liquidity.
        @param sourceAmount amount of source token to swap.
        @param minDestination The minimum amount of output tokens that must be received for the transaction not to revert.
     */
    function swap(
        address[] memory path,
        uint256 sourceAmount,
        uint256 minDestination
    ) public onlyOwner() {
        _swap(router, path, sourceAmount, minDestination);
    }

    /* Internal Functions */

    /**
        @notice Swaps ETH/Tokens for Tokens/ETH using different Uniswap v2 Router 02 methods.
        @param theRouter The UniswapV2Router instance.
        @param path An array of token addresses. path.length must be >= 2. Pools for each consecutive pair of addresses must exist and have liquidity.
        @param sourceAmount amount of source token to swap.
        @param minDestination The minimum amount of output tokens that must be received for the transaction not to revert.
     */
    function _swap(
        IUniswapV2Router02 theRouter,
        address[] memory path,
        uint256 sourceAmount,
        uint256 minDestination
    ) internal {
        require(path.length >= 2, "UNI_PATH_TOO_SHORT");
        address source = path[0];
        address destination = path[path.length - 1];

        require(
            _getSettings().chainlinkAggregator().isTokenSupported(source),
            "UNI_SRC_NOT_SUPPORTED"
        );
        require(
            _getSettings().chainlinkAggregator().isTokenSupported(destination),
            "UNI_DST_NOT_SUPPORTED"
        );

        require(_balanceOf(source) >= sourceAmount, "UNI_INSUFFICIENT_SRC");
        source.requireNotEqualTo(destination, "UNI_SRC_DST_SAME");
        require(minDestination > 0, "UNI_MIN_DST_ZERO"); // what if there is no minimum?

        uint256 balanceBeforeSwap = _balanceOf(destination);

        IERC20(source).safeIncreaseAllowance(address(theRouter), sourceAmount);
        uint256[] memory amounts = theRouter.swapExactTokensForTokens(
            sourceAmount,
            minDestination,
            path,
            address(this),
            now
        );

        uint256 balanceAfterSwap = _balanceOf(destination);
        require(
            balanceAfterSwap >= (balanceBeforeSwap + minDestination),
            "UNI_BALANCE_NOT_INCREASED"
        );
        require(amounts.length == path.length, "UNI_ERROR_SWAPPING");
        uint256 destinationAmount = amounts[amounts.length - 1];

        _tokenUpdated(source);
        _tokenUpdated(destination);

        emit UniswapSwapped(source, destination, sourceAmount, destinationAmount);
    }
}
