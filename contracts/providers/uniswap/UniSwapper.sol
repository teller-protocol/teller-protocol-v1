pragma solidity 0.5.17;
pragma experimental ABIEncoderV2;

// Interfaces
import "./IUniswapV2Router02.sol";
import "../../base/BaseStorage.sol";

/*****************************************************************************************************/
/**                                             WARNING                                             **/
/**                              THIS CONTRACT IS AN UPGRADEABLE FACET!                             **/
/**  ---------------------------------------------------------------------------------------------  **/
/**  Do NOT place ANY storage/state variables directly in this contract! If you wish to make        **/
/**  make changes to the state variables used by this contract, do so in its defined Storage        **/
/**  contract that this contract inherits from                                                      **/
/**                                                                                                 **/
/**  Visit https://docs.openzeppelin.com/upgrades/2.6/proxies#upgrading-via-the-proxy-pattern for   **/
/**  more information.                                                                              **/
/*****************************************************************************************************/
/**
 * @notice This contract allows other contracts to extend it and swap tokens via Uniswap using a delegatcall.
 *
 * @author develop@teller.finance
 */
contract UniSwapper is BaseStorage {
    /**
     * @notice Swaps tokens using UniswapV2Router via the platform defined Uniswap contract.
     * @notice Allows for a custom minimum destination amount to be required.
     * @dev See the swap function below.
     */
    function _uniswap(
        address[] memory path,
        uint256 sourceAmount,
        uint256 minDestination
    ) internal returns (uint256) {
        address uniswapV2RouterAddress = settings.getUniswapV2RouterAddress();
        return
            _swap(path, sourceAmount, minDestination, uniswapV2RouterAddress);
    }

    /**
     * @notice Swaps tokens using UniswapV2Router via the platform defined Uniswap contract.
     * @notice Will check Uniswap via the router what the expected minimum destination amount should be.
     * @dev See the swap function below.
     */
    function _uniswap(address[] memory path, uint256 sourceAmount)
        internal
        returns (uint256)
    {
        address uniswapV2RouterAddress = settings.getUniswapV2RouterAddress();
        uint256 minDestination =
            IUniswapV2Router02(uniswapV2RouterAddress).getAmountsOut(
                sourceAmount,
                path
            )[path.length - 1];
        return
            _swap(path, sourceAmount, minDestination, uniswapV2RouterAddress);
    }

    /**
     * @notice Swaps tokens using UniswapV2Router via the platform defined Uniswap contract.
     * @dev The source and destination tokens must be supported by the supplied ChainlinkAggregator.
     * @param path An array of token addresses. path.length must be >= 2. Pools for each consecutive pair of addresses must exist and have liquidity.
     * @param sourceAmount amount of source token to swap.
     * @param minDestination The minimum amount of output tokens that must be received for the transaction not to revert.
     * @param uniswapV2RouterAddress The UniswapV2Router router address to use.
     * @return uint256 The destination amount that was acquired from the swap.
     */
    function _swap(
        address[] memory path,
        uint256 sourceAmount,
        uint256 minDestination,
        address uniswapV2RouterAddress
    ) private returns (uint256) {
        IChainlinkAggregator chainlinkAggregator =
            settings.chainlinkAggregator();
        require(
            chainlinkAggregator.isTokenSupported(path[0]),
            "UNI_SRC_NOT_SUPPORTED"
        );
        require(
            chainlinkAggregator.isTokenSupported(path[path.length - 1]),
            "UNI_DST_NOT_SUPPORTED"
        );

        (, , address uniswap) =
            logicRegistry.getLogicVersion(keccak256("Uniswap"));
        (bool success, bytes memory data) =
            uniswap.delegatecall(
                abi.encodeWithSignature(
                    "swapWithRouter(address[],uint256,uint256,address)",
                    path,
                    sourceAmount,
                    minDestination,
                    uniswapV2RouterAddress
                )
            );

        assembly {
            if eq(success, 0) {
                revert(add(data, 0x20), returndatasize)
            }
        }

        return abi.decode(data, (uint256));
    }
}
