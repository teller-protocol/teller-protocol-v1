pragma solidity 0.5.17;

/**
    @notice It defines the keys (constants) used in the AssetSettings contract.

    @author develop@teller.finance
 */
contract AssetSettingsConsts {
    bytes32 public constant CTOKEN_ADDRESS_ASSET_SETTING = "CTokenAddress";
    bytes32 public constant CRV_POOL_ADDRESS_SETTING = keccak256("CRVPoolAddress");
    bytes32 public constant Y_VAULT_ADDRESS_SETTING = keccak256("YVaultAddress");
    bytes32 public constant MAX_LOAN_AMOUNT_ASSET_SETTING = "MaxLoanAmount";
    bytes32 public constant INITIALIZED = keccak256("Initialized");
}
