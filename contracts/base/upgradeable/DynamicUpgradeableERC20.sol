pragma solidity 0.5.17;
pragma experimental ABIEncoderV2;

// Contracts
import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/ERC20Detailed.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/ERC20Mintable.sol";
import "./DynamicUpgradeable.sol";

contract DynamicUpgradeableERC20 is
    ERC20Detailed,
    ERC20Mintable,
    DynamicUpgradeable
{}
