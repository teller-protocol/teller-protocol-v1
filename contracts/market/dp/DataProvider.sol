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

    struct MarketConfig {
        uint32 weight;
        uint32 maxAge;
        uint224 dataProviderId;
    }

    struct Storage {
        mapping(bytes32 => MarketConfig[]) markets;
        // mapping(bytes32 => uint256[4]) markets;
        mapping(bytes32 => ProviderConfig) providers;
    }

    bytes32 internal constant POS =
        keccak256("teller.finance.provider.storage");

    function s() internal pure returns (Storage storage s_) {
        bytes32 pos = POS;
        assembly {
            s_.slot := pos
        }
    }

    // market config functions
    function storeMarketConfig(
        bytes32 marketId,
        uint256 configIndex,
        MarketConfig memory config
    ) internal {
        require(configIndex < 4, "Teller: Up to four providers");
        s().markets[marketId][configIndex] = config;
    }

    function getMarketConfig(bytes32 marketId)
        internal
        view
        returns (MarketConfig[] storage market_)
    {
        market_ = s().markets[marketId];
    }

    function weights(bytes32 marketId)
        external
        view
        returns (uint256[4] memory weights_)
    {
        for (uint256 i = 0; i < 4; i++) {
            weights_[i] = s().markets[marketId][i].weight;
        }
        return weights_;
    }

    function verifySignatures(
        bytes32 marketId,
        bytes32[4] calldata comittment,
        Signature[4] calldata signatures,
        uint256[4] calldata signedAt
    ) public view {
        for (uint256 i = 0; i < 4; i++) {
            require(
                signedAt[i] > block.timestamp - s().markets[marketId][i].maxAge,
                "Signed at less than max age"
            );
            _signatureValid(
                signatures[i],
                comittment[i],
                bytes32(bytes28(s().markets[marketId][i].dataProviderId))
            );
        }
    }

    // end market config functions

    // provider config functions
    function setSigner(
        bytes32 providerId,
        address account,
        bool signerValue
    ) external {
        require(
            s().providers[providerId].admin[msg.sender],
            "Teller: NOT ADMIN"
        );
        s().providers[providerId].signer[account] = signerValue;
    }

    function isSigner(bytes32 providerKey, address account)
        external
        view
        returns (bool isSigner_)
    {
        isSigner_ = s().providers[providerKey].signer[account];
    }

    function setAdmin(
        bytes32 providerId,
        address account,
        bool admin
    ) external {
        require(
            s().providers[providerId].admin[msg.sender],
            "Teller: NOT ADMIN"
        );
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
    function _signatureValid(
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
