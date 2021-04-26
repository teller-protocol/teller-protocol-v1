// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/introspection/ERC165Checker.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { ERC20Context } from "../../../contexts2/erc20/ERC20Context.sol";
import { ITToken } from "../interfaces/ITToken.sol";
import { IStrategy } from "../interfaces/IStrategy.sol";
import { TELLER_TTOKEN_STRATEGY_SALT } from "../data.sol";

import "../Storage.sol" as Storage;

/**
    This abstract contract contains the base which most versions of TToken will
    be derived from. It contains getters for storage variables specific to a
    TToken (underlying, strategy), helpers for the derived contract
    to easily access different storage contexts, and implementations for standard
    functionalities (valueInUnderlying, exchangeRate, strategize). These are all
    things which shouldn't change with a properly designed set of contracts.
    Some functions are expected to change quite a bit through different versions,
    namely all the user-facing calls. Those aren't implemented here and are the
    main focus of each TToken version contract.
    @notice For documentation of non-internal functions, refer to ITToken.sol.
 */
abstract contract ATToken is ITToken, ERC20Context {
    uint256 public constant EXCHANGE_RATE_FACTOR = 1e18;
    uint256 public constant ONE_HUNDRED_PERCENT = 10000;

    function() pure returns (Storage.Store storage) private constant S =
        Storage.store;

    function() pure returns (Storage.Store storage) constant TTokenStore =
        Storage.store;

    function __INIT_TTokenBase(
        ERC20 _underlying,
        IStrategy _strategy,
        bytes memory _strategyInit
    ) internal {
        require(Address.isContract(address(_underlying)), "ERC20NOTCONTRACT");

        __INIT_ERC20Context(
            abi.encodePacked("Teller ", _underlying.name()),
            abi.encodePacked("t", _underlying.symbol()),
            _underlying.decimals()
        );

        S().underlying = _underlying;

        _updateStrategy(_strategy, _strategyInit);
    }

    function underlying() external view returns (IERC20) {
        return S().underlying;
    }

    function strategy() external view override returns (IStrategy) {
        return S().strategy;
    }

    function exchangeRate() external view override returns (uint256) {
        return
            _exchangeRate(S().totalSupplyUnderlying, ERC20Store().totalSupply);
    }

    function totalSupplyUnderlying() external view override returns (uint256) {
        return S().totalSupplyUnderlying;
    }

    function balanceOfUnderlying(address account)
        external
        view
        override
        returns (uint256)
    {
        return
            _valueInUnderlying(
                ERC20Store().balances[account],
                _exchangeRate(
                    S().totalSupplyUnderlying,
                    ERC20Store().totalSupply
                )
            );
    }

    function strategize(bytes calldata data)
        external
        override
        returns (bytes memory output)
    {
        bytes32 salt;
        (bytes4 sig, bytes memory input) = abi.decode(data, (bytes4, bytes));

        (bool success, bytes memory result) =
            address(S().strategy).delegatecall(
                abi.encodeWithSelector(
                    IStrategy.strategize.selector,
                    sig,
                    input
                )
            );
        if (!success) revert(string(result));
        (salt, output) = abi.decode(result, (bytes32, bytes));
        require(salt == TELLER_TTOKEN_STRATEGY_SALT, "BAD_SALT");
    }

    function _updateStrategy(IStrategy _strategy, bytes memory init) internal {
        require(
            ERC165Checker.supportsInterface(
                address(_strategy),
                type(IStrategy).interfaceId
            ),
            "BAD_INTERFACE"
        );
        S().strategy = _strategy;
        (bool success, bytes memory result) =
            address(_strategy).delegatecall(init);
        if (!success) revert(string(result));
    }

    /**
        Get the tToken value of {amount} underlying tokens using {rate}.
     */
    function _valueOfUnderlying(uint256 amount, uint256 rate)
        internal
        pure
        returns (uint256 value_)
    {
        value_ = (amount * EXCHANGE_RATE_FACTOR) / rate;
    }

    /**
        Get the underlying token value of {amount} tTokens using {rate}.
     */
    function _valueInUnderlying(uint256 amount, uint256 rate)
        internal
        pure
        returns (uint256 value_)
    {
        value_ = (amount * (rate)) / EXCHANGE_RATE_FACTOR;
    }

    /**
        Get the exchange rate for tTokens to underlying tokens.
     */
    function _exchangeRate(uint256 _totalSupplyUnderlying, uint256 _totalSupply)
        internal
        pure
        returns (uint256 exchangeRate_)
    {
        exchangeRate_ =
            (_totalSupplyUnderlying * EXCHANGE_RATE_FACTOR) /
            _totalSupply;
    }
}
