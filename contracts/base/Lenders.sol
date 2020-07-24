pragma solidity 0.5.17;
pragma experimental ABIEncoderV2;

// Contracts
import "../base/Base.sol";

// Libraries
import "../util/AddressLib.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";

// Interfaces
import "../interfaces/LendersInterface.sol";
import "../interfaces/ZTokenInterface.sol";
import "../interfaces/InterestConsensusInterface.sol";


/**
    @notice This contract interacts with the LendingPool contract to ensure token balances and interest owed is kept up to date. It tracks the interest for lenders.

    @author develop@teller.finance
 */
contract Lenders is Base, LendersInterface {
    using AddressLib for address;
    using SafeMath for uint256;

    /* State Variables */

    address public lendingPool;
    InterestConsensusInterface public interestConsensus;

    address public zToken;

    // The total interest that has not yet been withdrawn by a lender
    mapping(address => ZeroCollateralCommon.AccruedInterest) public accruedInterest;

    /** Modifiers */

    /**
        @notice It checks sender is the zToken address.
     */
    modifier isZToken() {
        require(_areAddressesEqual(zToken, msg.sender), "SENDER_ISNT_ZTOKEN");
        _;
    }

    /**
        @notice It checks sender is the lending pool address.
     */
    modifier isLendingPool() {
        require(_areAddressesEqual(lendingPool, msg.sender), "SENDER_ISNT_LENDING_POOL");
        _;
    }

    /**
        @notice It checks an address is not empty.
     */
    modifier isValid(address anAddress) {
        anAddress.requireNotEmpty("ADDRESS_IS_REQUIRED");
        _;
    }

    /* Constructor */

    /** External Functions */

    /**
        @notice It initializes this contract instance.
        @param zTokenAddress zToken contract address.
        @param lendingPoolAddress lending pool contract address.
        @param interestConsensusAddress interest consensus contract address.
        @param settingAddress settings contract address.
     */
    function initialize(
        address zTokenAddress,
        address lendingPoolAddress,
        address interestConsensusAddress,
        address settingAddress
    ) external isNotInitialized() {
        zTokenAddress.requireNotEmpty("ZTOKEN_MUST_BE_PROVIDED");
        lendingPoolAddress.requireNotEmpty("LENDING_POOL_MUST_BE_PROVIDED");
        interestConsensusAddress.requireNotEmpty("CONSENSUS_MUST_BE_PROVIDED");

        _initialize(settingAddress);

        zToken = zTokenAddress;
        lendingPool = lendingPoolAddress;
        interestConsensus = InterestConsensusInterface(interestConsensusAddress);
    }

    /**
        @notice It sets the accrued interest for a lender based on the node responses.
        @param request interest request sent by the lender.
        @param responses all node responses to get a consensus value for the accrued interest.
     */
    function setAccruedInterest(
        ZeroCollateralCommon.InterestRequest calldata request,
        ZeroCollateralCommon.InterestResponse[] calldata responses
    ) external isInitialized() whenNotPaused() whenLendingPoolNotPaused(lendingPool) {
        require(
            accruedInterest[request.lender].timeLastAccrued == 0 ||
                accruedInterest[request.lender].timeLastAccrued == request.startTime,
            "GAP_IN_INTEREST_ACCRUAL"
        );
        require(request.endTime > request.startTime, "INVALID_INTERVAL");
        require(request.requestTime >= request.endTime, "INVALID_REQUEST");

        uint256 amount = interestConsensus.processRequest(request, responses);

        accruedInterest[request.lender].totalAccruedInterest = accruedInterest[request
            .lender]
            .totalAccruedInterest
            .add(amount);

        accruedInterest[request.lender].totalNotWithdrawn = accruedInterest[request
            .lender]
            .totalNotWithdrawn
            .add(amount);

        accruedInterest[request.lender].timeLastAccrued = request.endTime;

        emit AccruedInterestUpdated(
            request.lender,
            accruedInterest[request.lender].totalNotWithdrawn,
            accruedInterest[request.lender].totalAccruedInterest
        );
    }

    /**
        @notice It tracks the interest amount for a recipient/lender.
        @param recipient address.
        @param amount to track.
        @return the interest amount to withdraw.
     */
    function withdrawInterest(address recipient, uint256 amount)
        external
        isLendingPool()
        isValid(recipient)
        isInitialized()
        returns (uint256)
    {
        require(amount > 0, "CANNOT_WITHDRAW_ZERO");
        require(
            accruedInterest[recipient].totalNotWithdrawn >= amount,
            "AMOUNT_EXCEEDS_AVAILABLE_AMOUNT"
        );

        accruedInterest[recipient].totalNotWithdrawn = accruedInterest[recipient]
            .totalNotWithdrawn
            .sub(amount);

        emit AccruedInterestWithdrawn(recipient, amount);

        return amount;
    }

    /** Internal Functions */

    /**
        @notice It verifies if both param addresses are equal or not.
        @param leftAddress address to compare.
        @param rightAddress address to compare.
        @return true if both addresses are equal. Otherwise it returns false.
     */
    function _areAddressesEqual(address leftAddress, address rightAddress)
        internal
        view
        returns (bool)
    {
        this; // silence state mutability warning without generating bytecode - see https://github.com/ethereum/solidity/issues/2691
        return leftAddress.isEqualTo(rightAddress);
    }

    /** Private Functions */
}
