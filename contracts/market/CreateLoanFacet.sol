// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Contracts
import { PausableMods } from "../settings/pausable/PausableMods.sol";
import {
    ReentryMods
} from "../contexts2/access-control/reentry/ReentryMods.sol";
import { RolesMods } from "../contexts2/access-control/roles/RolesMods.sol";
import { AUTHORIZED, ADMIN } from "../shared/roles.sol";
import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

// Libraries
import { LibLoans } from "./libraries/LibLoans.sol";
import { LibEscrow } from "../escrow/libraries/LibEscrow.sol";
import { LibCollateral } from "./libraries/LibCollateral.sol";
import { MarketLib } from "./cra/MarketLib.sol";
import { LendingLib } from "../lending/libraries/LendingLib.sol";
import {
    PlatformSettingsLib
} from "../settings/platform/libraries/PlatformSettingsLib.sol";
import {
    MaxDebtRatioLib
} from "../settings/asset/libraries/MaxDebtRatioLib.sol";
import {
    MaxLoanAmountLib
} from "../settings/asset/libraries/MaxLoanAmountLib.sol";
import { Counters } from "@openzeppelin/contracts/utils/Counters.sol";
import {
    EnumerableSet
} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import { NumbersLib } from "../shared/libraries/NumbersLib.sol";
import { NFTLib } from "../nft/libraries/NFTLib.sol";
import { Verifier } from "./cra/verifier.sol";
import { ECDSA } from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import { MarketLib } from "./cra/MarketLib.sol";

// Interfaces
import { ILoansEscrow } from "../escrow/escrow/ILoansEscrow.sol";
import { ITToken } from "../lending/ttoken/ITToken.sol";

// Proxy
import {
    BeaconProxy
} from "@openzeppelin/contracts/proxy/beacon/BeaconProxy.sol";
import { Clones } from "@openzeppelin/contracts/proxy/Clones.sol";

// Storage
import {
    LoanRequest,
    LoanStatus,
    LoanTerms,
    Loan,
    MarketStorageLib,
    Signature,
    SignatureData
} from "../storage/market.sol";
import { AppStorageLib } from "../storage/app.sol";

// hardhat helpers
import "hardhat/console.sol";

