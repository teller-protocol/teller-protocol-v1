// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { SettingsFacet } from "../../settings/SettingsFacet.sol";
import {
    PlatformSettingsFacet
} from "../../settings/platform/PlatformSettingsFacet.sol";
import {
    AssetSettingsFacet
} from "../../settings/asset/AssetSettingsFacet.sol";
import { SettingsFacet } from "../../settings/SettingsFacet.sol";
import { PriceAggFacet } from "../../price-aggregator/PriceAggFacet.sol";
import {
    ChainlinkAggFacet
} from "../../price-aggregator/chainlink/ChainlinkAggFacet.sol";
import { LendingFacet } from "../../lending/LendingFacet.sol";
import { CreateLoanFacet } from "../../market/CreateLoanFacet.sol";
import { LoanDataFacet } from "../../market/LoanDataFacet.sol";
import { RepayFacet } from "../../market/RepayFacet.sol";
import { LiquidateFacet } from "../../market/LiquidateFacet.sol";
import { SignersFacet } from "../../market/SignersFacet.sol";
import { StakingFacet } from "../../staking/StakingFacet.sol";
import { EscrowFacet } from "../../escrow/EscrowFacet.sol";

abstract contract ITellerDiamond is
    SettingsFacet,
    PlatformSettingsFacet,
    AssetSettingsFacet,
    PriceAggFacet,
    ChainlinkAggFacet,
    LendingFacet,
    CreateLoanFacet,
    LoanDataFacet,
    RepayFacet,
    LiquidateFacet,
    SignersFacet,
    StakingFacet,
    EscrowFacet
{}
