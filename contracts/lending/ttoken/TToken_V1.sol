// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Contracts
import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

// Utils
import { Address } from "@openzeppelin/contracts/utils/Address.sol";

// Interfaces
import { ITToken } from "./ITToken.sol";

/**
 * @notice This contract represents a wrapped token within the Teller protocol
 *
 * @author develop@teller.finance
 */
contract TToken_V1 is ITToken {
    /* State Variables */

    uint8 private _decimals;
    ERC20 private _underlying;

    /* Public Functions */

    function decimals() public view override returns (uint8 decimals_) {
        decimals_ = _decimals;
    }

    function underlying() public view override returns (ERC20 underlying_) {
        underlying_ = _underlying;
    }

    /**
     * @notice Increase account supply of specified token amount
     * @param account The account to mint tokens to
     * @param amount The amount of tokens to mint
     */
    function mint(address account, uint256 amount) public override onlyOwner {
        _mint(account, amount);
    }

    /**
     * @notice Reduce account supply of specified token amount
     * @param account The account to burn tokens from
     * @param amount The amount of tokens to burn
     */
    function burn(address account, uint256 amount) public override onlyOwner {
        _burn(account, amount);
    }

    /**
     * @param _diamond The TellerDiamond address used as the owner.
     * @param __underlying The token address represented by this TToken.
     */
    function initialize(address _diamond, address __underlying)
        public
        override
        initializer
    {
        require(Address.isContract(_diamond), "Teller: diamond not contract");
        require(
            Address.isContract(__underlying),
            "Teller: underlying ttoken not contract"
        );

        // Make the TellerDiamond the owner instead of caller
        __Ownable_init();
        transferOwnership(_diamond);

        _underlying = ERC20(__underlying);
        __ERC20_init(
            string(abi.encodePacked("Teller ", _underlying.name())),
            string(abi.encodePacked("t", _underlying.symbol()))
        );
        _decimals = _underlying.decimals();
    }
}