contract CreateLoanFacet is RolesMods, ReentryMods, PausableMods {
    /**
     * @notice This event is emitted when a loan has been successfully taken out
     * @param loanID ID of loan from which collateral was withdrawn
     * @param borrower Account address of the borrower
     * @param amountBorrowed Total amount taken out in the loan
     * @param withNFT Boolean indicating if the loan was taken out using NFTs
     */
    event LoanTakenOut(
        uint256 indexed loanID,
        address indexed borrower,
        uint256 amountBorrowed,
        bool withNFT
    );

    /**
     * @notice Creates the loan from requests and validator responses then calling the main function.
     * @param request Struct of the protocol loan request
     */
    modifier __createLoan(LoanRequest calldata request, bool withNFT) {
        console.log("creating loan");
        Loan storage loan = CreateLoanLib.createLoan(request, withNFT);

        _;

        loan.status = LoanStatus.Active;
        loan.loanStartTime = uint32(block.timestamp);
        loan.duration = request.request.duration;
    }

    // used for testing our zkcra function
    function initializeMarketAdmins() external authorized(ADMIN, msg.sender) {
        // setting market admin
        MarketLib.m(bytes32(0)).admin[msg.sender] = true;
        // setting providers admin
        MarketLib.p(bytes32(0)).admin[msg.sender] = true;
        MarketLib.p(bytes32(uint256(1))).admin[msg.sender] = true;
        MarketLib.p(bytes32(uint256(2))).admin[msg.sender] = true;
    }

    function setProviderInformation(
        bytes32 providerId,
        uint32 maxAge,
        address signer,
        bool signerValue
    ) external {
        console.log("solidity: about to set provider signer");
        MarketLib.setProviderSigner(providerId, signer, signerValue);
        console.log("solidity: about to set provider max age");
        MarketLib.setProviderMaxAge(providerId, maxAge);
    }

    /**
     * @notice Creates a loan with the loan request and NFTs without any collateral
     * @param request Struct of the protocol loan request
     * @param nftIDs IDs of TellerNFTs to use for the loan
     */
    function takeOutLoanWithNFTs(
        LoanRequest calldata request,
        uint16[] calldata nftIDs
    ) external paused(LibLoans.ID, false) __createLoan(request, true) {
        // Get the ID of the newly created loan
        uint256 loanID = CreateLoanLib.currentID() - 1;
        uint256 amount = LibLoans.loan(loanID).borrowedAmount;
        uint8 lendingDecimals = ERC20(request.request.assetAddress).decimals();

        uint256 allowedBaseLoanSize;
        for (uint256 i; i < nftIDs.length; i++) {
            NFTLib.applyToLoan(loanID, nftIDs[i]);

            allowedBaseLoanSize += NFTLib.s().nftDictionary.tokenBaseLoanSize(
                nftIDs[i]
            );
        }
        require(
            amount <= allowedLoanSize,
            "Teller: insufficient NFT loan size"
        );

        // Pull funds from Teller Token LP and transfer to the new loan escrow
        LendingLib.tToken(LibLoans.loan(loanID).lendingToken).fundLoan(
            CreateLoanLib.createEscrow(loanID),
            amount
        );

        emit LoanTakenOut(
            loanID,
            msg.sender,
            LibLoans.loan(loanID).borrowedAmount,
            true
        );
    }

    /**
     * @notice Take out a loan
     *
     * @dev collateral ratio is a percentage of the loan amount that's required in collateral
     * @dev the percentage will be *(10**2). I.e. collateralRatio of 5244 means 52.44% collateral
     * @dev is required in the loan. Interest rate is also a percentage with 2 decimal points.
     *
     * @param request Struct of the protocol loan request
     * @param collateralToken Token address to use as collateral for the new loan
     * @param collateralAmount Amount of collateral required for the loan
     */
    function takeOutLoan(
        LoanRequest calldata request,
        address collateralToken,
        uint256 collateralAmount
    )
        external
        payable
        paused(LibLoans.ID, false)
        nonReentry("")
        authorized(AUTHORIZED, msg.sender)
        __createLoan(request, false)
    {
        console.log("taking out loan");
        // Check if collateral token is zero
        require(
            collateralToken != address(0x0),
            "Teller: token addr can't be 0"
        );

        // Verify collateral token is acceptable
        require(
            EnumerableSet.contains(
                MarketStorageLib.store().collateralTokens[
                    request.request.assetAddress
                ],
                collateralToken
            ),
            "Teller: collateral token not allowed"
        );

        // Get the ID of the newly created loan
        Loan storage loan = LibLoans.loan(CreateLoanLib.currentID() - 1);

        // Save collateral token to loan
        loan.collateralToken = collateralToken;

        // Pay in collateral
        if (collateralAmount > 0) {
            LibCollateral.deposit(loan.id, collateralToken, collateralAmount);
        }

        // Check that enough collateral has been provided for this loan
        require(
            LibLoans.getCollateralNeeded(loan.id) <=
                LibCollateral.e(loan.id).loanSupply(loan.id),
            "Teller: more collateral required"
        );
        // Pull funds from Teller token LP and and transfer to the recipient
        ITToken tToken = LendingLib.tToken(request.request.assetAddress);

        tToken.fundLoan(
            LibLoans.canGoToEOAWithCollateralRatio(loan.collateralRatio)
                ? loan.borrower
                : CreateLoanLib.createEscrow(loan.id),
            loan.borrowedAmount
        );

        emit LoanTakenOut(loan.id, msg.sender, loan.borrowedAmount, false);
    }
}

