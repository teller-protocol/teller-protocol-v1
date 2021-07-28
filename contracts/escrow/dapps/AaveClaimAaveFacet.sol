// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Storage
import { DappMods } from "./DappMods.sol";
import { PausableMods } from "../../settings/pausable/PausableMods.sol";
import { LibDapps } from "./libraries/LibDapps.sol";
import { LibEscrow, ILoansEscrow } from "../libraries/LibEscrow.sol";
import { IAToken } from "../../shared/interfaces/IAToken.sol";
import {
    IAaveIncentivesController
} from "../../shared/interfaces/IAaveIncentivesController.sol";
import { IStakedAave } from "../../shared/interfaces/IStakedAave.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract AaveClaimAaveFacet is PausableMods, DappMods {
    using SafeERC20 for IERC20;

    /**
     * @dev The address of Aave's Incentives controller Address on the deployed network
     * @dev example - Aave's Incentives controller contract address on L1 mainnet or L2 polygon mainnet
     */
    address public immutable INCENTIVES_CONTROLLER_ADDRESS;
    address public immutable STAKE_TOKEN_ADDRESS;

    /**
     * @notice Sets the network relevant address for Aave's Incentives controller Address on protocol deployment.
     * @param aaveIncentivesControllerAddress The immutable address of Aave's Incentives controller Address on the deployed network.
     */
    constructor(
        address aaveIncentivesControllerAddress,
        address aaveStakeTokenAddress
    ) public {
        INCENTIVES_CONTROLLER_ADDRESS = aaveIncentivesControllerAddress;
        STAKE_TOKEN_ADDRESS = aaveStakeTokenAddress;
    }

    /**
        @notice This event is emitted every time Aave deposit is invoked successfully.
        @param borrower address of the loan borrower.
        @param loanID ID of the loan.
     */
    event AaveClaimed(address borrower, uint256 loanID);

    /**
     * @notice To claim AAVE call the {claimRewards} function on {AaveIncentivesController}.
     * @param loanID id of the loan being used in the dapp
     * @param amount amount of tokens to claim.
     * @param tokenAddresses address of the underlying token.
     */
    function aaveClaimAave(
        uint256 loanID,
        uint256 amount,
        address[] calldata tokenAddresses
    ) public paused("", false) onlyBorrower(loanID) {
        address escrow = address(LibEscrow.e(loanID));
        bytes memory result = LibEscrow.e(loanID).callDapp(
            address(INCENTIVES_CONTROLLER_ADDRESS),
            abi.encodeWithSelector(
                IAaveIncentivesController.claimRewards.selector,
                tokenAddresses,
                amount,
                escrow
            )
        );

        bytes memory unstake = LibEscrow.e(loanID).callDapp(
            address(STAKE_TOKEN_ADDRESS),
            abi.encodeWithSelector(
                IStakedAave.redeem.selector,
                msg.sender,
                amount
            )
        );

        // Add AAVE to escrow token list
        // TODO: get the AAVE token (add as immutable constructor variable)
        // LibEscrow.tokenUpdated(loanID, address(0));

        emit AaveClaimed(msg.sender, loanID);
    }

    /**
     * @notice This function redeems the user's cTokens for a specific amount of the underlying token.
     * @param loanID id of the loan being used in the dapp
     */
    function aaveCalculateAave(uint256 loanID)
        public
        view
        paused("", false)
        onlyBorrower(loanID)
        returns (uint256)
    {
        IAaveIncentivesController conptroller = IAaveIncentivesController(
            INCENTIVES_CONTROLLER_ADDRESS
        );
        uint256 result = conptroller.getUserUnclaimedRewards(
            address(LibEscrow.e(loanID))
        );
        return result;
    }
}
