// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Contracts
import {
    ERC1155Upgradeable
} from "@openzeppelin/contracts-upgradeable/token/ERC1155/ERC1155Upgradeable.sol";
import {
    AccessControlUpgradeable
} from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";

// Libraries
import { SafeCast } from "@openzeppelin/contracts/utils/math/SafeCast.sol";
import {
    EnumerableSet
} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

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
 * @notice This is the logic for the Teller NFT Version 2.
 * @notice This contract contains the base logic of an ERC1155 NFT that works for all
 *  networks. Some functionality is required on a specific network, therefore, there may
 *  exist a child contract that inherits from this.
 * @notice The TellerNFT_V2 is meant to be used for taking out loans on the Teller Protocol
 *  without the need for a bank account or collateral. The max loan size using an NFT is
 *  is determined by the `tokenBaseLoanSize`.
 *
 * @author develop@teller.finance
 */
abstract contract TellerNFT_V2 is ERC1155Upgradeable, AccessControlUpgradeable {
    using EnumerableSet for EnumerableSet.UintSet;

    /* Constants */
    string public constant name = "Teller NFT";
    string public constant symbol = "TNFT";

    uint256 private constant ID_PADDING = 10000;

    bytes32 public constant ADMIN = keccak256("ADMIN");

    /* State Variables */

    struct Tier {
        uint256 baseLoanSize;
        address contributionAsset;
        uint256 contributionSize;
        uint16 contributionMultiplier;
    }

    // It holds the total number of tokens in existence.
    uint256 public totalSupply;

    // It holds the information about a tier.
    mapping(uint256 => Tier) public tiers;

    // It holds the total number of tiers.
    uint128 public tierCount;

    // It holds how many tokens types exists in a tier.
    mapping(uint128 => uint256) public tierTokenCount;

    // It holds a set of tokenIds for an owner address
    mapping(address => EnumerableSet.UintSet) internal _ownedTokenIds;

    // It holds the URI hash containing the token metadata
    mapping(uint256 => string) internal _idToUriHash;

    // It is a reverse lookup of the token ID given the metadata hash
    mapping(string => uint256) internal _uriHashToId;

    // Hash to the contract metadata
    string private _contractURIHash;

    /* Public Functions */

    /**
     * @notice checks if an interface is supported by ITellerNFT or AccessControlUpgradeable
     * @param interfaceId the identifier of the interface
     * @return bool stating whether or not our interface is supported
     */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC1155Upgradeable, AccessControlUpgradeable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    /**
     * @dev See {IERC1155MetadataURI-uri}.
     *
     * This implementation returns the same URI for *all* token types. It relies
     * on the token type ID substitution mechanism
     * https://eips.ethereum.org/EIPS/eip-1155#metadata[defined in the EIP].
     *
     * Clients calling this function must replace the `\{id\}` substring with the
     * actual token type ID.
     */
    function uri(uint256 tokenId)
        public
        view
        virtual
        override
        returns (string memory)
    {
        return
            string(abi.encodePacked(super.uri(tokenId), _idToUriHash[tokenId]));
    }

    /* External Functions */

    /**
     * @notice The contract metadata URI.
     * @return the contract URI hash
     */
    function contractURI() external view returns (string memory) {
        // URI returned from parent just returns base URI
        return string(abi.encodePacked(super.uri(0), _contractURIHash));
    }

    /**
     * @notice It returns information about a Tier for a token ID.
     * @param tokenId ID of the token to get Tier info.
     * @return tierId_ the index of the tier the tokenId belongs to
     * @return tierTokenId_ the tokenId in tier
     */
    function getTokenTierId(uint256 tokenId)
        external
        view
        returns (uint128 tierId_, uint128 tierTokenId_)
    {
        (tierId_, tierTokenId_) = _splitTokenId(tokenId);
    }

    /**
     * @notice It returns Base Loan Size for a token ID.
     * @param tokenId ID of the token to get info.
     */
    function tokenBaseLoanSize(uint256 tokenId) public view returns (uint256) {
        (uint128 tierId, ) = _splitTokenId(tokenId);
        return tiers[tierId].baseLoanSize;
    }

    /**
     * @notice It returns Contribution Asset for a token ID.
     * @param tokenId ID of the token to get info.
     */
    function tokenContributionAsset(uint256 tokenId)
        public
        view
        returns (address)
    {
        (uint128 tierId, ) = _splitTokenId(tokenId);
        return tiers[tierId].contributionAsset;
    }

    /**
     * @notice It returns Contribution Size for a token ID.
     * @param tokenId ID of the token to get info.
     */
    function tokenContributionSize(uint256 tokenId)
        public
        view
        returns (uint256)
    {
        (uint128 tierId, ) = _splitTokenId(tokenId);
        return tiers[tierId].contributionSize;
    }

    /**
     * @notice It returns Contribution Multiplier for a token ID.
     * @param tokenId ID of the token to get info.
     */
    function tokenContributionMultiplier(uint256 tokenId)
        public
        view
        returns (uint16)
    {
        (uint128 tierId, ) = _splitTokenId(tokenId);
        return tiers[tierId].contributionMultiplier;
    }

    /**
     * @notice It returns an array of token IDs owned by an address.
     * @dev It uses a EnumerableSet to store values and loops over each element to add to the array.
     * @dev Can be costly if calling within a contract for address with many tokens.
     * @return owned_ the array of tokenIDs owned by the address
     */
    function getOwnedTokens(address owner)
        external
        view
        returns (uint256[] memory owned_)
    {
        EnumerableSet.UintSet storage set = _ownedTokenIds[owner];
        owned_ = new uint256[](set.length());
        for (uint256 i; i < owned_.length; i++) {
            owned_[i] = set.at(i);
        }
    }

    /**
     * @notice Creates new Tiers to be minted with the given information.
     * @dev It auto increments the index of the next tier to add.
     * @param newTiers Information about the new tiers to add.
     * @param tierHashes Metadata hashes belonging to the tiers.
     *
     * Requirements:
     *  - Caller must have the {ADMIN} role
     */
    function createTiers(
        Tier[] calldata newTiers,
        string[][] calldata tierHashes
    ) external onlyRole(ADMIN) {
        require(
            newTiers.length == tierHashes.length,
            "Teller: array length mismatch"
        );

        for (uint256 i; i < newTiers.length; i++) {
            _createTier(newTiers[i], tierHashes[i]);
        }
    }

    /**
     * @notice creates the tier along with the tier hashes, then saves the tokenId
     * information in id -> hash and hash -> id mappings
     * @param newTier the Tier struct containing all the tier information
     * @param tierHashes the tier hashes to add to the tier
     */
    function _createTier(Tier calldata newTier, string[] calldata tierHashes)
        internal
    {
        // Increment tier counter to use
        tierCount++;
        Tier storage tier = tiers[tierCount];
        tier.baseLoanSize = newTier.baseLoanSize;
        tier.contributionAsset = newTier.contributionAsset;
        tier.contributionSize = newTier.contributionSize;
        tier.contributionMultiplier = newTier.contributionMultiplier;

        // Store how many tokens are on the tier
        tierTokenCount[tierCount] = tierHashes.length;
        // Set the token URI hash
        for (uint128 i; i < tierHashes.length; i++) {
            uint256 tokenId = _mergeTokenId(tierCount, i);
            _idToUriHash[tokenId] = tierHashes[i];
            _uriHashToId[tierHashes[i]] = tokenId;
        }
    }

    /**
     * @dev See {_setURI}.
     *
     * Requirements:
     *
     * - `newURI` must be prepended with a forward slash (/)
     */
    function setURI(string memory newURI) external onlyRole(ADMIN) {
        _setURI(newURI);
    }

    /**
     * @notice Sets the contract level metadata URI hash.
     * @param contractURIHash The hash to the initial contract level metadata.
     */
    function setContractURIHash(string memory contractURIHash)
        public
        onlyRole(ADMIN)
    {
        _contractURIHash = contractURIHash;
    }

    /**
     * @notice Initializes the TellerNFT.
     * @param data Bytes to init the token with.
     */
    function initialize(bytes calldata data) public virtual initializer {
        // Set the initial URI
        __ERC1155_init("https://gateway.pinata.cloud/ipfs/");
        __AccessControl_init();

        // Set admin role for admins
        _setRoleAdmin(ADMIN, ADMIN);
        // Set the initial admin
        _setupRole(ADMIN, _msgSender());

        // Set initial contract URI hash
        setContractURIHash("QmWAfQFFwptzRUCdF2cBFJhcB2gfHJMd7TQt64dZUysk3R");

        __TellerNFT_V2_init_unchained(data);
    }

    function __TellerNFT_V2_init_unchained(bytes calldata data)
        internal
        virtual
        initializer
    {}

    /* Internal Functions */

    /**
     * @notice it removes a token ID from the ownedTokenIds mapping if the balance of
     * the user's tokenId is 0
     * @param account the address to add the token id to
     * @param id the token ID
     */
    function _removeOwnedTokenCheck(address account, uint256 id) private {
        if (balanceOf(account, id) == 0) {
            _ownedTokenIds[account].remove(id);
        }
    }

    /**
     * @notice it adds a token id to the ownedTokenIds mapping
     * @param account the address to the add the token ID to
     * @param id the token ID
     */
    function _addOwnedToken(address account, uint256 id) private {
        _ownedTokenIds[account].add(id);
    }

    /**
     * @dev Runs super function and then increases total supply.
     *
     * See {ERC1155Upgradeable._mint}.
     */
    function _mint(
        address account,
        uint256 id,
        uint256 amount,
        bytes memory data
    ) internal override {
        super._mint(account, id, amount, data);

        // add the id to the owned token ids of the user
        _addOwnedToken(account, id);

        totalSupply += amount;
    }

    /**
     * @dev Runs super function and then increases total supply.
     *
     * See {ERC1155Upgradeable._mintBatch}.
     */
    function _mintBatch(
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) internal override {
        super._mintBatch(to, ids, amounts, data);

        for (uint256 i; i < amounts.length; i++) {
            totalSupply += amounts[i];
            _addOwnedToken(to, ids[i]);
        }
    }

    /**
     * @dev Runs super function and then decreases total supply.
     *
     * See {ERC1155Upgradeable._burn}.
     */
    function _burn(
        address account,
        uint256 id,
        uint256 amount
    ) internal override {
        super._burn(account, id, amount);
        _removeOwnedTokenCheck(account, id);
        totalSupply -= amount;
    }

    /**
     * @dev Runs super function and then decreases total supply.
     *
     * See {ERC1155Upgradeable._burnBatch}.
     */
    function _burnBatch(
        address account,
        uint256[] memory ids,
        uint256[] memory amounts
    ) internal override {
        super._burnBatch(account, ids, amounts);

        for (uint256 i; i < amounts.length; i++) {
            totalSupply -= amounts[i];
            _removeOwnedTokenCheck(account, ids[i]);
        }
    }

    /**
     * @dev Transfers `amount` tokens of token type `id` from `from` to `to`.
     *
     * See {ERC1155Upgradeable._safeTransferFrom}.
     */
    function _safeTransferFrom(
        address from,
        address to,
        uint256 id,
        uint256 amount,
        bytes memory data
    ) internal override {
        super._safeTransferFrom(from, to, id, amount, data);
        _removeOwnedTokenCheck(from, id);
        _addOwnedToken(to, id);
    }

    /**
     * @dev xref:ROOT:erc1155.adoc#batch-operations[Batched] version of {_safeTransferFrom}.
     *  See {ERC1155Upgradeable._safeBatchTransferFrom}
     */
    function _safeBatchTransferFrom(
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) internal override {
        super._safeBatchTransferFrom(from, to, ids, amounts, data);
        for (uint256 i; i < ids.length; i++) {
            _removeOwnedTokenCheck(from, ids[i]);
            _addOwnedToken(to, ids[i]);
        }
    }

    /**
     * @dev Checks if a token ID exists. To exists the ID must have a URI hash associated.
     * @param tokenId ID of the token to check.
     */
    function _exists(uint256 tokenId) internal view returns (bool) {
        return bytes(_idToUriHash[tokenId]).length > 0;
    }

    /**
     * @dev Creates a V2 token ID from a tier ID and tier token ID.
     * @param tierId Index of the tier to use.
     * @param tierTokenId ID of the token within the given tier.
     * @return tokenId_ V2 NFT token ID.
     */
    function _mergeTokenId(uint128 tierId, uint128 tierTokenId)
        internal
        pure
        returns (uint256 tokenId_)
    {
        tokenId_ = tierId * ID_PADDING;
        tokenId_ += tierTokenId;
    }

    /**
     * @dev Creates a V2 token ID from a tier ID and tier token ID.
     * @param tokenId V2 NFT token ID.
     * @return tierId_ Index of the token tier.
     * @return tierTokenId_ ID of the token within the tier.
     */
    function _splitTokenId(uint256 tokenId)
        internal
        pure
        returns (uint128 tierId_, uint128 tierTokenId_)
    {
        tierId_ = SafeCast.toUint128(tokenId / ID_PADDING);
        tierTokenId_ = SafeCast.toUint128(tokenId % ID_PADDING);
    }
}
