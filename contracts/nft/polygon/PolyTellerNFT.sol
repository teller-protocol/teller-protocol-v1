// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Contracts
import { TellerNFT_V2 } from "../TellerNFT_V2.sol";

contract PolyTellerNFT is TellerNFT_V2 {
    address public immutable CHILD_CHAIN_MANAGER =
        0x195fe6EE6639665CCeB15BCCeB9980FC445DFa0B;

    bytes32 public constant DEPOSITOR = keccak256("DEPOSITOR");

    /**
     * @notice it initializes the PolyTellerNFT by calling the TellerNFT with a
     * a set of minters and additionally adding a DEPOSITOR role for the ChildChainManager
     * address
     * @param minters additional minters to add on the TellerNFT storage
     */
    function initialize(address[] calldata minters)
        public
        virtual
        override
        initializer
    {
        require(minters.length == 0, "TellerNFT: cannot have minters");
        super.initialize(minters);

        // sets up a role for child chain manager to be the depositor
        _setupRole(DEPOSITOR, CHILD_CHAIN_MANAGER);
    }

    /**
     * @notice called when token is deposited on root chain
     * @dev Should be callable only by ChildChainManager
     * Should handle deposit by minting the required tokenId for user
     * Make sure minting is done only by this function
     * @param user user address for whom deposit is being done
     * @param depositData abi encoded tokenId
     */
    function deposit(address user, bytes memory depositData)
        external
        onlyRole(DEPOSITOR)
    {
        require(user != address(0x0), "TellerNFT: INVALID_DEPOSIT_USER");

        (
            uint256[] memory ids,
            uint256[] memory amounts,
            bytes memory data
        ) = abi.decode(depositData, (uint256[], uint256[], bytes));

        _mintBatch(user, ids, amounts, data);
    }

    /**
     * @notice called when user wants to withdraw single token back to root chain
     * @dev Should burn user's tokens. This transaction will be verified when exiting on root chain
     * @param id id to withdraw
     * @param amount amount to withdraw
     */
    function withdraw(uint256 id, uint256 amount) external {
        _burn(_msgSender(), id, amount);
    }

    /**
     * @notice called when user wants to batch withdraw tokens back to root chain
     * @dev Should burn user's tokens. This transaction will be verified when exiting on root chain
     * @param ids ids to withdraw
     * @param amounts amounts to withdraw
     */
    function withdrawBatch(uint256[] calldata ids, uint256[] calldata amounts)
        external
    {
        _burnBatch(_msgSender(), ids, amounts);
    }
}
