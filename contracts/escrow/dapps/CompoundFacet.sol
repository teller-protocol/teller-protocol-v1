// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Contracts
import { DappMods } from "./DappMods.sol";
import { PausableMods } from "../../settings/pausable/PausableMods.sol";

// Libraries
import { LibCompound } from "./libraries/LibCompound.sol";
import { LibDapps } from "./libraries/LibDapps.sol";
import { LibEscrow } from "../libraries/LibEscrow.sol";
import {
    AssetCTokenLib
} from "../../settings/asset/libraries/AssetCTokenLib.sol";

// Interfaces
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { ICErc20 } from "../../shared/interfaces/ICErc20.sol";

contract CompoundFacet is PausableMods, DappMods {
    /**
     * @notice This event is emitted every time Compound lend is invoked successfully.
     * @param tokenAddress address of the underlying token.
     * @param cTokenAddress compound token address.
     * @param amount amount of tokens to Lend.
     */
    event CompoundLended(
        address indexed tokenAddress,
        address indexed cTokenAddress,
        uint256 amount
    );

    /**
     * @notice This event is emitted every time Compound redeem is invoked successfully.
     * @param tokenAddress address of the underlying token.
     * @param cTokenAddress compound token address.
     * @param amount amount of tokens to Redeem.
     */
    event CompoundRedeemed(
        address indexed tokenAddress,
        address indexed cTokenAddress,
        uint256 amount
    );

    /**
     * @notice To lend we first have to approve the cToken to access the token balance then mint.
     * @param loanID id of the loan being used in the dapp
     * @param tokenAddress address of the token.
     * @param amount amount of tokens to mint.
     */
    function compoundLend(
        uint256 loanID,
        address tokenAddress,
        uint256 amount
    ) public paused("", false) onlyBorrower(loanID) {
        ICErc20 cToken = AssetCTokenLib.get(tokenAddress);

        LibEscrow.e(loanID).setTokenAllowance(tokenAddress, address(cToken));

        bytes memory result =
            LibEscrow.e(loanID).callDapp(
                address(cToken),
                abi.encodeWithSelector(ICErc20.mint.selector, amount)
            );

        require(
            abi.decode(result, (uint256)) == LibCompound.NO_ERROR,
            "Teller: compound deposit error"
        );

        LibEscrow.tokenUpdated(loanID, address(cToken));
        LibEscrow.tokenUpdated(loanID, tokenAddress);

        emit CompoundLended(tokenAddress, address(cToken), amount);
    }

    /**
     * @notice This function redeems the user's cTokens for a specific amount of the underlying token.
     * @param loanID id of the loan being used in the dapp
     * @param tokenAddress address of the token.
     * @param amount amount of underlying tokens to redeem.
     */
    function compoundRedeem(
        uint256 loanID,
        address tokenAddress,
        uint256 amount
    ) public paused("", false) onlyBorrower(loanID) {
        ICErc20 cToken = AssetCTokenLib.get(tokenAddress);
        __compoundRedeem(
            loanID,
            address(cToken),
            tokenAddress,
            abi.encodeWithSelector(ICErc20.redeemUnderlying.selector, amount)
        );

        emit CompoundRedeemed(tokenAddress, address(cToken), amount);
    }

    /**
     * @notice This function redeems the complete cToken balance.
     * @param loanID id of the loan being used in the dapp
     * @param tokenAddress address of the token.
     */
    function compoundRedeemAll(uint256 loanID, address tokenAddress)
        public
        paused("", false)
        onlyBorrower(loanID)
    {
        ICErc20 cToken = AssetCTokenLib.get(tokenAddress);
        __compoundRedeem(
            loanID,
            address(cToken),
            tokenAddress,
            abi.encodeWithSelector(
                ICErc20.redeem.selector,
                cToken.balanceOf(address(LibEscrow.e(loanID)))
            )
        );

        emit CompoundRedeemed(
            tokenAddress,
            address(cToken),
            IERC20(tokenAddress).balanceOf(address(LibEscrow.e(loanID)))
        );
    }

    /**
     * @notice This function calls on Compound cToken to redeem an amount of the underlying token.
     * @param loanID ID of the loan being used for the dapp.
     * @param cTokenAddress Compound token address.
     * @param tokenAddress Underlying Compound token address.
     * @param callData Encoded data to send to the escrow to call.
     */
    function __compoundRedeem(
        uint256 loanID,
        address cTokenAddress,
        address tokenAddress,
        bytes memory callData
    ) private {
        bytes memory result =
            LibEscrow.e(loanID).callDapp(cTokenAddress, callData);

        require(
            abi.decode(result, (uint256)) !=
                LibCompound.TOKEN_INSUFFICIENT_BALANCE,
            "Teller: compound dapp insufficient balance"
        );
        require(
            abi.decode(result, (uint256)) == LibCompound.NO_ERROR,
            "Teller: compound dapp withdrawal error"
        );

        LibEscrow.tokenUpdated(loanID, cTokenAddress);
        LibEscrow.tokenUpdated(loanID, tokenAddress);
    }
}
