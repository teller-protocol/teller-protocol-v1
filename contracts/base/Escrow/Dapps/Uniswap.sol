pragma solidity 0.5.17;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import "../../../util/AddressLib.sol";

import "./IDApp.sol";


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
contract Uniswap is IDApp {
    using AddressLib for address;

    IUniswapV2Router02 public router;

    constructor(address _router) public {
        router = IUniswapV2Router02(_router);
    }

    function swap(address[] memory path, uint256 sourceAmount, uint256 minDestination)
        internal
    {
        require(path.length >= 2, "UNISWAP_PATH_TOO_SHORT");
        address source = path[0];
        address destination = path[path.length - 1];

        source.requireNotEqualTo(destination, "UNISWAP_SOURCE_AND_DESTINATION_SAME");
        require(minDestination > 0, "UNISWAP_MIN_DESTINATION_ZERO");

        // TODO: check destination amount >= minDestination
        if (source == address(0x0)) {
            require(address(this).balance >= sourceAmount, "UNISWAP_INSUFFICIENT_SOURCE");

            router.swapExactETHForTokens(0, path, address(this), now);
        } else {
            require(
                IERC20(source).balanceOf(address(this)) >= sourceAmount,
                "UNISWAP_INSUFFICIENT_SOURCE"
            );

            if (destination == address(0x0)) {
                router.swapExactTokensForETH(sourceAmount, 0, path, address(this), now);
            } else {
                router.swapExactTokensForTokens(
                    sourceAmount,
                    0,
                    path,
                    address(this),
                    now
                );
            }
        }

        emit DappAction("Uniswap", "swap");
    }
}


interface IUniswapV2Router02 {
    function swapExactTokensForTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external returns (uint256[] memory amounts);

    function swapExactTokensForETH(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external returns (uint256[] memory amounts);

    function swapExactETHForTokens(
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external payable returns (uint256[] memory amounts);
}
