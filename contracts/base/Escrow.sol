pragma solidity 0.5.17;
pragma experimental ABIEncoderV2;

// Contracts
import "./BaseEscrowDapp.sol";
import "./TInitializable.sol";

// Interfaces
import "../interfaces/EscrowInterface.sol";
import "../interfaces/LoansInterface.sol";
import "../interfaces/IBaseProxy.sol";

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
    @notice This contract is used by borrowers to call Dapp functions (using delegate calls).
    @notice This contract should only be constructed using it's upgradeable Proxy contract.
    @notice In order to call a Dapp function, the Dapp must be added in the EscrowFactory instance.
    @dev The current Dapp implementations are: Uniswap and Compound.

    @author develop@teller.finance
 */
contract Escrow is EscrowInterface, TInitializable, BaseEscrowDapp {
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

    /** Public Functions **/

    /**
        @notice It calls a given dapp using a delegatecall function by a borrower owned the current loan id associated to this escrow contract.
        @param dappData the current dapp data to be executed.
     */
    function callDapp(TellerCommon.DappData calldata dappData)
        external
        isInitialized()
        onlyOwner()
    {
        TellerCommon.Dapp memory dapp = settings().escrowFactory().dapps(
            dappData.location
        );
        require(dapp.exists, "DAPP_NOT_WHITELISTED");
        require(
            dapp.unsecured || loans.isLoanSecured(loanID),
            "DAPP_UNSECURED_NOT_ALLOWED"
        );

        address _impl = IBaseProxy(dappData.location).implementation();
        (bool success, ) = _impl.delegatecall(dappData.data);

        if (!success) {
            assembly {
                let ptr := mload(0x40)
                let size := returndatasize
                returndatacopy(ptr, 0, size)
                revert(ptr, size)
            }
        }
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
    function calculateTotalValue() public view returns (TellerCommon.EscrowValue memory value) {
        address[] memory tokens = getTokens();
        for (uint256 i = 0; i < tokens.length; i++) {
            if (tokens[i] == settings().WETH_ADDRESS()) {
                value.valueInEth = value.valueInEth.add(_balanceOf(tokens[i]));
            } else {
                value.valueInEth = value.valueInEth.add(
                    _valueOfIn(
                        tokens[i],
                        settings().ETH_ADDRESS(),
                        _balanceOf(tokens[i])
                    )
                );
            }
        }

        if (loans.collateralToken() == settings().ETH_ADDRESS()) {
            value.valueInEth = value.valueInEth.add(getLoan().collateral);
        } else {
            uint256 collateralEthValue = _valueOfIn(
                loans.collateralToken(),
                settings().ETH_ADDRESS(),
                getLoan().collateral
            );
            value.valueInEth = value.valueInEth.add(collateralEthValue);
        }

        value.valueInToken = _valueOfIn(
            settings().ETH_ADDRESS(),
            loans.lendingToken(),
            value.valueInEth
        );
    }

    /**
        @notice Checks if this Escrow loan value is undervalued based its token price.
        @return true if this escrow loan is undervalued based on its token price.
     */
    function isUnderValued() external view returns (bool) {
        return calculateTotalValue().valueInToken < loans.getTotalOwed(loanID);
    }

    /**
        @notice Repay this Escrow's loan.
        @dev If the Escrow's balance of the borrowed token is less than the amount to repay, transfer tokens from the sender's wallet.
        @dev Only the owner of the Escrow can call this. If someone else wants to make a payment, they should call the loans contract directly.
     */
    function repay(uint256 amount) external onlyOwner {
        IERC20 token = IERC20(loans.lendingToken());
        uint256 balance = _balanceOf(address(token));
        uint256 totalOwed = loans.getTotalOwed(loanID);
        if (balance < totalOwed && amount > balance) {
            uint256 amountNeeded = amount > totalOwed
                ? totalOwed.sub(balance)
                : amount.sub(balance);

            require(
                token.transferFrom(msg.sender, address(this), amountNeeded),
                "ESCROW_TRANSFER_FROM_FAILED"
            );
        }
        token.approve(loans.lendingPool(), amount);

        loans.repay(amount, loanID);
    }

    /**
        @notice Sends the tokens owned by this escrow to the recipient.
        @dev The loan must not be active.
        @dev The recipient must either be the loan borrower OR the loan must be already liquidated.
        @param recipient address to send the tokens to.
    */
    function claimTokens(address recipient) external {
        require(getLoan().status != TellerCommon.LoanStatus.Active, "LOAN_ACTIVE");
        if (getLoan().liquidated) {
            require(recipient != getBorrower(), "RECIPIENT_CANNOT_BE_BORROWER");
            require(msg.sender == address(loans), "CALLER_MUST_BE_LOANS");
        } else {
            require(recipient == getBorrower(), "RECIPIENT_MUST_BE_BORROWER");
        }

        address[] memory tokens = getTokens();
        for (uint256 i = 0; i < tokens.length; i++) {
            uint256 balance = _balanceOf(tokens[i]);
            if (balance > 0) {
                IERC20(tokens[i]).transfer(recipient, balance);
            }
        }

        emit TokensClaimed(recipient);
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
        @notice Calculate a value of a token amount.
        @param baseAddress base token address.
        @param quoteAddress quote token address.
        @param baseAmount amount of base token.
        @return Value of baseAmount in quote token.
    */
    function _valueOfIn(
        address baseAddress,
        address quoteAddress,
        uint256 baseAmount
    ) internal view returns (uint256) {
        return
            settings().chainlinkAggregator().valueFor(
                baseAddress,
                quoteAddress,
                baseAmount
            );
    }
}
