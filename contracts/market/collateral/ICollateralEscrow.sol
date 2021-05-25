// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface ICollateralEscrow {
    /**
     * @notice it creates a escrow to store collateral tokens
     * @param tokenAddress the address of the collateral token to be stored
     * @param isWETH check if it's wrapped Ethereum
     */
    function init(address tokenAddress, bool isWETH) external;

    /**
     * @notice it deposits an amount of the respective collateral token into the escrow
     * @param loanID the ID of the escrow loan
     * @param amount the amount of collateral tokens to be deposited
     */
    function deposit(uint256 loanID, uint256 amount) external payable;

    /**
     * @notice it withdraws an amount of tokens in a respective loanID if the caller is the owner
     * @param loanID identifier of the escrow loan
     * @param amount number of collateral tokens to send
     * @param receiver payable address to transfer money to
     */
    function withdraw(
        uint256 loanID,
        uint256 amount,
        address payable receiver
    ) external;

    /**
     * @notice it returns the supply of the respective escrow loan
     * @param loanID the respective loan ID
     * @return supply_ the amount in collateral of the respective loan
     */
    function loanSupply(uint256 loanID) external view returns (uint256 supply_);

    /**
     * @notice it returns the total supply of our collateral token
     * @return supply_ the total amount of collateral
     */
    function totalSupply() external view returns (uint256 supply_);
}
