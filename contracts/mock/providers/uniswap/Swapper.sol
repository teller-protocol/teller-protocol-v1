pragma solidity 0.5.17;

import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/IERC20.sol";
import "../../../providers/weth/IWETH.sol";

import "../../../base/escrow/dapps/Uniswap.sol";

/**
    @notice This mock is used to expose a payable fallback function on tests.f
 */
contract Swapper is Uniswap {
    function swapForExact(
        address to,
        address tokenAddress,
        uint256 destinationAmount
    ) public {
        if (tokenAddress == router.WETH()) {
            IWETH(tokenAddress).deposit(destinationAmount);
            IERC20(tokenAddress).transfer(to, destinationAmount);
        } else {
            address[] memory path = new address[](2);
            path[0] = router.WETH();
            path[1] = tokenAddress;
            router.swapETHForExactTokens.value(address(this).balance)(
                destinationAmount,
                path,
                to,
                now
            );
        }
    }

    function() external payable {}
}
