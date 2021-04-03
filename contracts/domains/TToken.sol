// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
pragma experimental ABIEncoderV2;

// Utils
import "@openzeppelin/contracts/utils/Address.sol";

// Interfaces
import "../interfaces/ITToken.sol";
import "../interfaces/LendingPoolInterface.sol";

// Contracts
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "./upgradeable/DynamicUpgradeable.sol";

/**
 * @notice This contract represents a wrapped token within the Teller protocol
 *
 * @author develop@teller.finance
 */
contract TToken is ITToken, DynamicUpgradeable, ERC20Upgradeable {
    using Address for address;

    /* State Variables */

    // The LendingPool linked to this Teller Token.
    LendingPoolInterface private _lendingPool;

    // The underlying asset for this Teller Token.
    ERC20 private _underlying;

    /* Modifiers */

    modifier onlyLendingPool() {
        require(
            msg.sender == address(_lendingPool),
            "Teller: must be lending pool"
        );
        _;
    }

    /* Public Functions */

    function decimals() public view override returns (uint8) {
        return _underlying.decimals();
    }

    function lendingPool()
        external
        view
        override
        returns (LendingPoolInterface)
    {
        return _lendingPool;
    }

    function underlying() external view override returns (ERC20) {
        return _underlying;
    }

    function mint(address account, uint256 amount)
        external
        override
        onlyLendingPool
    {
        _mint(account, amount);
    }

    /**
     * @notice Reduce account supply of specified token amount
     * @param account The account to burn tokens from
     * @param amount The amount of tokens to burn
     */
    function burn(address account, uint256 amount)
        external
        override
        onlyLendingPool
    {
        _burn(account, amount);
    }

    /**
     * @param lendingPoolAddress the address of the lending pool this token is linked to. It is only used to add it as a minter.
     */
    function initialize(address lendingPoolAddress) external override {
        require(
            lendingPoolAddress.isContract(),
            "Teller: lending pool not contract"
        );
        _lendingPool = LendingPoolInterface(lendingPoolAddress);
        _underlying = _lendingPool.lendingToken();

        __ERC20_init(
            string(abi.encodePacked("Teller ", _underlying.name())),
            string(abi.encodePacked("t", _underlying.symbol()))
        );
    }
}
