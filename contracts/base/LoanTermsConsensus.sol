pragma solidity 0.5.17;
pragma experimental ABIEncoderV2;

// Contracts
import "./OwnerSignersRole.sol";

// Interfaces
import "../interfaces/LoanTermsConsensusInterface.sol";

// Libraries
import "@openzeppelin/contracts-ethereum-package/contracts/math/SafeMath.sol";
import "../util/ECDSALib.sol";
import "../util/NumbersList.sol";

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
    @notice This contract is used to process the loan requests through the Teller protocol

    @author develop@teller.finance
 */
contract LoanTermsConsensus is LoanTermsConsensusInterface, OwnerSignersRole {
    using SafeMath for uint256;
    using NumbersList for NumbersList.Values;
    using NumbersLib for uint256;

    /** Address of the loanManager */
    address public loanManagerAddress;

    /* Mappings */
    /**
        This mapping identify the last request timestamp for a given borrower address.

            Example:    address(0x123...789) = timestamp(now)

        It is used as rate limit per borrower address.
     */
    mapping(address => uint256) public borrowerRequestTimes;

    /**
        @notice It tracks each request nonce value used by the borrower.
     */
    mapping(address => uint256) public borrowerNonces;

    /**
        @notice Checks whether sender is equal to the loanManager address.
        @dev It throws a require error if sender is not equal to the loanManager address.
        @param sender the transaction sender.
     */
    modifier isLoanManager(address sender) {
        require(_isLoanManager(sender), "SENDER_HASNT_PERMISSIONS");
        _;
    }

    /**
        @notice Checks if the number of responses is greater or equal to a percentage of
        the number of signers.
     */
    modifier onlyEnoughSubmissions(uint256 responseCount) {
        uint256 percentageRequired =
            settings.getRequiredSubmissionsPercentageValue();

        require(
            responseCount.ratioOf(_signerCount) >= percentageRequired,
            "INSUFFICIENT_NUMBER_OF_RESPONSES"
        );
        _;
    }

    /**
        @notice It initializes this consensus contract.
        @param owner the owner address.
        @param aLoanManagerAddress the contract that will call it.
        @param aSettingAddress the settings contract address.
     */
    function initialize(
        address owner,
        address aLoanManagerAddress,
        address aSettingAddress
    ) external {
        require(
            aLoanManagerAddress.isContract(),
            "LOAN_MANAGER_MUST_BE_CONTRACT"
        );

        OwnerSignersRole._initialize(owner);
        Base._initialize(aSettingAddress);

        loanManagerAddress = aLoanManagerAddress;
    }

    /**
        @notice Processes the loan request
        @param request Struct of the protocol loan request
        @param responses List of structs of the protocol loan responses
        @return uint256 Interest rate
        @return uint256 Collateral ratio
        @return uint256 Maximum loan amount
     */
    function processRequest(
        TellerCommon.LoanRequest calldata request,
        TellerCommon.LoanResponse[] calldata responses
    )
        external
        isLoanManager(msg.sender)
        onlyEnoughSubmissions(responses.length)
        returns (
            uint256 interestRate,
            uint256 collateralRatio,
            uint256 maxLoanAmount
        )
    {
        address borrower = request.borrower;

        require(
            borrowerNonces[borrower] == request.requestNonce,
            "WRONG_BORROWER_NONCE"
        );
        require(
            borrowerRequestTimes[borrower] == 0 ||
                borrowerRequestTimes[borrower].add(
                    settings.getRequestLoanTermsRateLimitValue()
                ) <=
                now,
            "REQS_LOAN_TERMS_LMT_EXCEEDS_MAX"
        );

        borrowerRequestTimes[borrower] = now;
        borrowerNonces[borrower]++;

        TellerCommon.AccruedLoanTerms memory termSubmissions;
        bytes32 requestHash = _hashRequest(request);
        uint256 responseExpiryLengthValue =
            settings.getResponseExpiryLengthValue();

        for (uint256 i = 0; i < responses.length; i++) {
            TellerCommon.LoanResponse memory response = responses[i];
            bytes32 responseHash = _hashResponse(response, requestHash);

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
        @notice Generates a hash for the loan response
        @param response Structs of the protocol loan responses
        @param requestHash Hash of the loan request
        @return bytes32 Hash of the loan response
     */
    function _hashResponse(
        TellerCommon.LoanResponse memory response,
        bytes32 requestHash
    ) internal view returns (bytes32) {
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
        @notice Generates a hash for the loan request
        @param request Struct of the protocol loan request
        @return bytes32 Hash of the loan request
     */
    function _hashRequest(TellerCommon.LoanRequest memory request)
        internal
        view
        returns (bytes32)
    {
        return
            keccak256(
                abi.encode(
                    loanManagerAddress,
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
        @notice It validates whether a signature is valid or not.
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

        address signer =
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
        return (signer == expectedSigner);
    }

    /**
        @notice Gets the consensus value for a list of values (uint values).
        @notice The values must be in a maximum tolerance range.
        @return the consensus value.
     */
    function _getConsensus(NumbersList.Values memory values, uint256 tolerance)
        internal
        view
        returns (uint256)
    {
        require(values.isWithinTolerance(tolerance), "RESPONSES_TOO_VARIED");

        return values.getAverage();
    }

    /**
        @notice Gets the current chain id using the opcode 'chainid()'.
        @return the current chain id.
     */
    function _getChainId() internal view returns (uint256) {
        // silence state mutability warning without generating bytecode.
        // see https://github.com/ethereum/solidity/issues/2691
        this;
        uint256 id;
        assembly {
            id := chainid()
        }
        return id;
    }

    /**
        @notice It tests whether a given address is the initialized loanManager address.
        @dev This function is overriden by mock instances.
     */
    function _isLoanManager(address sender) internal view returns (bool) {
        return loanManagerAddress == sender;
    }
}
