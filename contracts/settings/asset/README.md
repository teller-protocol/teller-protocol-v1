# Asset Settings for Lending Tokens

Asset settings are stored using the `CacheLib` and hence do not have their own library. Use `keccak256`ed _**keys**_ to references their values. The specified keys are listed below.

Each asset used as a lending token on the Teller Protocol, has a set of settings assigned to them that are used in various functions. Instead of having baked in functions to modify/get each one of these settings, they are accessed via a _**key**_ which is an `abi.encode()`ed string. By doing this, it allows for future modifications to add/remove settings without the need to recompile each contract that accesses the `AssetSettingsLib`.

The setting values are stored on the root level `AppStorage.assetSettings` mapping. They can be accessed directly or through the `AssetSettingsLib` library.

## Asset Setting Keys

- `CTokenAddress`
  - Stores the associated Compound `cToken` address
- `ATokenAddress`
  - Stores the associated Aave `aToken` address
- `YVaultAddress`
  - Stores the associated Yearn `yVault` address
- `PrizePoolAddress`
  - Stores the associated PoolTogether pool address
- `MaxLoanAmount`
  - Stores the maximum loan size amount allowed for a token
- `MaxDebtRatio`
  - Stores the maximum debt ratio allowed for a lending asset
