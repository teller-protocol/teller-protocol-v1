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
import { CreateLoanFacet } from "../../market/CreateLoanFacet.sol";
import { CreateLoanNFTFacet } from "../../market/CreateLoanNFTFacet.sol";
import { CreateLoanSnarkFacet } from "../../market/CreateLoanSnarkFacet.sol";
import { LoanDataFacet } from "../../market/LoanDataFacet.sol";
import { RepayFacet } from "../../market/RepayFacet.sol";
import { SignersFacet } from "../../market/SignersFacet.sol";
import { NFTFacet } from "../../nft/NFTFacet.sol";
import { CollateralFacet } from "../../market/CollateralFacet.sol";
import { CompoundFacet } from "../../escrow/dapps/CompoundFacet.sol";
import {
    CompoundClaimCompFacet
} from "../../escrow/dapps/CompoundClaimComp.sol";
import { AaveFacet } from "../../escrow/dapps/AaveFacet.sol";
import { PoolTogetherFacet } from "../../escrow/dapps/PoolTogetherFacet.sol";
import { ProviderFactoryFacet } from "../../market/ProviderFactoryFacet.sol";

// When adding a new Facet, kindly make sure to order the inherited contracts around so
// that it's consistent with all the Facets' inheritance order. For example, if all the
// Facets import the mods such as `is ReentryMods, PausableMods`, but a new facet imports
// the mod as `is PausableMods, ReentryMods`, we will get an error called `Linearization of inheritance
// impossible`. Kindly order the Inheritances around in the same order to pass this error.
abstract contract ITellerDiamond is
    SettingsFacet,
    PlatformSettingsFacet,
    AssetSettingsDataFacet,
    AssetSettingsFacet,
    PausableFacet,
    LendingFacet,
    CollateralFacet,
    CreateLoanFacet,
    CreateLoanNFTFacet,
    CreateLoanSnarkFacet,
    LoanDataFacet,
    RepayFacet,
    SignersFacet,
    NFTFacet,
    CompoundFacet,
    CompoundClaimCompFacet,
    AaveFacet,
    PoolTogetherFacet,
    IDiamondCut,
    IDiamondLoupe,
    ProviderFactoryFacet
{

}
