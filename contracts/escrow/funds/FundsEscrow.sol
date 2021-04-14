// // SPDX-License-Identifier: MIT
// pragma solidity ^0.8.0;

// //
// import {
//     OwnableUpgradeable
// } from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
// import { Address } from "@openzeppelin/contracts/utils/Address.sol";
// import { SafeMath } from "@openzeppelin/contracts/utils/math/SafeMath.sol";
// import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
// import {
//     SafeERC20
// } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

// contract FundsEscrow is OwnableUpgradeable {
//     using Address for address;
//     using SafeMath for uint256;
//     using SafeERC20 for ERC20;

//     // @notice The asset this FundEscrow is for.
//     address public asset;

//     // Contains the balances of id => owner => amount
//     mapping(bytes32 => mapping(address => uint256)) internal balances;

//     /**
//      * @notice Deposits funds {from} into this escrow.
//      * @notice Funds are accounted for by an {id} and {owner}.
//      */
//     function deposit(
//         bytes32 id,
//         address from,
//         address owner,
//         uint256 amount
//     ) external onlyOwner {
//         balances[id][owner] = balances[id][owner].add(amount);
//         totalBalance = totalBalance.add(amount);
//         ERC20(asset).safeTransferFrom(from, address(this), amount);
//     }

//     /**
//      * @notice Withdraws funds {to} from this escrow.
//      * @notice Funds are accounted for by an {id} and {owner}.
//      */
//     function withdraw(
//         bytes32 id,
//         address to,
//         address owner,
//         uint256 amount
//     ) external onlyOwner {
//         require(
//             balances[id][owner] >= amount,
//             "FundsEscrow: insufficient balance to withdraw"
//         );

//         ERC20(asset).safeTransfer(to, amount);
//         balances[id][owner] = balances[id][owner].sub(amount);
//         totalBalance = totalBalance.sub(amount);
//     }

//     /**
//      * @notice Initializes this escrow by setting the asset it will hold funds for.
//      * @param _asset The asset address to hold funds for.
//      *
//      * Requirements:
//      *  - The escrow must not be initialized already.
//      */
//     function init(address _asset) external initializer {
//         __Ownable_init();
//         asset = _asset;
//     }
// }
