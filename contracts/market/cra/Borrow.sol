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
import { Signature } from "../../storage/market.sol";
import { Verifier } from "./verifier.sol";
import { LibLoans } from "../libraries/LibLoans.sol";
import "hardhat/console.sol";

contract BorrowFacet is RolesMods, ReentryMods, PausableMods, Verifier {
    // for testing
    function initializeConfigAdmins() external authorized(ADMIN, msg.sender) {
        s().markets[bytes32(uint256(0))].admin[msg.sender] = true;
        s().providers[bytes32(uint256(0))].admin[msg.sender] = true;
        s().providers[bytes32(uint256(1))].admin[msg.sender] = true;
        s().providers[bytes32(uint256(2))].admin[msg.sender] = true;
    }

    struct ProviderConfig {
        mapping(address => bool) admin;
        mapping(address => bool) signer;
    }

    struct MarketProviderConfig {
        uint32 maxAge;
        bytes32 providerId;
    }

    struct MarketConfig {
        MarketProviderConfig[4] providerConfigs;
        mapping(address => bool) admin;
    }

    struct Storage {
        mapping(bytes32 => MarketConfig) markets;
        // mapping(bytes32 => uint256[4]) markets;
        mapping(bytes32 => ProviderConfig) providers;
        mapping(bytes32 => bool) usedCommitments;
    }

    bytes32 internal constant POS =
        keccak256("teller.finance.provider.storage");

    function s() private pure returns (Storage storage s_) {
        bytes32 pos = POS;
        assembly {
            s_.slot := pos
        }
    }

    function setProviderAdmin(
        bytes32 providerId,
        address account,
        bool admin
    ) external onlyProviderAdmin(providerId) {
        s().providers[providerId].signer[account] = admin;
    }

    function getProviderAdmin(bytes32 providerId)
        external
        view
        returns (bool admin)
    {
        admin = s().providers[providerId].signer[msg.sender];
    }

    function setProviderSigner(
        bytes32 providerId,
        address account,
        bool signerValue
    ) external onlyProviderAdmin(providerId) {
        s().providers[providerId].signer[account] = signerValue;
    }

    function setMarketAdmin(
        bytes32 marketId,
        address account,
        bool admin
    ) external onlyMarketAdmin(marketId) {
        s().markets[marketId].admin[account] = admin;
    }

    // market config functions
    function setMarketProviderConfig(
        bytes32 marketId,
        uint256 configIndex,
        MarketProviderConfig calldata config
    ) external onlyMarketAdmin(marketId) {
        require(configIndex < 4, "Teller: Up to four providers");
        s().markets[marketId].providerConfigs[configIndex] = config;
    }

    function setHandler(
        bytes32 marketId,
        function(bytes memory) external returns (uint256, uint256) handler
    ) external onlyMarketAdmin(marketId) {}

    modifier onlyMarketAdmin(bytes32 marketId) {
        require(
            s().markets[marketId].admin[msg.sender],
            "Teller: not market admin"
        );
        _;
    }

    modifier onlyProviderAdmin(bytes32 providerId) {
        require(
            s().providers[providerId].admin[msg.sender],
            "Teller: not provider admin"
        );
        _;
    }
    struct SignatureData {
        Signature signature;
        uint256 signedAt;
    }

    struct LoanRequest {
        address[] collateralAssets;
        address loanToken;
        uint256[] collateralAmounts;
        uint256 loanAmount;
        uint256 duration;
    }

    function borrow(
        bytes32 marketId,
        Proof calldata proof,
        uint256[26] memory witness,
        SignatureData[3] calldata signatureData,
        LoanRequest calldata request
    ) external paused(LibLoans.ID, false) nonReentry("") {
        // Overwrite the first snark witness item with the on-chain identifier
        // for the loan (msg.sender ^ nonce). This forces the CRA to have been
        // run with the proper identifier.
        witness[0] =
            uint256(uint160(msg.sender)) ^
            LibLoans.s().borrowerLoans[msg.sender].length;

        // Verify the snark proof.
        require(verifyTx(proof, witness), "BE01");

        bytes32[3] memory commitments = [bytes32(0), bytes32(0), bytes32(0)];

        // Construct the commitments (data which are signed by provider).
        // uint256[8] memory cache = witness[2:10];
        // cache[7] = cache[7] ^= signatureData[0].signedAt;
        // commitments[0] = abi.encodePacked(cache);

        // cache = witness[10:18];
        // cache[7] = cache[7] ^= signatureData[1].signedAt;
        // commitments[1] = abi.encodePacked(cache);

        // cache = witness[18:26];
        // cache[7] = cache[7] ^= signatureData[2].signedAt;
        // commitments[2] = abi.encodePacked(cache);

        // But we already know both commitments are even? So it must be a signing issue.

        for (uint8 i = 0; i < 3; i++) {
            for (uint8 j = 0; j < 8; j++) {
                commitments[i] =
                    (commitments[i] << 32) ^
                    bytes32(witness[2 + i * 8 + j]);
            }
            commitments[i] ^= bytes32(signatureData[i].signedAt);
        }

        // Verify that the commitment signatures are valid and that the data
        // is not too old for the market's liking.
        _verifySignatures(marketId, commitments, signatureData);

        // The second witness item (after identifier) is the market
        // score
        uint256 marketScore = witness[1];

        // Let the market handle the loan request and disperse the loan.
        // s().markets[marketId].handler(abi.encode(marketScore, request));
    }

    function _verifySignatures(
        bytes32 marketId,
        bytes32[3] memory commitments,
        SignatureData[3] calldata signatureData
    ) private {
        for (uint256 i = 0; i < 3; i++) {
            require(
                signatureData[i].signedAt >
                    // solhint-disable-next-line
                    block.timestamp -
                        s().markets[marketId].providerConfigs[i].maxAge,
                "Signed at less than max age"
            );
            require(
                s().usedCommitments[commitments[i]] == false,
                "Teller: commitment already used"
            );

            s().usedCommitments[commitments[i]] = true;

            _validateSignature(
                signatureData[i].signature,
                commitments[i],
                s().markets[marketId].providerConfigs[i].providerId
            );
        }
    }

    /**
     * @notice It validates whether a signature is valid or not.
     * @param signature signature to validate.
     * @param commitment used to recover the signer.
     * @param providerId the expected signer address.
     */
    function _validateSignature(
        Signature memory signature,
        bytes32 commitment,
        bytes32 providerId
    ) private view {
        console.log("commitmentXXXX");
        console.log(uint256(commitment));
        console.log("providerIdXXXX");
        console.log(uint256(providerId));
        address recoveredSigner =
            ECDSA.recover(
                keccak256(
                    abi.encodePacked(
                        "\x19Ethereum Signed Message:\n32",
                        uint256(commitment)
                    )
                ),
                signature.v,
                signature.r,
                signature.s
            );
        console.log(recoveredSigner);
        require(
            s().providers[providerId].signer[recoveredSigner],
            "Teller: not valid signature"
        );
    }
}
