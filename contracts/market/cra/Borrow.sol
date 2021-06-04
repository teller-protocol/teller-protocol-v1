// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// External utilities
import { ECDSA } from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

import { Signature } from "../../storage/market.sol";
import { Verifier } from "./verifier.sol";

contract BorrowFacet is Verifier {
    struct ProviderConfig {
        mapping(address => bool) admin;
        mapping(address => bool) signer;
    }

    struct MarketProviderConfig {
        uint32 weight;
        uint32 maxAge;
        bytes32 providerId;
    }

    struct MarketConfig {
        MarketProviderConfig[4] providerConfigs;
        mapping(address => bool) admin;
        function(uint256, uint256[], uint256[], uint256, uint256, uint256)
            external handler;
    }

    struct Storage {
        mapping(bytes32 => MarketConfig) markets;
        // mapping(bytes32 => uint256[4]) markets;
        mapping(bytes32 => ProviderConfig) providers;
        mapping(bytes32 => bool) usedCommitments;
    }

    bytes32 internal constant POS =
        keccak256("teller.finance.provider.storage");

    /**
        Borow from a market. We provide verification functions to make sure that
        all data used is not forged or re-used and outsource the calculation of
        terms to the target market. The market uses the CRA's output score and
        the user's desired loan amount and collateral details to determine what
        their own terms are. These terms are encoded as a byte array due to not
        being able to generically express this in solidity.

        @param proof Proof of the CRA.
        @param witness uint256[] list of public input params and output values
        from the CRA. The witness is encoded in the following way in zokrates:
          1. Public input parameters from left to right
          2. Output values from left to right
        In the case of our ZK CRA, this comes out to:
          [
              identifier,
              weight1, weight2, weight3, weight4,
              marketScore,
              commitment1, commitment2, commitment3, commitment4
          ]
        @param signatures Signature[] ordered list of data provider signatures.
        @param signedAt uint256[] ordered list of data provider signature
        timestamps.
        @param collateralAsset uint256 tokenId of the collateral asset the user
        wants to use.
        @param collateralAmount uint256 amount of collateralAsset the user
        wishes to provide as collateral.
        @param collateralRatio uint256 percentage expressed in bips for how much
        collateral the user wants to provide to the market for this loan.
        @param loanToken uint256 tokenId of the loan asset the user wishes to
        receive the loan in.
        @param loanAmount uint256 amount of loanToken the user wishes to receive
        for this loan.
     */
    function borrow(
        bytes32 marketId,
        Proof calldata proof,
        uint256[26] calldata witness,
        Signature[3] calldata signatures,
        uint256[3] calldata signedAt,
        uint256[] collateralAssets,
        uint256[] collateralAmounts,
        uint256 loanToken,
        uint256 loanAmount,
        uint256 duration
    ) external paused(LibLoans.ID, false) nonReentry("") {
        // Overwrite the first snark witness item with the on-chain identifier
        // for the loan (msg.sender ^ nonce). This forces the CRA to have been
        // run with the proper identifier.
        witness[0] = uint256(msg.sender) ^ getBorrowerLoans(msg.sender).length;

        // Verify the snark proof.
        require(verifyTx(proof, witness), "BE01");

        bytes32[3] memory commitments = [];

        // Construct the commitments (data which are signed by provider).
        for (uint8 i = 0; i < 3; i++) {
            for (uint8 j = 0; j < 8; j++) {
                commitments[i] =
                    (commitments[i] << 32) |
                    bytes32(witness[2 + i + j]);
            }
            commitments[i] ^= signedAt;
        }

        // Verify that the commitment signatures are valid and that the data
        // is not too old for the market's liking.
        _verifySignatures(marketId, commitments, signatures, signedAt);

        // The second witness item (after identifier) is the market
        // score
        uint256 marketScore = witness[1];

        // Let the market handle the loan request and disperse the loan.
        s().markets[marketId].handler(
            marketScore,
            collateralAssets,
            collateralAmounts,
            loanToken,
            loanAmount,
            duration
        );
    }

    function setProviderAdmin(
        bytes32 providerId,
        address account,
        bool admin
    ) external onlyProviderAdmin(providerId) {
        s().providers[providerId].signer[account] = admin;
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
        function(uint256, uint256, uint256, uint256, uint256)
            external
            returns (uint256, uint256) handler
    ) external onlyMarketAdmin(marketId) {}

    function _verifySignatures(
        bytes32 marketId,
        bytes32[4] calldata commitments,
        Signature[4] calldata signatures,
        uint256[4] calldata signedAt
    ) private {
        for (uint256 i = 0; i < 4; i++) {
            require(
                signedAt[i] >
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
                signatures[i],
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
        require(
            s().providers[providerId].signer[
                ECDSA.recover(
                    keccak256(
                        abi.encodePacked(
                            "\x19Ethereum Signed Message:\n32",
                            commitment
                        )
                    ),
                    signature.v,
                    signature.r,
                    signature.s
                )
            ],
            "Teller: not valid signature"
        );
    }

    function _weights(bytes32 marketId)
        private
        view
        returns (uint256[4] memory weights_)
    {
        for (uint256 i = 0; i < 4; i++) {
            weights_[i] = s().markets[marketId].providerConfigs[i].weight;
        }
    }

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
            "Teller: not market admin"
        );
        _;
    }

    function s() private pure returns (Storage storage s_) {
        bytes32 pos = POS;
        assembly {
            s_.slot := pos
        }
    }
}
