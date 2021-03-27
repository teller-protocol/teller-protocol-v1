pragma solidity 0.5.17;
pragma experimental ABIEncoderV2;

// Libraries
import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/math/SafeMath.sol";

// Interfaces
import "../../interfaces/loans/ILoanManager.sol";
import "../../providers/compound/CErc20Interface.sol";
import "../../providers/compound/IComptroller.sol";
import "../../interfaces/IMarketRegistry.sol";
import "../../interfaces/ITToken.sol";
import "../../interfaces/AssetSettingsInterface.sol";

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
    @notice The LendingPool contract holds all of the tokens that lenders transfer into the protocol.
    It is the contract that lenders interact with to deposit and withdraw their tokens including interest.

    @author develop@teller.finance
 */
contract LendingPoolStorage {
    uint8 public constant EXCHANGE_RATE_DECIMALS = 36;

    ITToken public tToken;

    ERC20Detailed public lendingToken;

    CErc20Interface public cToken;

    IComptroller public compound;

    ERC20Detailed public comp;

    IMarketRegistry public marketRegistry;

    /**
        The total amount of underlying asset that has been originally been supplied by each
        lender not including interest earned.
    */
    mapping(address => uint256) internal _totalSuppliedUnderlyingLender;

    // The total amount of underlying asset that has been lent out for loans.
    uint256 internal _totalBorrowed;

    // The total amount of underlying asset that has been repaid from loans.
    uint256 internal _totalRepaid;

    // The total amount of underlying interest that has been claimed for each lender.
    mapping(address => uint256) internal _totalInterestEarnedLender;

    // The total amount of underlying interest the pool has earned from loans being repaid.
    uint256 public totalInterestEarned;

    /**
     * @notice It holds the platform AssetSettings instance.
     */
    AssetSettingsInterface public assetSettings;

    bool internal _notEntered;
}
