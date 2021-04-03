// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
pragma experimental ABIEncoderV2;

library s_LendingPool {
    uint8 constant EXCHANGE_RATE_DECIMALS = 36;

    struct Layout {
        ITToken tToken;
        ERC20 lendingToken;
        CErc20Interface cToken;
        IComptroller compound;
        ERC20 comp;
        IMarketRegistry marketRegistry;
        /*
        The total amount of underlying asset that has been originally been supplied by each
        lender not including interest earned.
    */
        mapping(address => uint256) _totalSuppliedUnderlyingLender;
        // The total amount of underlying asset that has been lent out for loans.
        uint256 _totalBorrowed;
        // The total amount of underlying asset that has been repaid from loans.
        uint256 _totalRepaid;
        // The total amount of underlying interest that has been claimed for each lender.
        mapping(address => uint256) _totalInterestEarnedLender;
        // The total amount of underlying interest the pool has earned from loans being repaid.
        uint256 totalInterestEarned;
        /**
         * @notice It holds the platform AssetSettings instance.
         */
        AssetSettingsInterface assetSettings;
        bool _notEntered;
    }

    bytes32 internal constant POSITION =
        keccak256("teller_protocol.storage.lending_pool");

    function get() internal pure returns (Layout storage l_) {
        bytes32 position = POSITION;

        assembly {
            l_.slot := position
        }
    }
}
