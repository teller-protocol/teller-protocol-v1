// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

abstract contract AssetSettingNames {
    /** Constants */
    /**
          @dev The asset setting name for cToken address settings.
       */
    bytes32 internal constant CTOKEN_ADDRESS_ASSET_SETTING =
        keccak256("CTokenAddress");

    /**
          @dev The asset setting name for aToken address settings.
       */
    bytes32 internal constant ATOKEN_ADDRESS_ASSET_SETTING =
        keccak256("ATokenAddress");

    /**
          @dev The asset setting name for yearn vault address settings.
       */
    bytes32 internal constant YEARN_VAULT_ADDRESS_ASSET_SETTING =
        keccak256("YVaultAddress");

    /**
          @dev The asset setting name for pool together's prize pool address settings.
       */
    bytes32 internal constant PRIZE_POOL_ADDRESS_ASSET_SETTING =
        keccak256("PrizePoolAddress");

    /**
          @dev The asset setting name for the maximum loan amount settings.
       */
    bytes32 internal constant MAX_LOAN_AMOUNT_ASSET_SETTING =
        keccak256("MaxLoanAmount");

    /**
          @dev The asset setting name for the maximum total value locked settings.
       */
    bytes32 internal constant MAX_TOTAL_VALUE_LOCKED_SETTING =
        keccak256("MaxTVLAmount");

    /**
          @dev The asset setting name for the maximum debt ratio settings.
       */
    bytes32 internal constant MAX_DEBT_RATIO_SETTING =
        keccak256("MaxDebtRatio");
}
