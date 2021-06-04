// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// External utilities
import { ECDSA } from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

import { Signature } from "../../storage/market.sol";

contract DataProviderStorage {
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
        function(uint256, uint256, uint256, uint256, uint256, uint256)
            external
            returns (uint256, uint256) handler;
    }

    struct Storage {
        mapping(bytes32 => MarketConfig) markets;
        // mapping(bytes32 => uint256[4]) markets;
        mapping(bytes32 => ProviderConfig) providers;
        mapping(bytes32 => bool) usedCommitments;
    }

    bytes32 internal constant POS =
        keccak256("teller.finance.provider.storage");

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

    function s() internal pure returns (Storage storage s_) {
        bytes32 pos = POS;
        assembly {
            s_.slot := pos
        }
    }

    function handler(bytes32 marketId)
        external
        view
        returns (
            function(uint256, uint256, uint256, uint256, uint256, uint256)
                external
                returns (uint256, uint256) handler_
        )
    {
        handler_ = s().markets[marketId].handler;
    }

    function isProviderSigner(bytes32 providerId, address account)
        external
        view
        returns (bool isSigner_)
    {
        isSigner_ = s().providers[providerId].signer[account];
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

    function weights(bytes32 marketId)
        external
        view
        returns (uint256[4] memory weights_)
    {
        for (uint256 i = 0; i < 4; i++) {
            weights_[i] = s().markets[marketId].providerConfigs[i].weight;
        }
    }

    function verifySignatures(
        bytes32 marketId,
        bytes32[4] calldata commitments,
        Signature[4] calldata signatures,
        uint256[4] calldata signedAt
    ) public {
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

    // end market config functions

    // provider config functions
    function setSigner(
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

    function setHandler(
        bytes32 marketId,
        function(uint256, uint256, uint256, uint256, uint256)
            external
            returns (uint256, uint256) handler
    ) external onlyMarketAdmin(marketId) {}

    function setProviderAdmin(
        bytes32 providerId,
        address account,
        bool admin
    ) external onlyProviderAdmin(providerId) {
        s().providers[providerId].signer[account] = admin;
    }

    // end provider config functions

    // check signature is valid

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
    ) internal view {
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
}
