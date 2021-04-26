// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/utils/introspection/ERC165Checker.sol";

import {
    RolesLib
} from "../../../contexts2/access-control/roles/RolesContext.sol";

import { Address } from "@openzeppelin/contracts/utils/Address.sol";
import { ATToken } from "../abstract/ATToken.sol";
import { IStrategy } from "../interfaces/IStrategy.sol";

import "./Storage.sol" as Storage;

bytes32 constant CONTROLLER = keccak256("CONTROLLER");
bytes32 constant ADMIN = keccak256("ADMIN");

contract TTokenV1 is ATToken {
    function() pure returns (Storage.Store storage) private constant S =
        Storage.store;

    function initialize(
        ERC20 _underlying,
        IStrategy _strategy,
        bytes calldata _strategyInit,
        address admin,
        address controller
    ) external initializer {
        __INIT_TTokenBase(_underlying, _strategy, _strategyInit);

        S().restricted = true;
        RolesLib.grantRole(ADMIN, admin);
        RolesLib.grantRole(CONTROLLER, controller);
    }

    /**
     * @notice Checks if the LP is restricted or has the CONTROLLER role.
     *
     * The LP being restricted means that only the Teller protocol may
     *  lend/borrow funds.
     */
    modifier notRestricted {
        require(
            !TTokenStore().restricted ||
                RolesLib.hasRole(CONTROLLER, msg.sender),
            "Teller: platform restricted"
        );
        _;
    }

    modifier authorized(bytes32 role) {
        require(RolesLib.hasRole(role, msg.sender));
        _;
    }

    function restricted() external view returns (bool) {
        return S().restricted;
    }

    function restrict(bool _restrict) external authorized(ADMIN) {
        S().restricted = _restrict;
    }

    function fundLoan(address recipient, uint256 amount)
        external
        override
        authorized(CONTROLLER)
        withdrawal()
    {}

    function mint(uint256 amount) external override deposit returns (uint256) {}

    function redeem(uint256 amount) external override withdrawal {}

    function redeemUnderlying(uint256 amount) external override withdrawal {}
}
