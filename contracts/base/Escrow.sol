pragma solidity 0.5.17;
pragma experimental ABIEncoderV2;

// Contracts
import "@openzeppelin/contracts-ethereum-package/contracts/ownership/Ownable.sol";
import "./BaseUpgradeable.sol";
import "./BaseEscrowDapp.sol";
import "./TInitializable.sol";

// Interfaces
import "../interfaces/EscrowInterface.sol";
import "../interfaces/LoansInterface.sol";
import "../interfaces/PairAggregatorInterface.sol";

// Libraries
import "@openzeppelin/contracts-ethereum-package/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/ERC20Detailed.sol";
import "../util/SettingsConsts.sol";
import "../util/TellerCommon.sol";

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
    @notice This contract is used by borrowers to call DApp functions (using delegate calls).
    @notice This contract should only be constructed using it's upgradeable Proxy contract.
    @notice In order to call a DApp function, the DApp must be added in the EscrowFactory instance.
    @dev The current DApp implementations are: Uniswap and Compound.

    @author develop@teller.finance
 */
// TODO: remove SettingsConsts once constants added to settings contract.
contract Escrow is EscrowInterface, TInitializable, Ownable, BaseUpgradeable, BaseEscrowDapp, SettingsConsts {
    using Address for address;
    using SafeMath for uint256;

    /** State Variables **/

    /**
        @notice It is the current loans contract instance.
     */
    LoansInterface public loans;

    /**
        @notice This loan id refers the loan in the loans contract.
        @notice This loan was taken out by a borrower.
     */
    uint256 public loanID;

    /** Modifiers **/

    modifier whenLoanActive() {
        require(getLoan().status == TellerCommon.LoanStatus.Active, "LOAN_NOT_ACTIVE");
        _;
    }

    /** Public Functions **/

    /**
        @notice It calls a given dapp using a delegatecall function by a borrower owned the current loan id associated to this escrow contract.
        @param dappData the current dapp data to be executed.
     */
    function callDapp(TellerCommon.DappData calldata dappData)
        external
        isInitialized()
        whenLoanActive()
        onlyOwner()
    {
        require(settings().escrowFactory().isDapp(dappData.location), "DAPP_NOT_WHITELISTED");

        (bool success, ) = dappData.location.delegatecall(dappData.data);

        require(success, "DAPP_CALL_FAILED");
    }

    /**
        @notice Gets the borrower for this Escrow's loan.
        @return address of this Escrow's loans
     */
    function getBorrower() public view returns (address) {
        return loans.loans(loanID).loanTerms.borrower;
    }

    function getLoan() public view returns (TellerCommon.Loan memory) {
        return loans.loans(loanID);
    }

    function calculateTotalValue() public view returns (TellerCommon.EscrowValue memory) {
        address[] memory tokens = getTokens();

        uint256 valueInEth = 0;

        for (uint i = 0; i < tokens.length; i++) {
            uint256 tokenEthValue = _valueOfIn(tokens[i], _balanceOf(tokens[i]), address(0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE));
            valueInEth = valueInEth.add(tokenEthValue);
        }

        if (loans.collateralToken() == address(0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE)) {
            valueInEth = valueInEth.add(getLoan().collateral);
        } else {
            uint256 collateralEthValue = _valueOfIn(loans.collateralToken(), getLoan().collateral, address(0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE));
            valueInEth = valueInEth.add(collateralEthValue);
        }

        uint256 valueInToken = _valueOfIn(address(0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE), valueInEth, loans.lendingToken());

        return TellerCommon.EscrowValue({
            valueInEth: valueInEth,
            valueInToken: valueInToken
        });
    }

    function canPurchase() external returns (bool) {
        return _canPurchase(calculateTotalValue());
    }

    // TODO: test
    function _canPurchase(TellerCommon.EscrowValue memory value) internal whenLoanActive() returns (bool) {
        require(loans.canLiquidateLoan(loanID), 'LOAN_NOT_LIQUIDATABLE');

        uint256 buffer = settings().getPlatformSettingValue(COLLATERAL_BUFFER_SETTING);

        return value.valueInToken < loans.getTotalOwed(loanID) + buffer;
    }

    // TODO: what asset can be used to purchase with?
    // TODO: test
    function purchaseLoanDebt() external payable whenLoanActive() {
        TellerCommon.EscrowValue memory value = calculateTotalValue();
        require(_canPurchase(value), 'ESCROW_INELIGIBLE_TO_PURCHASE');

        _transferOwnership(msg.sender);
    }

    /**
        @notice It initializes this escrow instance for a given loans address and loan id.
        @param loansAddress loans contract address.
        @param aLoanID the loan ID associated to this escrow instance.
     */
    function initialize(address loansAddress, uint256 aLoanID)
        public
        isNotInitialized()
    {
        require(loansAddress.isContract(), "LOANS_MUST_BE_A_CONTRACT");

        loans = LoansInterface(loansAddress);
        loanID = aLoanID;

        Ownable.initialize(getBorrower());
        TInitializable._initialize();

        // Initialize tokens list with the borrowed token.
        // _tokenUpdated(loans.lendingToken()); // TODO Verify the _tokenUpdated function works with the AddressLib
    }

    /** Internal Functions */

    function _valueOfIn(address baseAddress, uint256 baseAmount, address quoteAddress) internal view returns (uint256) {
        uint8 baseDecimals = baseAddress == address(0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE) ? 18 : ERC20Detailed(baseAddress).decimals();
        PairAggregatorInterface aggregator = _getAggregatorFor(baseAddress, quoteAddress);
        uint256 oneTokenPrice = uint256(aggregator.getLatestAnswer());
        // TODO: better way with SafeMath?
        return baseAmount.mul(oneTokenPrice).div(uint256(10)**baseDecimals);
    }

    function _getAggregatorFor(address base, address quote) internal view returns (PairAggregatorInterface) {
        require(settings().pairAggregatorRegistry().hasPairAggregator(base, quote), "CHAINLINK_PAIR_AGGREGATOR_NOT_EXISTS");

        return settings().pairAggregatorRegistry().getPairAggregator(base, quote);
    }
}
