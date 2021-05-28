// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Interfaces
import { ICreditCard } from "./ICreditCard.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

// Libraries
import {
    SafeERC20
} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { Address } from "@openzeppelin/contracts/utils/Address.sol";

contract CreditCard_V1 is ICreditCard {
    // state variables
    address public owner;

    // modifiers
    modifier onlyOwner {
        require(owner == msg.sender, "Teller: not owner of cc");
        _;
    }

    // functions
    function init() external override {
        require(owner == address(0), "Teller: cc already initialized");
        owner = msg.sender;
    }

    /**
     * @notice the cc can call dapps like Uni at the target contract with dappData to specify it's ABI call
     * @param dappAddress the address of the dapp's target contract
     * @param dappData encoded abi of the function that we want to call in our dapp
     * @return data_ the returned data in bytes
     */
    function callDapp(address dappAddress, bytes calldata dappdata)
        external
        returns (bytes memory data_)
    {
        data_ = Address.functionCall(
            dappAddress,
            dappData,
            "Teller: dapp call failed from cc"
        );
    }

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
    ) external payable {}

    /**
     * @notice it deposits an NFT into the cc
     * @notice credit limit increases after depositing NFT
     * @param nftID the ID of the loan associated with the cc
     * @param owner the amount of the collateral to be deposited into the cc
     */
    function depositNFT(uint256 nftID, address owner) external payable {}

    /**
     * @notice it allows the user to claim their collateral tokens
     * @notice the credit card limit drops after claiming their collateral tokens
     * @param token the token to claim
     * @param to address to claim the token to
     * @param amount amount of collateral we are claiming
     */
    function claimCollateralToken(
        address token,
        address to,
        uint256 amount
    ) external {}

    /**
     * @notice it allows the user to claim their NFTs
     * @notice the credit card limit drops after claiming their NFT
     * @param nftID the ID of the NFT
     * @param to the address to claim the NFT to
     */
    function claimNFT(uint256 nftID, address to) external {}
}
