pragma solidity 0.5.17;

// Libraries
import "@openzeppelin/contracts-ethereum-package/contracts/math/SafeMath.sol";
import "../util/TellerCommon.sol";
import "../util/NumbersList.sol";
import "../util/SettingsConsts.sol";

// Contracts
import "./OwnerSignersRole.sol";
import "../base/Base.sol";


/**
    @notice This contract is used as a base for the consensus contracts.
    @dev It contains some common internal functions and variables for the consensus contracts.

    @author develop@teller.finance
 */
contract Consensus is Base, OwnerSignersRole, SettingsConsts {
    using SafeMath for uint256;
    using NumbersList for NumbersList.Values;

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
     */
    modifier isCaller() {
        require(callerAddress == msg.sender, "SENDER_HASNT_PERMISSIONS");
        _;
    }

    /**
        @notice It initializes this contract setting the parameters.
        @param aCallerAddress the contract that will call it.
        @param aSettingAddress the settings contract address.
        @param aMarketsAddress the markets state address.
     */
    function initialize(
        address aCallerAddress, // loans for LoanTermsConsensus, lenders for InterestConsensus
        address aSettingAddress,
        address aMarketsAddress
    ) public isNotInitialized() {
        aCallerAddress.requireNotEmpty("MUST_PROVIDE_LENDER_INFO");

        _initialize(aSettingAddress, aMarketsAddress);

        callerAddress = aCallerAddress;
    }

    /**
        @notice It validates whether a signature is valid or not, verifying the signer and nonce.
        @param signature signature to validate.
        @param dataHash to use to recover the signer.
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

        address signer = ecrecover(
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
                settings.getPlatformSettingValue(MAXIMUM_TOLERANCE_SETTING)
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
                now.sub(settings.getPlatformSettingValue(RESPONSE_EXPIRY_LENGTH_SETTING)),
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
}
