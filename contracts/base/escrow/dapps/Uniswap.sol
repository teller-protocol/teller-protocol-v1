pragma solidity 0.5.17;

// External Libraries
import "@openzeppelin/contracts-ethereum-package/contracts/utils/Address.sol";

// Common
import "../../../util/AddressLib.sol";

// Contracts

// Interfaces
import "./IUniswap.sol";
import "../../../providers/uniswap/IUniswapV2Router02.sol";
import "../../BaseEscrowDapp.sol";

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

    /* State Variables */
    // State is shared with Escrow contract as it uses delegateCall() to interact with this contract.

    /**
        @notice Swaps ETH/Tokens for Tokens/ETH using different Uniswap v2 Router 02 methods.
        @param canonicalWeth address of the canonical WETH in the current network.
        @param routerAddress address of the Uniswap Router v02.
        @param path An array of token addresses. path.length must be >= 2. Pools for each consecutive pair of addresses must exist and have liquidity.
        @param sourceAmount amount of source element (ETH or Tokens) to swap.
        @param minDestination The minimum amount of output tokens that must be received for the transaction not to revert.
        @dev This function mainly invokes 3 Uniswap external functions:
            https://uniswap.org/docs/v2/smart-contracts/router02/#swapexactethfortokens
            https://uniswap.org/docs/v2/smart-contracts/router02/#swapexacttokensforeth
            https://uniswap.org/docs/v2/smart-contracts/router02/#swapexacttokensfortokens
     */
    function swap(
        address canonicalWeth,
        address routerAddress,
        address[] memory path,
        uint256 sourceAmount,
        uint256 minDestination
    ) public {
        require(canonicalWeth.isContract(), "CANONICAL_WETH_MUST_BE_CONTRACT");
        require(routerAddress.isContract(), "ROUTER_MUST_BE_A_CONTRACT");
        IUniswapV2Router02 router = IUniswapV2Router02(routerAddress);

        require(path.length >= 2, "UNISWAP_PATH_TOO_SHORT");
        address source = path[0];
        address destination = path[path.length - 1];

        source.requireNotEqualTo(destination, "UNISWAP_SOURCE_AND_DESTINATION_SAME");
        require(minDestination > 0, "UNISWAP_MIN_DESTINATION_ZERO"); // what if there is no minimum?

        uint256[] memory amounts;
        uint256 balanceBeforeSwap = _balanceOf(destination);

        if (source == canonicalWeth) {
            require(address(this).balance >= sourceAmount, "UNISWAP_INSUFFICIENT_ETH");
            amounts = router.swapExactETHForTokens.value(sourceAmount)(
                minDestination,
                path,
                address(this),
                now
            );
        } else {
            require(_balanceOf(source) >= sourceAmount, "UNISWAP_INSUFFICIENT_TOKENS");
            IERC20(source).approve(routerAddress, sourceAmount);
            if (destination == canonicalWeth) {
                amounts = router.swapExactTokensForETH(
                    sourceAmount,
                    minDestination,
                    path,
                    address(this),
                    now
                );
            } else {
                amounts = router.swapExactTokensForTokens(
                    sourceAmount,
                    minDestination,
                    path,
                    address(this),
                    now
                );
            }
        }

        uint256 balanceAfterSwap = _balanceOf(destination);
        require(
            balanceAfterSwap >= (balanceBeforeSwap + minDestination),
            "UNISWAP_BALANCE_NOT_INCREASED"
        );
        require(amounts.length == path.length, "UNISWAP_ERROR_SWAPPING");
        uint256 amountReceived = amounts[amounts.length - 1];

        _tokenUpdated(source);
        _tokenUpdated(destination);

        emit UniswapSwapped(
            msg.sender,
            address(this),
            source,
            destination,
            sourceAmount,
            amountReceived
        );
    }
}