library CreateLoanLib {
    function createLoan(LoanRequest calldata request, bool withNFT)
        internal
        returns (Loan storage loan)
    {
        // Perform loan request checks
        require(
            PlatformSettingsLib.getMaximumLoanDurationValue() >= duration,
            "Teller: max loan duration exceeded"
        );

        // Get consensus values from request
        (uint16 interestRate, uint16 collateralRatio, uint256 maxLoanAmount) =
            processMarketRequest(request);

        // Perform loan value checks
        require(
            MaxLoanAmountLib.get(request.request.assetAddress) > maxLoanAmount,
            "Teller: asset max loan amount exceeded"
        );
        require(
            LendingLib.tToken(request.request.assetAddress).debtRatioFor(
                maxLoanAmount
            ) <= MaxDebtRatioLib.get(request.request.assetAddress),
            "Teller: max supply-to-debt ratio exceeded"
        );

        // Get and increment new loan ID
        uint256 loanID = CreateLoanLib.newID();

        // Set loan data based on terms
        loan = LibLoans.loan(loanID);
        loan.id = uint128(loanID);
        loan.status = LoanStatus.TermsSet;
        loan.lendingToken = request.request.assetAddress;
        loan.borrower = request.request.borrower;
        loan.borrowedAmount = maxLoanAmount;
        if (withNFT) {
            loan.interestRate = PlatformSettingsLib.getNFTInterestRate();
        } else {
            loan.interestRate = interestRate;
            loan.collateralRatio = collateralRatio;
        }

        // Set loan debt
        LibLoans.debt(loanID).principalOwed = maxLoanAmount;
        LibLoans.debt(loanID).interestOwed = LibLoans.getInterestOwedFor(
            uint256(loanID),
            maxLoanAmount
        );

        // Add loanID to borrower list
        MarketStorageLib.store().borrowerLoans[loan.borrower].push(
            uint128(loanID)
        );
    }

    /**
     * @notice it uses our request to verify the returned proof and witness with each other,
     * verifies our signature data with our respective data providers, then retrieves our interest rate,
     * collateral ratio and max loan amount
     * @param request contains all the needed data to do the above
     * @return interestRate the rate of the loan
     * @return collateralRatio the collateral ratio required for the loan, if any
     * @return maxLoanAmount the max loan amount the user is entitled to
     */
    function processMarketRequest(LoanRequest memory request)
        internal
        returns (
            uint16 interestRate,
            uint16 collateralRatio,
            uint256 maxLoanAmount
        )
    {
        console.log("processing market request");
        // Overwrite the first snark witness item with the on-chain identifier
        // for the loan (msg.sender ^ nonce). This forces the CRA to have been
        // run with the proper identifier.
        request.witness[0] =
            uint256(uint160(msg.sender)) ^
            LibLoans.s().borrowerLoans[msg.sender].length;

        // Verify the snark proof.
        // call from deployed contract
        // SnarkVerifier sv = new SnarkVerifier(contract address)

        // deploy verifier library and integrate into create loan facet
        console.log("about to verify tx");
        require(
            Verifier.verifyTx(request.proof, request.witness),
            "Proof not verified"
        );

        bytes32[3] memory commitments = [bytes32(0), bytes32(0), bytes32(0)];

        // constructing our commitments to verify with our signature data
        for (uint8 i = 0; i < 3; i++) {
            for (uint8 j = 0; j < 8; j++) {
                commitments[i] =
                    (commitments[i] << 32) ^
                    bytes32(request.witness[2 + i * 8 + j]);
            }
            commitments[i] ^= bytes32(request.signatureData[i].signedAt);
        }

        // Verify that the commitment signatures are valid and that the data
        // is not too old for the market's liking.
        _verifySignatures(commitments, request.signatureData);

        // The second witness item (after identifier) is the market
        // score
        uint256 marketScore = uint256(request.witness[1]);

        // Let the market handle the loan request and disperse the loan.

        // create default teller market handler
        // pass it the marketId and return max loan amount, collateral ratio, interest rate
        // upper and lower bound for loan amount, interest rate and collateral ratio depending on
        // market id
        (interestRate, collateralRatio, maxLoanAmount) = MarketLib.handler(
            marketScore,
            request
        );
        return (interestRate, collateralRatio, maxLoanAmount);
    }

    function _verifySignatures(
        bytes32[3] memory commitments,
        SignatureData[3] memory signatureData
    ) private {
        for (uint256 i = 0; i < 3; i++) {
            bytes32 providerId = bytes32(i);
            require(
                signatureData[i].signedAt >
                    // solhint-disable-next-line
                    block.timestamp - MarketLib.p(providerId).maxAge,
                "Signed at less than max age"
            );
            require(
                MarketLib.s().usedCommitments[commitments[i]] == false,
                "Teller: commitment already used"
            );

            MarketLib.s().usedCommitments[commitments[i]] = true;

            _validateSignature(
                signatureData[i].signature,
                commitments[i],
                providerId
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
        address recoveredSigner =
            ECDSA.recover(
                keccak256(
                    abi.encodePacked(
                        "\x19Ethereum Signed Message:\n32",
                        uint256(commitment)
                    )
                ),
                signature.v,
                signature.r,
                signature.s
            );
        require(
            MarketLib.p(providerId).signer[recoveredSigner],
            "Teller: not valid signature"
        );
    }

    /**
     * @notice increments the loanIDCounter
     * @return id_ the new ID requested, which stores it in the loan data
     */
    function newID() internal returns (uint256 id_) {
        Counters.Counter storage counter = MarketStorageLib.store()
            .loanIDCounter;
        id_ = Counters.current(counter);
        Counters.increment(counter);
    }

    function currentID() internal view returns (uint256 id_) {
        Counters.Counter storage counter = MarketStorageLib.store()
            .loanIDCounter;
        id_ = Counters.current(counter);
    }

    function createEscrow(uint256 loanID) internal returns (address escrow_) {
        // Create escrow
        escrow_ = AppStorageLib.store().loansEscrowBeacon.cloneProxy("");
        ILoansEscrow(escrow_).init();
        // Save escrow address for loan
        MarketStorageLib.store().loanEscrows[loanID] = ILoansEscrow(escrow_);
    }
}
