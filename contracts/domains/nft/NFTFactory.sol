// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
pragma experimental ABIEncoderV2;

// Contracts
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "../Factory.sol";
import "./TellerNFT.sol";

// Interfaces

/*****************************************************************************************************/
/**                                             WARNING                                             **/
/**                        THIS CONTRACT IS AN UPGRADEABLE STORAGE CONTRACT!                        **/
/**  ---------------------------------------------------------------------------------------------  **/
/**  Do NOT change the order of or PREPEND any storage variables to this or new versions            **/
/**  of this contract as this will cause a ripple affect to the storage slots of all child          **/
/**  contracts that inherit from this contract to be overwritten on the deployed proxy contract!!   **/
/**                                                                                                 **/
/**  Visit https://docs.openzeppelin.com/upgrades/2.6/proxies#upgrading-via-the-proxy-pattern for   **/
/**  more information.                                                                              **/
/*****************************************************************************************************/
/**
 * @notice
 *
 * @author develop@teller.finance
 */
contract NFTFactory is DynamicUpgradeable {
    TellerNFT public nft;

    bytes32[] public tierMerkleRoots;

    mapping(uint256 => mapping(uint256 => uint256)) public claimedBitMap;

    event Claimed(uint256 index, address account, uint256 amount);

    event TierAdded(uint256 index);

    function getTierMerkleRoots() external view returns (bytes32[] memory) {
        return tierMerkleRoots;
    }

    function claim(
        uint256 tierIndex,
        uint256 index,
        address account,
        uint256 amount,
        bytes32[] calldata merkleProof
    ) external {
        require(!isClaimed(tierIndex, index), "Teller: NFT already claimed.");

        // Verify the merkle proof.
        bytes32 node = keccak256(abi.encodePacked(index, account, amount));
        require(
            MerkleProof.verify(merkleProof, tierMerkleRoots[tierIndex], node),
            "Teller: Invalid proof."
        );

        // Mark it claimed and send the token.
        _setClaimed(tierIndex, index);
        for (uint256 i; i < amount; i++) {
            nft.mint(tierIndex, account);
        }

        emit Claimed(index, account, amount);
    }

    function _setClaimed(uint256 tierIndex, uint256 index) private {
        uint256 claimedWordIndex = index / 256;
        uint256 claimedBitIndex = index % 256;
        claimedBitMap[tierIndex][claimedWordIndex] =
            claimedBitMap[tierIndex][claimedWordIndex] |
            (1 << claimedBitIndex);
    }

    function isClaimed(uint256 tierIndex, uint256 index)
        public
        view
        returns (bool)
    {
        uint256 claimedWordIndex = index / 256;
        uint256 claimedBitIndex = index % 256;
        uint256 claimedWord = claimedBitMap[tierIndex][claimedWordIndex];
        uint256 mask = (1 << claimedBitIndex);
        return claimedWord & mask == mask;
    }

    function addTier(bytes32 merkleRoot) external {
        tierMerkleRoots.push(merkleRoot);

        emit TierAdded(tierMerkleRoots.length - 1);
    }

    function initialize(address nftAddress) external {
        require(address(nft) == address(0), "Teller: Already initialized");
        nft = TellerNFT(nftAddress);
    }
}
