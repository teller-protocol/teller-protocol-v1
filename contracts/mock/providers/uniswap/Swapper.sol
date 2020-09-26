pragma solidity 0.5.17;

import "../../../base/escrow/dapps/Uniswap.sol";

/**
    @notice This mock is used to expose a payable fallback function on tests.f
 */
contract Swapper is Uniswap {
    function swapForExact(
        address[] memory path,
        uint256 destinationAmount
    ) public {
        require(path.length >= 2, "UNISWAP_PATH_TOO_SHORT");
        address source = path[0];
        address destination = path[path.length - 1];

        source.requireNotEqualTo(destination, "UNISWAP_SOURCE_AND_DESTINATION_SAME");

        uint256[] memory amounts;

        if (source == router.WETH()) {
            amounts = router.swapETHForExactTokens.value(address(this).balance)(
                destinationAmount,
                path,
                msg.sender,
                now
            );
        } else {
            IERC20(source).approve(address(router), MAX_INT);
            if (destination == router.WETH()) {
                amounts = router.swapTokensForExactETH(
                    destinationAmount,
                    100000000000000000000000000000,
                    path,
                    msg.sender,
                    now
                );
            } else {
                amounts = router.swapTokensForExactTokens(
                    destinationAmount,
                    100000000000000000000000000000,
                    path,
                    msg.sender,
                    now
                );
            }
        }
    }

    function() external payable {}
}
