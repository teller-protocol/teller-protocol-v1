pragma solidity 0.5.17;
pragma experimental ABIEncoderV2;

// Interfaces
import "../../atm/ATMLiquidityMining.sol";

contract ATMLiquidityMiningMock is ATMLiquidityMining {

    /**
        @notice used to call internal function
     */
    function callCalculateAccruedTLR(uint256 blockNumber) 
        external 
        //view 
        returns (uint256 earned) 
    {
        return _calculateAccruedTLR(blockNumber);
    }
}