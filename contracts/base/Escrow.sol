pragma solidity 0.5.17;
pragma experimental ABIEncoderV2;

// Contracts
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
import "../providers/openzeppelin/SignedSafeMath.sol";

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
contract Escrow is
    EscrowInterface,
    TInitializable,
    BaseUpgradeable,
    BaseEscrowDapp,
    SettingsConsts
{
    using Address for address;
    using SafeMath for uint256;
    using SignedSafeMath for uint256;

    // Numerical representation of 100.00 percent. 
    uint16 public constant ONE_HUNDRED_PERCENT = 10000;
    
    // Ethereum decimal places.
    uint8 public constant ETH_DECIMALS = 18;
    
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

    /** Public Functions **/

    /**
        @notice Checks if loan is active. 
        @return true in case loan is active.  
     */
    function isLoanActive() public view returns (bool) {
        return getLoan().status == TellerCommon.LoanStatus.Active;
    }

    /**
        @notice It calls a given dapp using a delegatecall function by a borrower owned the current loan id associated to this escrow contract.
        @param dappData the current dapp data to be executed.
     */
    function callDapp(TellerCommon.DappData calldata dappData)
        external
        isInitialized()
        onlyOwner()
    {
        require(
            settings().escrowFactory().isDapp(dappData.location),
            "DAPP_NOT_WHITELISTED"
        );

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

    /**
        @notice Returns this Escrow's loan instance. 
     */
    function getLoan() public view returns (TellerCommon.Loan memory) {
        return loans.loans(loanID);
    }

    /**
        @notice Calculate this Escrow instance total value. 
        @return This Escrow instance total value expressed in ETH and Token value. 
     */
    function calculateTotalValue() public view returns (TellerCommon.EscrowValue memory) {
        address[] memory tokens = getTokens();

        uint256 valueInEth = 0;

        for (uint256 i = 0; i < tokens.length; i++) {
            uint256 tokenEthValue = _valueOfIn(
                tokens[i],
                settings().ETH_ADDRESS(),
                _balanceOf(tokens[i])
            );
            valueInEth = valueInEth.add(tokenEthValue);
        }

        uint256 collateralValue = getLoan().collateral;
        if (getLoan().loanTerms.collateralRatio > 0) {
            uint256 bufferPercent = settings().getPlatformSettingValue(
                COLLATERAL_BUFFER_SETTING
            );
            uint256 buffer = collateralValue.mul(bufferPercent).div(ONE_HUNDRED_PERCENT);
            collateralValue = collateralValue.sub(buffer);
        }

        if (loans.collateralToken() == settings().ETH_ADDRESS()) {
            valueInEth = valueInEth.add(collateralValue);
        } else {
            uint256 collateralEthValue = _valueOfIn(
                loans.collateralToken(),
                settings().ETH_ADDRESS(),
                collateralValue
            );
            valueInEth = valueInEth.add(collateralEthValue);
        }

        uint256 valueInToken = _valueOfIn(
            settings().ETH_ADDRESS(),
            loans.lendingToken(),
            valueInEth
        );

        return
            TellerCommon.EscrowValue({
                valueInEth: valueInEth,
                valueInToken: valueInToken
            });
    }

    /**
        @notice Checks if current Escrow instance loan can be liquidated.
        @return true if loan can be liquidated.
     */
    function canPurchase() public view returns (bool) {
        return loans.canLiquidateLoan(loanID);
    }

    /**
        @notice Checks if this Escrow loan value is undervalued based its token price.
        @return true if this escrow loan is undervalued based on its token price.
     */
    function isUnderValued() external view returns (bool) {
        return calculateTotalValue().valueInToken < loans.getTotalOwed(loanID);
    }

    /**
        @notice Purchase this Escrow's loan if it is eligible to liquidate and transfers ownership
            to msg.sender.
        @dev Events are emitted when repay() and _transferOwnership().
     */
    function purchaseLoanDebt() external payable {
        require(canPurchase(), "ESCROW_INELIGIBLE_TO_PURCHASE");

        loans.repay(loans.getTotalOwed(loanID), loanID);

        _transferOwnership(msg.sender);
    }

    /**
        @notice It initializes this escrow instance for a given loans address and loan id.
        @param loansAddress loans contract address.
        @param aLoanID the loan ID associated to this escrow instance.
     */
    function initialize(address loansAddress, uint256 aLoanID) public isNotInitialized() {
        require(loansAddress.isContract(), "LOANS_MUST_BE_A_CONTRACT");

        loans = LoansInterface(loansAddress);
        loanID = aLoanID;

        Ownable.initialize(getBorrower());
        TInitializable._initialize();

        // Initialize tokens list with the borrowed token.
        require(
            _balanceOf(loans.lendingToken()) == getLoan().borrowedAmount,
            "ESCROW_BALANCE_NOT_MATCH_LOAN"
        );
        _tokenUpdated(loans.lendingToken());
    }

    /** Internal Functions */

    /**
        @notice Calculate this Escrow instance loan value in ETH or Token price.
        @return Loan value in ETH or Token price based on baseAddress.
        @param baseAddress base token or ETH address.
        @param quoteAddress quote token address.
        @param baseAmount amount of base token or ETH.
    */    
    function _valueOfIn(
        address baseAddress,
        address quoteAddress,
        uint256 baseAmount
    ) internal view returns (uint256) {
        uint8 baseDecimals = baseAddress == settings().ETH_ADDRESS()
            ? ETH_DECIMALS
            : ERC20Detailed(baseAddress).decimals();
        PairAggregatorInterface aggregator = _getAggregatorFor(baseAddress, quoteAddress);
        uint256 oneTokenPrice = uint256(aggregator.getLatestAnswer());
        uint256 oneUnit = uint256(10)**baseDecimals;
        return baseAmount.mul(oneTokenPrice).div(oneUnit);
    }

    /**
        @notice Returns Chainlink pair aggregator for token or revert if not found.
        @param base base token address.
        @param quote quote token address.
        @return PairAggregator instance found for this tokens pair.
     */
    function _getAggregatorFor(address base, address quote)
        internal
        view
        returns (PairAggregatorInterface)
    {
        require(
            settings().pairAggregatorRegistry().hasPairAggregator(base, quote),
            "CHAINLINK_PAIR_AGGREGATOR_NOT_EXISTS"
        );

        return settings().pairAggregatorRegistry().getPairAggregator(base, quote);
    }
}
