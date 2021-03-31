// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Utils
import "@openzeppelin/contracts/utils/Address.sol";

// Interfaces
import "../interfaces/ITToken.sol";
import "../interfaces/LendingPoolInterface.sol";

// Contracts
import "./upgradeable/DynamicUpgradeableERC20.sol";

import "hardhat/console.sol";

/**
 * @notice This contract represents a wrapped token within the Teller protocol
 *
 * @author develop@teller.finance
 */
contract TToken is ITToken, DynamicUpgradeableERC20 {
    using Address for address;

    /* State Variables */

    uint8 private _decimals;
    string private _name;
    string private _symbol;

    /**
     * @notice The LendingPool linked to this Teller Token.
     */
    LendingPoolInterface public override lendingPool;

    /* Modifiers */

    modifier onlyLendingPool() {
        require(msg.sender == address(lendingPool), "NOT_LENDINGPOOL");
        _;
    }

    /* Public Functions */

    /**
     * @notice The token that is the underlying assets for this Teller token.
     */
    function underlying() public view override returns (address) {
        return address(lendingPool.lendingToken());
    }

    function decimals() public view override returns (uint8 decimals_) {
        decimals_ = _decimals;
    }

    function mint(address account, uint256 amount)
        public
        override
        onlyLendingPool
    {
        console.log("Minting");
        console.log(account);
        console.log(amount);
        _mint(account, amount);
        console.log(ERC20(address(this)).balanceOf(account));
    }

    /**
     * @notice Reduce account supply of specified token amount
     * @param account The account to burn tokens from
     * @param amount The amount of tokens to burn
     */
    function burn(address account, uint256 amount)
        public
        override
        onlyLendingPool
    {
        _burn(account, amount);
    }

    /**
     * @param lendingPoolAddress the address of the lending pool this token is linked to. It is only used to add it as a minter.
     */
    function initialize(address lendingPoolAddress) public override {
        require(lendingPoolAddress.isContract(), "LP_MUST_BE_CONTRACT");
        lendingPool = LendingPoolInterface(lendingPoolAddress);
        ERC20 lendingToken = ERC20(lendingPool.lendingToken());
        string memory name_ =
            string(abi.encodePacked("Teller ", lendingToken.name()));
        string memory symbol_ =
            string(abi.encodePacked("t", lendingToken.symbol()));
        uint8 decimals_ = lendingToken.decimals();
        _initialize(name_, symbol_, decimals_);
    }
}
