pragma solidity ^0.5.17;

/**
    @notice This interface defines the different functions available for a CRV Fee Distributor contract
    @author develop@teller.finance
 */

interface ICurveDistribution {
    /**
        @notice Claim the trading fees for a lender/escrow address
        @param lenderAddress Address to claim fees for
        @return uint256 The total amount of fees claimed in the call
     */
    function claim(address lenderAddress) external;

    /**
        @notice Get the veCRV balance for a lender or escrow at a specified timestamp
        @param lenderAddress The address of the lender/escrow to query balance for
        @param timestamp The timestamp at which to check the balance at
        @return uint256 veCRV balance
     */
    function ve_for_at(address lenderAddress, uint256 timestamp)
        external
        view
        returns (uint256);
}
