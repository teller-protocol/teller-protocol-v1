// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Contracts
import { ChainlinkPricer } from "./pricers/ChainlinkPricer.sol";
import {
    Initializable
} from "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import {
    RolesFacet,
    RolesLib
} from "../contexts2/access-control/roles/RolesFacet.sol";
import { ADMIN } from "../shared/roles.sol";
import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

// Interfaces
import { IsaLPPricer } from "./IsaLPPricer.sol";
import {
    AggregatorV2V3Interface
} from "@chainlink/contracts/src/v0.8/interfaces/AggregatorV2V3Interface.sol";

// Libraries
import { Address } from "@openzeppelin/contracts/utils/Address.sol";

contract PriceAggregator is RolesFacet, Initializable {
    address private immutable DEPLOYER;
    uint256 internal constant TEN = 10;
    address public immutable wETH;

    mapping(address => IsaLPPricer) public saLPPricer;
    ChainlinkPricer public chainlinkPricer;

    constructor(address wETHAddress) {
        DEPLOYER = msg.sender;
        wETH = wETHAddress;
    }

    function initialize(address chainlinkPricerAddress) external initializer {
        // Checks that the account initializing is the contract deployer
        require(msg.sender == DEPLOYER, "not deployer");
        // The account must first be grated the ADMIN role and then call {setChainlinkPricer}
        RolesLib.grantRole(ADMIN, DEPLOYER);
        setChainlinkPricer(chainlinkPricerAddress);
    }

    function setChainlinkPricer(address pricer)
        public
        authorized(ADMIN, msg.sender)
    {
        require(
            Address.isContract(pricer),
            "Teller: Chainlink pricer not contract"
        );
        chainlinkPricer = ChainlinkPricer(pricer);
    }

    function setAssetPricers(address pricer, address[] calldata assets)
        external
        authorized(ADMIN, msg.sender)
    {
        for (uint256 i; i < assets.length; i++) {
            setAssetPricer(assets[i], pricer);
        }
    }

    function setAssetPricer(address asset, address pricer)
        public
        authorized(ADMIN, msg.sender)
    {
        require(
            Address.isContract(pricer),
            "Teller: Chainlink pricer not contract"
        );
        saLPPricer[asset] = IsaLPPricer(pricer);
    }

    /**
     * @notice It returns the price of the token pair as given from the Chainlink Aggregator.
     * @dev It tries to use ETH as a pass through asset if the direct pair is not supported.
     * @param src Source token address.
     * @param dst Destination token address.
     * @return uint256 The latest answer as given from Chainlink.
     */
    function getPriceFor(address src, address dst)
        external
        view
        returns (uint256)
    {
        return _priceFor(src, dst);
    }

    /**
     * @notice It calculates the value of a token amount into another.
     * @param src Source token address.
     * @param dst Destination token address.
     * @param srcAmount Amount of the source token to convert into the destination token.
     * @return uint256 Value of the source token amount in destination tokens.
     */
    function getValueFor(
        address src,
        address dst,
        uint256 srcAmount
    ) external view returns (uint256) {
        return _valueFor(src, srcAmount, uint256(_priceFor(src, dst)));
    }

    /**
     * @notice It calculates the value of the {src} token balance in {dst} token for the {account}.
     * @param account Address of the account to get the balance value of.
     * @param src Source token address.
     * @param dst Destination token address.
     * @return Value of the {src} token balance denoted in {dst} tokens.
     */
    function getBalanceOfFor(
        address account,
        address src,
        address dst
    ) external returns (uint256) {
        IsaLPPricer srcPricer = saLPPricer[src];
        IsaLPPricer dstPricer = saLPPricer[dst];

        uint256 srcBalance;
        if (address(srcPricer) == address(0)) {
            srcBalance = ERC20(src).balanceOf(account);
        } else {
            srcBalance = srcPricer.getBalanceOfUnderlying(src, account);
            src = srcPricer.getUnderlying(src);
        }

        return _valueFor(src, srcBalance, uint256(_priceFor(src, dst)));
    }

    /**
     * @notice It calculates the value of a token amount into another.
     * @param src Source token address.
     * @param amount Amount of the source token to convert into the destination token.
     * @param exchangeRate The calculated exchange rate between the tokens.
     * @return uint256 Value of the source token amount given an exchange rate peg.
     */
    function _valueFor(
        address src,
        uint256 amount,
        uint256 exchangeRate
    ) internal view returns (uint256) {
        return (amount * exchangeRate) / _oneToken(src);
    }

    /**
     * @notice it returns 10^{numberOfDecimals} for a token
     * @param token the address to calculate the decimals for
     * @return 10^number of decimals used to calculate the price and value of different token pairs
     */
    function _oneToken(address token) internal view returns (uint256) {
        return TEN**_decimalsFor(token);
    }

    /**
     * @notice It gets the number of decimals for a given token.
     * @param addr Token address to get decimals for.
     * @return uint8 Number of decimals the given token.
     */
    function _decimalsFor(address addr) internal view returns (uint8) {
        return ERC20(addr).decimals();
    }

    /**
     * @notice it tries to calculate a price from Compound and Chainlink.
     * @dev if no price is found on compound, then calculate it on chainlink
     * @param src the token address to calculate the price for in dst
     * @param dst the token address to retrieve the price of src
     * @return price_ the price of src in dst
     */
    function _priceFor(address src, address dst)
        private
        view
        returns (uint256 price_)
    {
        IsaLPPricer srcPricer = saLPPricer[src];
        IsaLPPricer dstPricer = saLPPricer[dst];

        // ETH / ASSET
        if (src == wETH && address(dstPricer) == address(0)) {
            // Get destination asset Chainlink price in ETH
            uint256 dstEthPrice = chainlinkPricer.getEthPrice(dst);
            // Since the source asset is ETH and the price is in ETH, we need the inverse
            return _scale(_inverseRate(dstEthPrice, 18), 18, _decimalsFor(dst));
        }

        // ASSET / ETH
        if (dst == wETH && address(srcPricer) == address(0)) {
            // Get source asset Chainlink price in ETH
            uint256 srcEthPrice = chainlinkPricer.getEthPrice(src);
            return srcEthPrice;
        }

        // ASSET / ASSET
        if (
            address(srcPricer) == address(0) && address(dstPricer) == address(0)
        ) {
            // Get source asset Chainlink price in ETH
            uint256 srcEthPrice = chainlinkPricer.getEthPrice(src);
            // Get destination asset Chainlink price in ETH
            uint256 dstEthPrice = chainlinkPricer.getEthPrice(dst);
            // Merge the 2 rates
            return _mergeRates(srcEthPrice, dstEthPrice, dst);
        }

        // saLP / ASSET
        if (
            address(srcPricer) != address(0) && address(dstPricer) == address(0)
        ) {
            // Get the underlying source asset
            address srcUnderlying = srcPricer.getUnderlying(src);
            // Get source asset exchange rate for the underlying asset
            uint256 srcExchangeRate = srcPricer.getRateFor(src);
            if (srcUnderlying == dst) {
                return srcExchangeRate;
            } else {
                return
                    _mergeRates(
                        srcExchangeRate,
                        _priceFor(dst, srcUnderlying),
                        dst
                    );
            }
        }

        // Get the underlying destination asset
        address dstUnderlying = dstPricer.getUnderlying(dst);

        // ASSET / saLP
        if (
            address(srcPricer) == address(0) && address(dstPricer) != address(0)
        ) {
            // Get destination asset exchange rate for the underlying asset
            uint256 dstExchangeRate = dstPricer.getRateFor(dst);
            // If the source asset and underlying destination asset are the same, inverse the saLP asset rate
            if (src == dstUnderlying) {
                return
                    _inverseRate(
                        _scale(
                            dstExchangeRate,
                            _decimalsFor(dst),
                            _decimalsFor(src)
                        ),
                        _decimalsFor(src)
                    );
            } else {
                return
                    _mergeRates(
                        _priceFor(src, dstUnderlying),
                        dstExchangeRate,
                        dst
                    );
            }
        }

        // saLP / saLP

        // Get the underlying destination asset
        return
            _valueFor(
                dstUnderlying,
                _priceFor(src, dstUnderlying),
                _priceFor(dstUnderlying, dst)
            );
    }

    /**
     * @notice Scales the {value} by the difference in decimal values.
     * @param value the the value of the src in dst
     * @param srcDecimals src token decimals
     * @param dstDecimals dst token decimals
     * @return the price of src in dst after scaling the difference in decimal values
     */
    function _scale(
        uint256 value,
        uint256 srcDecimals,
        uint256 dstDecimals
    ) internal pure returns (uint256) {
        if (dstDecimals > srcDecimals) {
            return value * (TEN**(dstDecimals - srcDecimals));
        } else {
            return value / (TEN**(srcDecimals - dstDecimals));
        }
    }

    function _inverseRate(uint256 rate, uint8 dstDecimals)
        internal
        pure
        returns (uint256)
    {
        return (TEN**(dstDecimals + dstDecimals)) / rate;
    }

    function _mergeRates(
        uint256 rate1,
        uint256 rate2,
        address dst
    ) internal view returns (uint256) {
        return
            rate1 == 0 ? rate2 : ((rate1 * (TEN**_decimalsFor(dst))) / rate2);
    }
}
