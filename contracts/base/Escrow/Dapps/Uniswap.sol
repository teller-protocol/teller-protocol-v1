pragma solidity 0.5.17;

// External Libraries
import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/utils/Address.sol";

// Common
import "../../../util/AddressLib.sol";

// Contracts

// Interfaces
import "./IUniswap.sol";
import "./IUniswapV2Router02.sol";

/**
    @notice This contract is used to define Uniswap dApp actions available.
    @author develop@teller.finance
 */
contract Uniswap is IUniswap {
    using AddressLib for address;
    using Address for address;

    /* Constants */
    uint8 public constant NO_MINIMUM_OUTPUT_REQUIRED = 0;
    address public constant ETH_ADDRESS = 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;

    /* State Variables */
    // State is shared with Escrow contract as it uses delegateCall() to interact with this contract.
    
    /**
        @notice Swaps ETH or Tokens for Tokens or ETH using different Uniswap Router v 02 methods.
        @param routerAddress address of the Uniswap Router v02.
        @param path An array of token addresses. path.length must be >= 2. Pools for each consecutive pair of addresses must exist and have liquidity.
        @param sourceAmount amount of source element (ETH or Tokens).
        @param minDestination The minimum amount of output tokens that must be received for the transaction not to revert.
     */
    function swap(
        address routerAddress,
        address[] memory path,
        uint sourceAmount,
        uint minDestination
    ) internal {
        require(routerAddress.isContract(), "ROUTER_MUST_BE_A_CONTRACT");
        IUniswapV2Router02 router = IUniswapV2Router02(routerAddress);
        require(path.length >= 2, "UNISWAP_PATH_TOO_SHORT");
        address source = path[0];
        address destination = path[path.length - 1];

        source.requireNotEqualTo(destination, "UNISWAP_SOURCE_AND_DESTINATION_SAME");
        require(minDestination > 0, "UNISWAP_MIN_DESTINATION_ZERO"); // what if there is no minimum?

        // TODO: check destination amount >= minDestination // This is checked by UniswapRouter, should we check here also?
        uint256[] memory amounts;
        if (ETH_ADDRESS == source) {
            require(address(this).balance >= sourceAmount, "UNISWAP_INSUFFICIENT_ETH");
            amounts = router.swapExactETHForTokens.value(sourceAmount)(
                minDestination,
                path,
                address(this),
                now
            ); 
        } else {
            require(
                IERC20(source).balanceOf(address(this)) >= sourceAmount,
                "UNISWAP_INSUFFICIENT_TOKENS"
            );

            if (ETH_ADDRESS == destination) {
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
        require(amounts.length == path.length , "UNISWAP_ERROR_SWAPPING");
        uint256 amountReceived = amounts[amounts.length - 1];
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
