pragma solidity 0.5.17;

/**
    @notice It defines the keys (constants) used in the AssetSettings contract.

    @author develop@teller.finance
 */
contract AssetSettingsConsts {
    bytes32 public constant C_TOKEN_ADDRESS = keccak256("CTokenAddress");
    bytes32 public constant CRV_POOL_ADDRESS = keccak256("CRVPoolAddress");
    bytes32 public constant Y_VAULT_ADDRESS = keccak256("YVaultAddress");
}
