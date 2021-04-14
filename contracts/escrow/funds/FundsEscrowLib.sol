// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Contracts
import { FundsEscrow } from "./FundsEscrow.sol";

// Libraries
import "@openzeppelin/contracts/proxy/Clones.sol";

// Storage
import { FundsEscrowStorageLib, FundsEscrowStorage } from "./storage.sol";

library FundsEscrowLib {
    function s() internal returns (FundsEscrowStorage storage) {
        return FundsEscrowStorageLib.store();
    }

    /**
     * @dev Deposits funds into an escrow contract.
     * @dev If a FundEscrow does not exist for {asset}, one will be created.
     * @param id Encoded facet id who is depositing.
     * @param asset The asset to deposit.
     * @param amount The amount of {asset} to deposit.
     * @param owner The owner of the deposited funds.
     */
    function deposit(
        bytes32 id,
        address asset,
        uint256 amount,
        address owner
    ) internal {
        create(asset);
        s().assetEscrow[asset].deposit(id, owner, amount);
    }

    /**
     * @dev Deposits funds into an escrow contract.
     * @param id Encoded facet id who is depositing.
     * @param asset The asset to deposit.
     * @param amount The amount of {asset} to deposit.
     * @param owner The owner of the deposited funds.
     *
     * Requirements:
     *  - FundEscrow for {asset} must exist.
     */
    function withdraw(
        bytes32 id,
        address asset,
        uint256 amount,
        address owner
    ) internal {
        require(exists(asset), "FundsEscrow: not exists");
        s().assetEscrow[asset].withdraw(id, owner, amount);
    }

    /**
     * @dev Checks if a FundsEscrow exists for an asset.
     * @param asset The address to check for an escrow.
     */
    function exists(address asset) internal view returns (bool) {
        return address(s().escrows[asset]) != address(0);
    }

    /**
     * @dev Deterministically clones a FundsEscrow contract for an asset.
     * @dev If one already exists, nothing happens.
     * @param asset Asset to create an escrow for.
     */
    function create(address asset) internal {
        if (exists(asset)) return;

        address escrow =
            Clones.cloneDeterministic(s().implementation, bytes32(asset));
        s().escrows.add(escrow);
        s().assetEscrow[asset] = FundsEscrow(escrow);
        s().assetEscrow[asset].init(asset);
    }
}
