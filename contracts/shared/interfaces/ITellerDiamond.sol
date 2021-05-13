// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { IDiamondCut } from "./IDiamondCut.sol";
import { IDiamondLoupe } from "./IDiamondLoupe.sol";

import { SettingsFacet } from "../../settings/SettingsFacet.sol";
import {
    PlatformSettingsFacet
} from "../../settings/platform/PlatformSettingsFacet.sol";
import {
    AssetSettingsDataFacet
} from "../../settings/asset/AssetSettingsDataFacet.sol";
import {
    AssetSettingsFacet
} from "../../settings/asset/AssetSettingsFacet.sol";
import { PausableFacet } from "../../settings/pausable/PausableFacet.sol";
import { PriceAggFacet } from "../../price-aggregator/PriceAggFacet.sol";
import {
    ChainlinkAggFacet
} from "../../price-aggregator/chainlink/ChainlinkAggFacet.sol";
import { LendingFacet } from "../../lending/LendingFacet.sol";
import { CreateLoanFacet } from "../../market/CreateLoanFacet.sol";
import { LoanDataFacet } from "../../market/LoanDataFacet.sol";
import { RepayFacet } from "../../market/RepayFacet.sol";
import { SignersFacet } from "../../market/SignersFacet.sol";
import { NFTFacet } from "../../nft/NFTFacet.sol";
import {
    EscrowClaimTokensFacet
} from "../../escrow/EscrowClaimTokensFacet.sol";
import { CollateralFacet } from "../../market/CollateralFacet.sol";
import { AaveFacet } from "../../escrow/dapps/AaveFacet.sol";
import { SushiswapFacet } from "../../escrow/dapps/SushiswapFacet.sol";

abstract contract ITellerDiamond is
    SettingsFacet,
    PlatformSettingsFacet,
    AssetSettingsDataFacet,
    AssetSettingsFacet,
    PausableFacet,
    PriceAggFacet,
    ChainlinkAggFacet,
    LendingFacet,
    CollateralFacet,
    CreateLoanFacet,
    LoanDataFacet,
    RepayFacet,
    SignersFacet,
    NFTFacet,
    EscrowClaimTokensFacet,
    AaveFacet,
    SushiswapFacet,
    IDiamondCut,
    IDiamondLoupe
{}
