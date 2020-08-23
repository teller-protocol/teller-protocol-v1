pragma solidity 0.5.17;

import "../../../../base/Escrow/Dapps/Uniswap.sol";


/**
    @notice This contract is a helper contract to access Uniswap internal functions.
    @author develop@teller.finance
*/
contract UniswapMock is Uniswap {
    
    function() external payable {}

    /**
        @notice Helper function to call internal swap() function. 
        @param routerAddress address of the Uniswap Router v02.
        @param path An array of token addresses. path.length must be >= 2. Pools for each consecutive pair of addresses must exist and have liquidity.
        @param sourceAmount amount of source element (ETH or Tokens).
        @param minDestination The minimum amount of output tokens that must be received for the transaction not to revert.
     */
    function callSwap(
        address routerAddress,
        address[] calldata path,
        uint256 sourceAmount,
        uint256 minDestination
    ) external {
        swap(routerAddress, path, sourceAmount, minDestination);
    }
    
    function updateWethAddress(
        address canonicalWeth
    ) external {
        _updateWethAddress(canonicalWeth);
    }

}
