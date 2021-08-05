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
import { LendingFacet } from "../../lending/LendingFacet.sol";
import {
    CreateLoanConsensusFacet
} from "../../market/CreateLoanConsensusFacet.sol";
import { LoanDataFacet } from "../../market/LoanDataFacet.sol";
import { RepayFacet } from "../../market/RepayFacet.sol";
import { SignersFacet } from "../../market/SignersFacet.sol";
import { NFTFacet } from "../../nft/NFTFacet.sol";
import {
    NFTMainnetBridgingToPolygonFacet
} from "../../nft/mainnet/NFTMainnetBridgingToPolygonFacet.sol";
import { CollateralFacet } from "../../market/CollateralFacet.sol";
import { CompoundFacet } from "../../escrow/dapps/CompoundFacet.sol";
import {
    CompoundClaimCompFacet
} from "../../escrow/dapps/CompoundClaimComp.sol";
import { AaveFacet } from "../../escrow/dapps/AaveFacet.sol";
import { PoolTogetherFacet } from "../../escrow/dapps/PoolTogetherFacet.sol";

abstract contract ITellerDiamond is
    SettingsFacet,
    PlatformSettingsFacet,
    AssetSettingsDataFacet,
    AssetSettingsFacet,
    PausableFacet,
    LendingFacet,
    CollateralFacet,
    CreateLoanConsensusFacet,
    LoanDataFacet,
    RepayFacet,
    SignersFacet,
    NFTFacet,
    NFTMainnetBridgingToPolygonFacet,
    CompoundFacet,
    CompoundClaimCompFacet,
    AaveFacet,
    PoolTogetherFacet,
    IDiamondCut,
    IDiamondLoupe
{}
