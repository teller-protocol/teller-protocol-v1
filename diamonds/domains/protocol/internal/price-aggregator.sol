// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Contracts
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "../storage/asset-registry.sol";
import "../storage/price-aggregator.sol";
import "./price-aggregator/compound-value.sol";
import "./price-aggregator/chainlink-aggregator.sol";

// Libraries
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/math/SignedSafeMath.sol";
import "../../../libraries/AddressArrayLib.sol";

abstract contract int_PriceAggregator_v1 is
    sto_PriceAggregator,
    sto_AssetRegistry,
    int_PriceAggregator_CompoundValue_v1,
    int_PriceAggregator_ChainlinkAggregator_v1
{
    using SafeMath for uint256;
    using SignedSafeMath for int256;
    using AddressArrayLib for AddressArrayLib.AddressArray;

    /**
        @notice It normalizes the token address to ETH if WETH.
        @param tokenAddress The address of the token to normalize.
    */
    function _normalizeTokenAddress(address tokenAddress)
        internal
        view
        returns (address)
    {
        return
            tokenAddress == assetRegistryStore().addresses["WETH"]
                ? assetRegistryStore().addresses["ETH"]
                : tokenAddress;
    }

    /**
        @notice It calculates the value of a token amount into another.
        @param src Source token address.
        @param dst Destination token address.
        @param srcAmount Amount of the source token to convert into the destination token.
        @return uint256 Value of the source token amount in destination tokens.
     */
    function _valueFor(
        address src,
        address dst,
        uint256 srcAmount
    ) internal view returns (uint256) {
        // If source token is a Compound CToken, calculate the value in underlying asset.
        bool isCtoken = assetRegistryStore().ctokens[src];
        if (isCtoken) {
            srcAmount = _compoundValueInUnderlying(src, srcAmount);
        }

        return
            (srcAmount.mul(uint256(_priceFor(src, dst)))).div(
                uint256(TEN**_decimalsFor(src))
            );
    }

    function _priceFor(address src, address dst)
        internal
        view
        returns (int256)
    {
        return _chainlinkPriceFor(src, dst);
    }
}
