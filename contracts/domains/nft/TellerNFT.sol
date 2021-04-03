// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
pragma experimental ABIEncoderV2;

// Contracts
import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "../upgradeable/DynamicUpgradeable.sol";
import "./NFTStorage.sol";

// Libraries
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

// Interfaces
import "../../interfaces/nft/ITellerNFT.sol";

/*****************************************************************************************************/
/**                                             WARNING                                             **/
/**                                  THIS CONTRACT IS UPGRADEABLE!                                  **/
/**  ---------------------------------------------------------------------------------------------  **/
/**  Do NOT change the order of or PREPEND any storage variables to this or new versions of this    **/
/**  contract as this will cause the the storage slots to be overwritten on the proxy contract!!    **/
/**                                                                                                 **/
/**  Visit https://docs.openzeppelin.com/upgrades/2.6/proxies#upgrading-via-the-proxy-pattern for   **/
/**  more information.                                                                              **/
/*****************************************************************************************************/
/**
 * @notice This contract is used by borrowers to call Dapp functions (using delegate calls).
 * @notice This contract should only be constructed using it's upgradeable Proxy contract.
 * @notice In order to call a Dapp function, the Dapp must be added in the DappRegistry instance.
 *
 * @author develop@teller.finance
 */
contract TellerNFT is
    ITellerNFT,
    DynamicUpgradeable,
    ERC721Upgradeable,
    AccessControlUpgradeable,
    NFTStorage
{
    using Counters for Counters.Counter;
    using EnumerableSet for EnumerableSet.UintSet;
    using SafeMath for uint256;

    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    // It holds the total number of tiers.
    Counters.Counter internal tierCounter;

    // It holds the total number of tokens minted for a tier.
    mapping(uint256 => Counters.Counter) internal tierTokenCounter;

    // It holds the information about a tier.
    mapping(uint256 => Tier) public tiers;

    // It holds which tier a token ID is in.
    mapping(uint256 => uint256) public tokenTierMap;

    // It holds a set of token IDs for an owner address.
    mapping(address => EnumerableSet.UintSet) internal ownerTokenIDs;

    modifier onlyMinter() {
        require(hasRole(MINTER_ROLE, _msgSender()), "Teller: not minter");
        _;
    }

    /**
     * @notice It returns an array of token IDs owned by an address.
     * @dev It uses a EnumerableSet to store values and loops over each element to add to the array.
     * @dev Can be costly if calling within a contract for address with many tokens.
     */
    function getTierHashes(uint256 tierIndex)
        external
        view
        returns (string[] memory)
    {
        return tiers[tierIndex].hashes;
    }

    /**
     * @notice It returns an array of token IDs owned by an address.
     * @dev It uses a EnumerableSet to store values and loops over each element to add to the array.
     * @dev Can be costly if calling within a contract for address with many tokens.
     */
    function ownedTokens(address owner)
        external
        view
        returns (uint256[] memory owned)
    {
        EnumerableSet.UintSet storage set = ownerTokenIDs[owner];
        owned = new uint256[](set.length());
        for (uint256 i; i < owned.length; i++) {
            owned[i] = set.at(i);
        }
    }

    function mint(uint256 tierIndex, address owner) external onlyMinter {
        // Get the new token ID
        Counters.Counter storage counter = tierTokenCounter[tierIndex];
        uint256 tokenId = counter.current();
        counter.increment();

        // Mint and set the token to the tier index
        _safeMint(owner, tokenId);
        tokenTierMap[tokenId] = tierIndex;

        // Set
        _setOwner(owner, tokenId);
    }

    function addTier(Tier memory newTier) external onlyMinter {
        Tier storage tier = tiers[tierCounter.current()];
        require(
            tier.contributionAsset == address(0),
            "Teller: tier already exists"
        );

        tier.baseLoanSize = newTier.baseLoanSize;
        tier.hashes = newTier.hashes;
        tier.contributionAsset = newTier.contributionAsset;
        tier.contributionSize = newTier.contributionSize;
        tier.contributionMultiplier = newTier.contributionMultiplier;

        tierCounter.increment();
    }

    function removeMinter(address minter) external onlyMinter {
        revokeRole(MINTER_ROLE, minter);
    }

    function addMinter(address minter) public onlyMinter {
        _setupRole(MINTER_ROLE, minter);
    }

    function initialize(address[] calldata minters) external {
        __ERC721_init("Teller NFT", "TNFT");

        for (uint256 i; i < minters.length; i++) {
            _setupRole(MINTER_ROLE, minters[i]);
        }
    }

    function supportsInterface(bytes4 interfaceId)
        public
        pure
        override(AccessControlUpgradeable, ERC721Upgradeable)
        returns (bool)
    {
        return interfaceId == type(ITellerNFT).interfaceId;
    }

    /**
     * @notice The token URI is based on the token ID.
     */
    function tokenURI(uint256 tokenId)
        public
        view
        override
        returns (string memory)
    {
        require(
            _exists(tokenId),
            "ERC721Metadata: URI query for nonexistent token"
        );

        string memory baseURI = _baseURI();
        return
            bytes(baseURI).length > 0
                ? string(abi.encodePacked(baseURI, _tokenURIHash(tokenId)))
                : "";
    }

    /**
     * @notice It returns the hash to use for the token URI.
     */
    function _tokenURIHash(uint256 tokenId)
        internal
        view
        returns (string memory)
    {
        string[] storage tierImageHashes = tiers[tokenTierMap[tokenId]].hashes;
        return tierImageHashes[tokenId.mod(tierImageHashes.length)];
    }

    /**
     * @notice The base URI path where the token media is hosted.
     * @dev Base URI for computing {tokenURI}.
     */
    function _baseURI() internal view override returns (string memory) {
        return "https://gateway.pinata.cloud/ipfs/";
    }

    /**
     * @notice Moves token to new owner set and then transfers.
     */
    function _transfer(
        address from,
        address to,
        uint256 tokenId
    ) internal override {
        _setOwner(to, tokenId);
        super._transfer(from, to, tokenId);
    }

    /**
     * @notice It removes the token from the current owner set and adds to new owner.
     */
    function _setOwner(address newOwner, uint256 tokenId) internal {
        address currentOwner = ownerOf(tokenId);
        if (currentOwner != address(0)) {
            ownerTokenIDs[currentOwner].remove(tokenId);
        }
        ownerTokenIDs[newOwner].add(tokenId);
    }

    function _msgData()
        internal
        pure
        override(ContextUpgradeable)
        returns (bytes calldata)
    {
        return msg.data;
    }
}
