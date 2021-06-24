// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// external contracts
import { ECDSA } from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

// Teller contracts
import { PausableMods } from "../../settings/pausable/PausableMods.sol";
import {
    ReentryMods
} from "../../contexts2/access-control/reentry/ReentryMods.sol";
import { RolesMods } from "../../contexts2/access-control/roles/RolesMods.sol";
import { ADMIN } from "../../shared/roles.sol";
import {
    Signature,
    MarketStorageLib,
    MarketStorage,
    MarketConfig,
    ProviderConfig
} from "../../storage/market.sol";
import { Verifier } from "./verifier.sol";
import { LibLoans } from "../libraries/LibLoans.sol";
// import reentry guard
import "hardhat/console.sol";

library BorrowLib {
    // is RolesMods {
    // for testing
    // function initializeConfigAdmins() external authorized(ADMIN, msg.sender) {
    //     // only used for testing
    //     m(bytes32(uint256(0))).admin[msg.sender] = true;
    //     m(bytes32(uint256(0))).providersConfigs(bytes32(uint256(0))).admin[
    //         msg.sender
    //     ] = true;
    //     m(bytes32(uint256(0))).providersConfigs(bytes32(uint256(1))).admin[
    //         msg.sender
    //     ] = true;
    //     m(bytes32(uint256(0))).providersConfigs(bytes32(uint256(2))).admin[
    //         msg.sender
    //     ] = true;
    // }

    function s() internal pure returns (MarketStorage storage s_) {
        s_ = MarketStorageLib.store();
    }

    function m(bytes32 marketId)
        internal
        view
        returns (MarketConfig storage m_)
    {
        m_ = s().markets[marketId];
    }

    function c(bytes32 commitmentId) internal view returns (bool c_) {
        c_ = s().usedCommitments[commitmentId];
    }

    function setProviderAdmin(
        bytes32 marketId,
        bytes32 providerId,
        address account,
        bool admin
    ) external onlyProviderAdmin(providerId, marketId) {
        m(marketId).providerConfigs[providerId].signer[account] = admin;
    }

    function getProviderAdmin(bytes32 providerId, bytes32 marketId)
        external
        view
        returns (bool admin)
    {
        admin = m(marketId).providerConfigs[providerId].signer[msg.sender];
    }

    function setProviderSigner(
        bytes32 providerId,
        bytes32 marketId,
        address account,
        bool signerValue
    ) external onlyProviderAdmin(providerId, marketId) {
        m(marketId).providerConfigs[providerId].signer[account] = signerValue;
    }

    function setMarketAdmin(
        bytes32 marketId,
        address account,
        bool admin
    ) external onlyMarketAdmin(marketId) {
        m(marketId).admin[account] = admin;
    }

    function setHandler(
        bytes32 marketId,
        function(bytes memory) external returns (uint256, uint256) handler
    ) external onlyMarketAdmin(marketId) {}

    modifier onlyMarketAdmin(bytes32 marketId) {
        require(m(marketId).admin[msg.sender], "Teller: not market admin");
        _;
    }

    modifier onlyProviderAdmin(bytes32 providerId, bytes32 marketId) {
        require(
            m(marketId).providerConfigs[providerId].admin[msg.sender],
            "Teller: not provider admin"
        );
        _;
    }
}
