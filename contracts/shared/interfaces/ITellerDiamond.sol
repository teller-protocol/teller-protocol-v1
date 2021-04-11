// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { SettingsFacet } from "../../settings/SettingsFacet.sol";
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
    LendingFacet,
    CreateLoanFacet,
    LoanDataFacet,
    RepayFacet,
    LiquidateFacet,
    SignersFacet,
    StakingFacet,
    EscrowFacet
{}