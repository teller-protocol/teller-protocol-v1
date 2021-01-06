pragma solidity 0.5.17;
pragma experimental ABIEncoderV2;

// Contracts
import "../base/Base.sol";

// Libraries
import "../util/AddressLib.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/math/SafeMath.sol";

// Interfaces
import "../interfaces/ILenders.sol";
import "../interfaces/IInterestConsensus.sol";

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
    @notice This contract interacts with the LendingPool contract to ensure token balances and interest owed is kept up to date. It tracks the interest for lenders.

    @author develop@teller.finance
 */
contract Lenders is Base, ILenders {
    using AddressLib for address;
    using SafeMath for uint256;

    /* State Variables */

    address public lendingPool;
    IInterestConsensus public interestConsensus;

    address public tToken;

    // The total interest that has not yet been withdrawn by a lender
    mapping(address => TellerCommon.AccruedInterest) public accruedInterest;

    /** Modifiers */

    /**
        @notice It checks sender is the tToken address.
     */
    modifier isTToken() {
        require(_areAddressesEqual(tToken, msg.sender), "SENDER_ISNT_TTOKEN");
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
        @notice It sets the accrued interest for a lender based on the node responses.
        @param request interest request sent by the lender.
        @param responses all node responses to get a consensus value for the accrued interest.
     */
    function setAccruedInterest(
        TellerCommon.InterestRequest calldata request,
        TellerCommon.InterestResponse[] calldata responses
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

    /**
        @notice It initializes this contract instance.
        @param tTokenAddress tToken contract address.
        @param lendingPoolAddress lending pool contract address.
        @param interestConsensusAddress interest consensus contract address.
        @param settingAddress settings contract address.
     */
    function initialize(
        address tTokenAddress,
        address lendingPoolAddress,
        address interestConsensusAddress,
        address settingAddress
    ) external isNotInitialized() {
        tTokenAddress.requireNotEmpty("TTOKEN_MUST_BE_PROVIDED");
        lendingPoolAddress.requireNotEmpty("LENDING_POOL_MUST_BE_PROVIDED");
        interestConsensusAddress.requireNotEmpty("CONSENSUS_MUST_BE_PROVIDED");

        _initialize(settingAddress);

        tToken = tTokenAddress;
        lendingPool = lendingPoolAddress;
        interestConsensus = IInterestConsensus(interestConsensusAddress);
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
