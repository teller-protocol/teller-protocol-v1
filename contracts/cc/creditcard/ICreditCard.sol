// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface ICreditCard {
    function init() external;

    /**
     * @notice the cc can call dapps like Uni at the target contract with dappData to specify it's ABI call
     * @param dappAddress the address of the dapp's target contract
     * @param dappData encoded abi of the function that we want to call in our dapp
     * @return data_ the returned data in bytes
     */
    function callDapp(address dappAddress, bytes calldata dappData)
        external
        returns (bytes memory data_);

    /**
     * @notice it deposits an amount of collateral into the cc
     * @notice credit limit increases after depositing collateral
     * @param token the address of the token collateral
     * @param loanID the ID of the loan associated with the cc
     * @param amount the amount of the collateral to be deposited into the cc
     */
    function depositCollateral(
        address token,
        uint256 loanID,
        uint256 amount
    ) external payable;

    /**
     * @notice it deposits an NFT into the cc
     * @notice credit limit increases after depositing NFT
     * @param nftID the ID of the loan associated with the cc
     * @param owner the amount of the collateral to be deposited into the cc
     */
    function depositNFT(uint256 nftID, address owner) external payable;

    /**
     * @notice it allows the user to claim their collateral tokens
     * @notice the credit card limit drop after claiming their collateral tokens
     * @param token the token to claim
     * @param to address to claim the token to  
     * @param amount amount of collateral we are claiming
     */
    function claimCollateralToken(
        address token,
        address to,
        uint256 amount
    ) external;

    function claimNFT(uint256 nftID, address to) external;
}
