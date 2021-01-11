pragma solidity 0.5.17;

// Libraries
import "@openzeppelin/contracts-ethereum-package/contracts/math/SafeMath.sol";
import "../util/ECDSALib.sol";
import "../util/TellerCommon.sol";
import "../util/NumbersList.sol";

// Contracts
import "./OwnerSignersRole.sol";
import "../base/Base.sol";

/*****************************************************************************************************/
/**                                             WARNING                                             **/
/**                              THIS CONTRACT IS AN UPGRADEABLE BASE!                              **/
/**  ---------------------------------------------------------------------------------------------  **/
/**  Do NOT change the order of, PREPEND, or APPEND any storage variables to this or new versions   **/
/**  of this contract as this will cause a ripple affect to the storage slots of all child          **/
/**  contracts that inherit from this contract to be overwritten on the deployed proxy contract!!   **/
/**                                                                                                 **/
/**  Visit https://docs.openzeppelin.com/upgrades/2.6/proxies#upgrading-via-the-proxy-pattern for   **/
/**  more information.                                                                              **/
/*****************************************************************************************************/
/**
    @notice This contract is used as a base for the consensus contracts.
    @dev It contains some common internal functions and variables for the consensus contracts.

    @author develop@teller.finance
 */
contract Consensus is Base, OwnerSignersRole {
    using SafeMath for uint256;
    using NumbersList for NumbersList.Values;
    using NumbersLib for uint256;

    // Has signer address already submitted their answer for (user, identifier)?
    mapping(address => mapping(address => mapping(uint256 => bool))) public hasSubmitted;

    // mapping from signer address, to signerNonce, to boolean.
    // Has the signer already used this nonce?
    mapping(address => mapping(uint256 => bool)) public signerNonceTaken;

    // the address with permissions to submit a request for processing
    address public callerAddress;

    /**
        @notice It tracks each request nonce value that borrower (in LoanTermsConsensus) or lender (in InterestConsensus) used in the loan terms and interest requests.

        @dev The first key represents the address (borrower or lender depending on the consensus contract).
        @dev The second key represents the request nonce value.
        @dev The final value represents whether the nonce value for the given address was used (true) or not (false).
     */
    mapping(address => mapping(uint256 => bool)) public requestNonceTaken;

    /**
        @notice Checks whether sender is equal to the caller address.
        @dev It throws a require error if sender is not equal to caller address.
        @param sender the sender transaction.
     */
    modifier isCaller(address sender) {
        require(_isCaller(sender), "SENDER_HASNT_PERMISSIONS");
        _;
    }

    /**
        @notice Checks if the number of responses is greater or equal to a percentage of
        the number of signers.
     */
    modifier onlyEnoughSubmissions(uint256 responseCount) {
        uint256 percentageRequired =_getSettings()
            .platformSettings(
                _getSettings().consts().REQUIRED_SUBMISSIONS_PERCENTAGE_SETTING()
            )
            .value;


        require(
            responseCount.ratioOf(_signerCount) >= percentageRequired,
            "INSUFFICIENT_NUMBER_OF_RESPONSES"
        );
        _;
    }

    /**
        @notice It initializes this consensus contract.
        @dev The caller address must be the loans contract for LoanTermsConsensus, and the lenders contract for InterestConsensus.
        @param owner the owner address.
        @param aCallerAddress the contract that will call it.
        @param aSettingAddress the settings contract address.
     */
    function initialize(
        address owner,
        address aCallerAddress,
        address aSettingAddress
    ) external isNotInitialized() {
        require(aCallerAddress.isContract(), "CALLER_MUST_BE_CONTRACT");

        Ownable.initialize(owner);
        _initialize(aSettingAddress);

        callerAddress = aCallerAddress;
    }

    /**
        @notice It validates whether a signature is valid or not, verifying the signer and nonce.
        @param signature signature to validate.
        @param dataHash used to recover the signer.
        @param expectedSigner the expected signer address.
        @return true if the expected signer is equal to the signer. Otherwise it returns false.
     */
    function _signatureValid(
        TellerCommon.Signature memory signature,
        bytes32 dataHash,
        address expectedSigner
    ) internal view returns (bool) {
        if (!isSigner(expectedSigner)) return false;

        require(
            !signerNonceTaken[expectedSigner][signature.signerNonce],
            "SIGNER_NONCE_TAKEN"
        );

        address signer = ECDSA.recover(
            keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", dataHash)),
            signature.v,
            signature.r,
            signature.s
        );
        return (signer == expectedSigner);
    }

    /**
        @notice Gets the consensus value for a list of values (uint values).
        @notice The values must be in a maximum tolerance range.
        @return the consensus value.
     */
    function _getConsensus(NumbersList.Values storage values)
        internal
        view
        returns (uint256)
    {
        require(
            values.isWithinTolerance(
                _getSettings().getPlatformSettingValue(
                    _getSettings().consts().MAXIMUM_TOLERANCE_SETTING()
                )
            ),
            "RESPONSES_TOO_VARIED"
        );

        return values.getAverage();
    }

    /**
        @notice It validates a response
        @param signer signer address.
        @param user the user address.
        @param requestIdentifier identifier for the request.
        @param responseTime time (in seconds) for the response.
        @param responseHash a hash value that represents the response.
        @param signature the signature for the response.
     */
    function _validateResponse(
        address signer,
        address user,
        uint256 requestIdentifier,
        uint256 responseTime,
        bytes32 responseHash,
        TellerCommon.Signature memory signature
    ) internal {
        require(
            !hasSubmitted[signer][user][requestIdentifier],
            "SIGNER_ALREADY_SUBMITTED"
        );
        hasSubmitted[signer][user][requestIdentifier] = true;

        require(
            responseTime >=
                now.sub(
                    _getSettings().getPlatformSettingValue(
                        _getSettings().consts().RESPONSE_EXPIRY_LENGTH_SETTING()
                    )
                ),
            "RESPONSE_EXPIRED"
        );

        require(_signatureValid(signature, responseHash, signer), "SIGNATURE_INVALID");
        signerNonceTaken[signer][signature.signerNonce] = true;
    }

    /**
        @notice Gets the current chain id using the opcode 'chainid()'.
        @return the current chain id.
     */
    function _getChainId() internal view returns (uint256) {
        this; // silence state mutability warning without generating bytecode - see https://github.com/ethereum/solidity/issues/2691
        uint256 id;
        assembly {
            id := chainid()
        }
        return id;
    }

    /**
        @notice It tests whether an given address is the initialized caller address.
        @dev This function is overriden by mock instances.
     */
    function _isCaller(address sender) internal view returns (bool) {
        return callerAddress == sender;
    }
}
