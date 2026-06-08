// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Contracts
import { TellerNFT_V2 } from "../TellerNFT_V2.sol";

contract PolyTellerNFT is TellerNFT_V2 {
    address public immutable CHILD_CHAIN_MANAGER =
        0xA6FA4fB5f76172d178d61B04b0ecd319C5d1C0aa;

    bytes32 public constant DEPOSITOR = keccak256("DEPOSITOR");

    /**
     * @notice The OpenZeppelin ProxyAdmin that owns this transparent proxy.
     * @dev The only execution path that can reach {recoverAdmin} with
     * `msg.sender == PROXY_ADMIN` is `ProxyAdmin.upgradeAndCall`, which
     * delegatecalls the new implementation from the proxy in the same tx. A
     * transparent proxy never routes ordinary fallback calls from its admin to
     * the implementation, so after that single upgrade call {recoverAdmin} is
     * unreachable — it is a one-shot recovery hook, not a standing backdoor.
     */
    address private constant PROXY_ADMIN =
        0x00BfeCF575FBDF4367dD70Dc9c729475173dBABf;

    /**
     * @notice It initializes the PolyTellerNFT adding a DEPOSITOR role for
     * the ChildChainManager address.
     */
    function __TellerNFT_V2_init_unchained(bytes calldata data)
        internal
        virtual
        override
        initializer
    {
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
     * @notice Admin function to mint a token to an address.
     * @param to Address to mint to.
     * @param id Token ID to mint.
     * @param amount Amount to mint.
     */
    function adminMint(address to, uint256 id, uint256 amount) external onlyRole(ADMIN) {
        _mint(to, id, amount, "");
    }

    /**
     * @notice Admin function to burn a token from an address.
     * @param from Address to burn from.
     * @param id Token ID to burn.
     * @param amount Amount to burn.
     */
    function adminBurn(address from, uint256 id, uint256 amount) external onlyRole(ADMIN) {
        _burn(from, id, amount);
    }

    /**
     * @notice Admin function to batch burn tokens from an address.
     * @param from Address to burn from.
     * @param ids Token IDs to burn.
     * @param amounts Amounts to burn.
     */
    function adminBurnBatch(address from, uint256[] calldata ids, uint256[] calldata amounts) external onlyRole(ADMIN) {
        _burnBatch(from, ids, amounts);
    }

    /**
     * @notice One-shot ADMIN-role recovery, callable only by the ProxyAdmin via
     * `upgradeAndCall`.
     * @dev Grants the ADMIN role to `newAdmin` without requiring the caller to
     * already hold ADMIN. This re-seats control when the role is held by an
     * address we no longer wish to rely on: whoever controls the proxy upgrade
     * authority outranks the role holder. Because a transparent proxy blocks the
     * admin from reaching the implementation through the normal fallback, the
     * only way to satisfy `msg.sender == PROXY_ADMIN` is the delegatecall that
     * `ProxyAdmin.upgradeAndCall` performs during the upgrade itself — so this
     * cannot be replayed afterward.
     *
     * After recovery, manage roles with the standard {grantRole} / {revokeRole}
     * (ADMIN is its own role-admin), e.g. revoke the previous holder.
     * @param newAdmin Address to grant the ADMIN role to.
     */
    function recoverAdmin(address newAdmin) external {
        require(msg.sender == PROXY_ADMIN, "PolyTellerNFT: only proxy admin");
        require(newAdmin != address(0), "PolyTellerNFT: zero admin");
        _setupRole(ADMIN, newAdmin);
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
