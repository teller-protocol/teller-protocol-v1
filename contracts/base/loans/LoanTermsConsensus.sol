pragma solidity 0.5.17;
pragma experimental ABIEncoderV2;

// Libraries
import "@openzeppelin/contracts-ethereum-package/contracts/math/SafeMath.sol";
import "../../util/ECDSALib.sol";

// Interfaces
import "../../interfaces/loans/ILoanData.sol";
import "../../interfaces/loans/ILoanTermsConsensus.sol";
import "../../interfaces/SettingsInterface.sol";
import "../../interfaces/escrow/IEscrow.sol";
import "../../interfaces/loans/ILoanManager.sol";
import "../../providers/openzeppelin/SignedSafeMath.sol";

// Contracts
import "../Base.sol";
import "../BaseStorage.sol";
import "./LoanStorage.sol";

/*****************************************************************************************************/
/**                                             WARNING                                             **/
/**                              THIS CONTRACT IS AN UPGRADEABLE FACET!                             **/
/**  ---------------------------------------------------------------------------------------------  **/
/**  Do NOT place ANY storage/state variables directly in this contract! If you wish to make        **/
/**  make changes to the state variables used by this contract, do so in its defined Storage        **/
/**  contract that this contract inherits from                                                      **/
/**                                                                                                 **/
/**  Visit https://docs.openzeppelin.com/upgrades/2.6/proxies#upgrading-via-the-proxy-pattern for   **/
/**  more information.                                                                              **/
/*****************************************************************************************************/
/**
 * @notice This contract stores the logic for validating consensus on loan terms.
 * @dev The LoanManager delegatecall's to this, like a Diamond.
 *
 * @author develop@teller.finance.
 */
