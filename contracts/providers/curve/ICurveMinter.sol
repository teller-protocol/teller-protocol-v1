pragma solidity ^0.5.17;

/**
    @notice This interface defines the different functions available for a CRV minter contract
    @author develop@teller.finance
 */

interface ICurveMinter {
    /**
        @notice Mint and send everything which belongs to the sender
        @param gauge_address Liquidity/Staking Gauge address to get mintable amount from
     */
    function mint(address gauge_address) external;

    /**
        @notice Returns the address of the CRV token
     */
    function token() external view returns (address);
}
