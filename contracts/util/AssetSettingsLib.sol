pragma solidity 0.5.17;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";


library AssetSettingsLib {
    using SafeMath for uint256;

    struct AssetSettings {
        // It prepresents the cTokenAddress or 0x0.
        address cTokenAddress;
        // It represents the MAX lending amount for the lending asset (see Settings contract).
        uint256 maxLendingAmount;
        // It represents the frequence (# of blocks) to process the Compound exchange rate (per asset).
        uint256 rateProcessFrequency;
    }

    function initialize(
        AssetSettings storage self,
        address cTokenAddress,
        uint256 maxLendingAmount,
        uint256 rateProcessFrequency
    ) internal {
        require(maxLendingAmount > 0, "INIT_MAX_AMOUNT_REQUIRED");
        require(rateProcessFrequency > 0, "INIT_RATE_PROCESS_FREQ_REQUIRED");
        self.cTokenAddress = cTokenAddress;
        self.maxLendingAmount = maxLendingAmount;
        self.rateProcessFrequency = rateProcessFrequency;
    }

    function requireNotExists(AssetSettings storage self) internal view {
        require(exists(self) == false, "ASSET_SETTINGS_ALREADY_EXISTS");
    }

    function requireExists(AssetSettings storage self) internal view {
        require(exists(self) == true, "ASSET_SETTINGS_NOT_EXISTS");
    }

    function exists(AssetSettings storage self) internal view returns (bool) {
        return self.maxLendingAmount > 0 && self.rateProcessFrequency > 0;
    }

    function exceedsMaxLendingAmount(AssetSettings storage self, uint256 amount)
        internal
        view
        returns (bool)
    {
        return amount > self.maxLendingAmount;
    }

    function update(
        AssetSettings storage self,
        address cTokenAddress,
        uint256 newMaxLendingAmount,
        uint256 newRateProcessFrequency
    ) internal {
        requireExists(self);
        require(
            self.cTokenAddress != cTokenAddress ||
                self.maxLendingAmount != newMaxLendingAmount ||
                self.rateProcessFrequency != newRateProcessFrequency,
            "NEW_SETTINGS_VALUE_REQUIRED"
        );
        self.cTokenAddress = cTokenAddress;
        self.maxLendingAmount = newMaxLendingAmount;
        self.rateProcessFrequency = newRateProcessFrequency;
    }
}