contract LoanTermsConsensus is ILoanTermsConsensus, LoanStorage {
    using SafeMath for uint256;
    using NumbersList for NumbersList.Values;
    using NumbersLib for uint256;
    using Address for address;
    using AddressArrayLib for AddressArrayLib.AddressArray;

    /* Modifiers */

    /**
     * @notice Checks if sender has a pauser role
     * @dev Throws an error if the sender has not a pauser role.
     */
    modifier onlyPauser() {
        settings.requirePauserRole(msg.sender);
        _;
    }

    /**
     * @notice Checks if the number of responses is greater or equal to a percentage of
        the number of signers.
     */
    modifier onlyEnoughSubmissions(uint256 responseCount) {
        uint256 percentageRequired =
            settings.getRequiredSubmissionsPercentageValue();

        require(
            responseCount.ratioOf(signers.array.length) >= percentageRequired,
            "INSUFFICIENT_NUMBER_OF_RESPONSES"
        );
        _;
    }

    /**
     * @notice Processes the loan request
     * @param request Struct of the protocol loan request
     * @param responses List of structs of the protocol loan responses
     * @return uint256 Interest rate
     * @return uint256 Collateral ratio
     * @return uint256 Maximum loan amount
     */
    function processLoanTerms(
        TellerCommon.LoanRequest calldata request,
        TellerCommon.LoanResponse[] calldata responses
    )
        external
        view
        onlyEnoughSubmissions(responses.length)
        returns (
            uint256 interestRate,
            uint256 collateralRatio,
            uint256 maxLoanAmount
        )
    {
        // NOTE: nonReentrant doesn't work across facets unless we use
        // diamond storage.
        // WE CANNOT MAKE NON-STATIC EXTERNAL CALLS OR THE BORROWER
        // COULD MANIPULATE THE NONCE
        address borrower = request.borrower;

        _validateLoanRequest(borrower, request.requestNonce);

        require(
            request.consensusAddress == address(this),
            "BAD_CONSENSUS_ADDRESS"
        );

        bytes32 requestHash = _hashRequest(request);

        uint256 responseExpiryLengthValue =
            settings.getResponseExpiryLengthValue();

        TellerCommon.AccruedLoanTerms memory termSubmissions;

        for (uint256 i = 0; i < responses.length; i++) {
            TellerCommon.LoanResponse memory response = responses[i];

            require(_isSigner(response.signer), "NOT_SIGNER");

            require(
                response.consensusAddress == request.consensusAddress,
                "CONSENSUS_ADDRESS_MISMATCH"
            );

            /**
                Check if we've encountered this signer for this request already.
                Not the cleanest solution to a dictionary lookup problem, but
                that doesn't exist in EVM memory and this is relatively cheap
                for a rather large number of signers.
                Rough gas cost: (n/2) * (1 + n) * MLOAD + n * MSTORE.
             */
            for (uint8 j = 0; j < i; j++) {
                require(
                    response.signer != responses[j].signer,
                    "SIGNER_ALREADY_SUBMITTED"
                );
            }

            require(
                response.responseTime >= now.sub(responseExpiryLengthValue),
                "RESPONSE_EXPIRED"
            );

            bytes32 responseHash = _hashResponse(response, requestHash);

            require(
                _signatureValid(
                    response.signature,
                    responseHash,
                    response.signer
                ),
                "SIGNATURE_INVALID"
            );

            termSubmissions.interestRate.addValue(response.interestRate);
            termSubmissions.collateralRatio.addValue(response.collateralRatio);
            termSubmissions.maxLoanAmount.addValue(response.maxLoanAmount);
        }

        uint256 tolerance = settings.getMaximumToleranceValue();
        interestRate = _getConsensus(termSubmissions.interestRate, tolerance);
        collateralRatio = _getConsensus(
            termSubmissions.collateralRatio,
            tolerance
        );
        maxLoanAmount = _getConsensus(termSubmissions.maxLoanAmount, tolerance);
    }

    /**
     * @notice It adds a new account as a signer.
     * @param account address to add.
     * @dev The sender must be the owner.
     * @dev It throws a require error if the sender is not the owner.
     */
    function addSigner(address account) external onlyPauser {
        _addSigner(account);
    }

    /**
     * @notice It adds a list of account as signers.
     * @param accounts addresses to add.
     * @dev The sender must be the owner.
     * @dev It throws a require error if the sender is not the owner.
     */
    function addSigners(address[] calldata accounts) external onlyPauser {
        for (uint256 index = 0; index < accounts.length; index++) {
            address account = accounts[index];
            _addSigner(account);
        }
    }

    /**
     * @notice It removes an account as a signer.
     * @param account address to remove.
     * @dev The sender must be the owner.
     */
    function removeSigner(address account) external onlyPauser {
        _removeSigner(account);
    }

    /**
     * @notice Generates a hash for the loan response
     * @param response Structs of the protocol loan responses
     * @param requestHash Hash of the loan request
     * @return bytes32 Hash of the loan response
     */
    function _hashResponse(
        TellerCommon.LoanResponse memory response,
        bytes32 requestHash
    ) internal pure returns (bytes32) {
        return
            keccak256(
                abi.encode(
                    response.consensusAddress,
                    response.responseTime,
                    response.interestRate,
                    response.collateralRatio,
                    response.maxLoanAmount,
                    _getChainId(),
                    requestHash
                )
            );
    }

    /**
     * @notice Generates a hash for the loan request
     * @param request Struct of the protocol loan request
     * @return bytes32 Hash of the loan request
     */
    function _hashRequest(TellerCommon.LoanRequest memory request)
        internal
        pure
        returns (bytes32)
    {
        return
            keccak256(
                abi.encode(
                    request.borrower,
                    request.recipient,
                    request.consensusAddress,
                    request.requestNonce,
                    request.amount,
                    request.duration,
                    request.requestTime,
                    _getChainId()
                )
            );
    }

    /**
     * @notice It validates whether a signature is valid or not.
     * @param signature signature to validate.
     * @param dataHash used to recover the signer.
     * @param expectedSigner the expected signer address.
     * @return true if the expected signer is equal to the signer. Otherwise it returns false.
     */
    function _signatureValid(
        TellerCommon.Signature memory signature,
        bytes32 dataHash,
        address expectedSigner
    ) internal pure returns (bool) {
        return
            expectedSigner ==
            ECDSA.recover(
                keccak256(
                    abi.encodePacked(
                        "\x19Ethereum Signed Message:\n32",
                        dataHash
                    )
                ),
                signature.v,
                signature.r,
                signature.s
            );
    }

    /**
        Checks if the nonce provided in the request is equal to the borrower's number of loans.
        Also verifies if the borrower has taken out a loan recently (rate limit).
     * @param borrower the borrower's address.
     * @param nonce the nonce included in the loan request.
     */
    function _validateLoanRequest(address borrower, uint256 nonce)
        internal
        view
    {
        uint256[] storage _borrowerLoans = borrowerLoans[borrower];
        uint256 numberOfLoans = _borrowerLoans.length;

        require(nonce == numberOfLoans, "BAD_NONCE");

        // In case it is the first time that borrower requests loan terms, we don't
        // validate the rate limit.
        if (numberOfLoans == 0) {
            return;
        }

        require(
            loans[_borrowerLoans[numberOfLoans - 1]].loanStartTime.add(
                settings.getRequestLoanTermsRateLimitValue()
            ) <= now,
            "REQS_LOAN_TERMS_LMT_EXCEEDS_MAX"
        );
    }

    function _isSigner(address account) internal view returns (bool isSigner_) {
        (isSigner_, ) = signers.getIndex(account);
    }

    /**
     * @notice Gets the consensus value for a list of values (uint values).
     * @notice The values must be in a maximum tolerance range.
     * @return the consensus value.
     */
    function _getConsensus(NumbersList.Values memory values, uint256 tolerance)
        internal
        pure
        returns (uint256)
    {
        require(values.isWithinTolerance(tolerance), "RESPONSES_TOO_VARIED");

        return values.getAverage();
    }

    /**
     * @notice Gets the current chain id using the opcode 'chainid()'.
     * @return the current chain id.
     */
    function _getChainId() internal pure returns (uint256) {
        // silence state mutability warning without generating bytecode.
        // see https://github.com/ethereum/solidity/issues/2691
        uint256 id;
        assembly {
            id := chainid()
        }
        return id;
    }

    function _addSigner(address account) internal {
        if (!_isSigner(account)) {
            signers.add(account);
        }
    }

    function _removeSigner(address account) internal {
        signers.remove(account);
    }
}
