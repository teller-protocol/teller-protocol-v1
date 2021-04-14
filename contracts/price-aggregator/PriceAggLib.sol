// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Storage
import { AppStorageLib } from "../storage/app.sol";

/**
 * @notice Helper functions to staticcall into the PriceAggFacet from other facets. See {PriceAggFacet.getPriceFor}
 */
library PriceAggLib {
    /**
     * @notice See {PriceAggFacet.valueFor}
     */
    function valueFor(
        address src,
        address dst,
        uint256 srcAmount
    ) internal view returns (uint256 price) {
        bytes memory data =
            _view(
                abi.encode(
                    "getValueFor(address,address,uint256)",
                    src,
                    dst,
                    srcAmount
                )
            );
        price = abi.decode(data, (uint256));
    }

    /**
     * @notice See {PriceAggFacet.priceFor}
     */
    function priceFor(address src, address dst)
        internal
        view
        returns (int256 price)
    {
        bytes memory data =
            _view(abi.encode("getPriceFor(address,address)", src, dst));
        price = abi.decode(data, (int256));
    }

    function _view(bytes memory callData)
        private
        view
        returns (bytes memory response)
    {
        bool success;
        (success, response) = address(this).staticcall(callData);
        if (!success) {
            assembly {
                let ptr := mload(0x40)
                let size := returndatasize()
                returndatacopy(ptr, 0, size)
                revert(ptr, size)
            }
        }
    }
}
