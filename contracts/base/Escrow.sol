pragma solidity 0.5.17;
pragma experimental ABIEncoderV2;

// Contracts
import "./BaseEscrowDapp.sol";

// Interfaces
import "../interfaces/EscrowInterface.sol";
import "../interfaces/IBaseProxy.sol";
import "../providers/compound/CErc20Interface.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/ERC20Detailed.sol";

// Libraries
import "@openzeppelin/contracts-ethereum-package/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/SafeERC20.sol";
import "../util/SettingsConsts.sol";
import "../util/TellerCommon.sol";
import "../util/NumbersLib.sol";

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
    @notice In order to call a Dapp function, the Dapp must be added in the DappRegistry instance.
    @dev The current Dapp implementations are: Uniswap and Compound.

    @author develop@teller.finance
 */
contract Escrow is EscrowInterface, BaseEscrowDapp {
    using SafeMath for uint256;
    using NumbersLib for uint256;
    using SafeERC20 for IERC20;

    /** Modifiers **/

    /** Public Functions **/

    /**
        @notice It calls a given dapp using a delegatecall function by a borrower owned the current loan id associated to this escrow contract.
        @param dappData the current dapp data to be executed.
     */
    function callDapp(TellerCommon.DappData calldata dappData)
        external
        isInitialized
        onlyBorrower
        whenNotPaused
    {
        TellerCommon.Dapp memory dapp =
            settings.dappRegistry().dapps(dappData.location);
        require(dapp.exists, "DAPP_NOT_WHITELISTED");
        require(
            dapp.unsecured || getLoansContract().isLoanSecured(getLoanID()),
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
        @notice Calculate the value of the loan by getting the value of all tokens the Escrow owns.
        @return Escrow total value denoted in the lending token.
     */
    function calculateTotalValue() public view returns (uint256) {
        uint256 valueInEth;
        address[] memory tokens = getTokens();
        for (uint256 i = 0; i < tokens.length; i++) {
            if (tokens[i] == settings.WETH_ADDRESS()) {
                valueInEth = valueInEth.add(_balanceOf(tokens[i]));
            } else {
                valueInEth = valueInEth.add(
                    _valueOfIn(
                        tokens[i],
                        settings.ETH_ADDRESS(),
                        _balanceOf(tokens[i])
                    )
                );
            }
        }

        return
            _valueOfIn(settings.ETH_ADDRESS(), getLendingToken(), valueInEth);
    }

    /**
        @notice Repay this Escrow's loan.
        @dev If the Escrow's balance of the borrowed token is less than the amount to repay, transfer tokens from the sender's wallet.
        @dev Only the owner of the Escrow can call this. If someone else wants to make a payment, they should call the loans contract directly.
     */
    function repay(uint256 amount) external onlyBorrower whenNotPaused {
        IERC20 token = IERC20(getLendingToken());
        uint256 balance = _balanceOf(address(token));
        uint256 totalOwed = getLoansContract().getTotalOwed(getLoanID());
        if (balance < totalOwed && amount > balance) {
            uint256 amountNeeded =
                amount > totalOwed
                    ? totalOwed.sub(balance)
                    : amount.sub(balance);

            token.safeTransferFrom(msg.sender, address(this), amountNeeded);
        }
        token.safeApprove(getLoansContract().lendingPool(), amount);

        getLoansContract().repay(amount, getLoanID());
    }

    /**
        @notice Sends the tokens owned by this escrow to the owner.
        @dev The loan must not be active.
        @dev The recipient must be the loan borrower AND the loan must be already liquidated.
    */
    function claimTokens() external onlyBorrower whenNotPaused {
        require(
            getLoan().status == TellerCommon.LoanStatus.Closed,
            "LOAN_NOT_CLOSED"
        );

        address[] memory tokens = getTokens();
        for (uint256 i = 0; i < tokens.length; i++) {
            uint256 balance = _balanceOf(tokens[i]);
            if (balance > 0) {
                IERC20(tokens[i]).safeTransfer(getBorrower(), balance);
            }
        }

        emit TokensClaimed(getBorrower());
    }

    /**
        @notice Send the equivilant of tokens owned by this escrow (in collateral value) to the recipient,
        @dev The loan must not be active
        @dev The loan must be liquidated
        @dev The recipeient must be the loans contract
        @param recipient address to send the tokens to
        @param value The value of escrow held tokens, to be claimed based on collateral value
      */
    function claimTokensByCollateralValue(address recipient, uint256 value)
        external
        whenNotPaused
    {
        require(
            getLoan().status == TellerCommon.LoanStatus.Closed,
            "LOAN_NOT_CLOSED"
        );
        require(getLoan().liquidated, "LOAN_NOT_LIQUIDATED");
        require(
            msg.sender == address(getLoansContract()),
            "CALLER_MUST_BE_LOANS"
        );

        address[] memory tokens = getTokens();
        uint256 valueLeftToTransfer = value;
        // cycle through tokens
        for (uint256 i = 0; i < tokens.length; i++) {
            if (valueLeftToTransfer == 0) {
                break;
            }

            uint256 balance = _balanceOf(tokens[i]);
            // get value of token balance in collateral value
            if (balance > 0) {
                uint256 valueInCollateralToken =
                    (tokens[i] == getLoansContract().collateralToken())
                        ? balance
                        : _valueOfIn(
                            tokens[i],
                            getLoansContract().collateralToken(),
                            balance
                        );
                // if <= value, transfer tokens
                if (valueInCollateralToken <= valueLeftToTransfer) {
                    IERC20(tokens[i]).safeTransfer(
                        recipient,
                        valueInCollateralToken
                    );
                    valueLeftToTransfer = valueLeftToTransfer.sub(
                        valueInCollateralToken
                    );
                } else {
                    IERC20(tokens[i]).safeTransfer(
                        recipient,
                        valueLeftToTransfer
                    );
                    valueLeftToTransfer = 0;
                }
                _tokenUpdated(tokens[i]);
            }
        }
        emit TokensClaimed(recipient);
    }

    /**
        @notice It initializes this escrow instance for a given loans address and loan id.
        @param settingsAddress The address of the settings contract.
        @param loanID the loan ID associated to this escrow instance.
     */
    function initialize(address settingsAddress, uint256 loanID)
        external
        isNotInitialized
    {
        BaseEscrowDapp._initialize(msg.sender, loanID);
        Base._initialize(address(settingsAddress));

        // Initialize tokens list with the borrowed token.
        address lendingToken = getLendingToken();
        require(
            _balanceOf(lendingToken) == getLoan().borrowedAmount,
            "ESCROW_BALANCE_NOT_MATCH_LOAN"
        );
        _tokenUpdated(lendingToken);
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
        bool success;
        bytes memory returnData;
        // call function to base address for function signature of underlying
        (success, returnData) = baseAddress.staticcall(
            abi.encodeWithSignature("exchangeRateStored()")
        );
        require(success, "EXCHANGE_RATE_CALL_FAIL");
        if (returnData.length > 0) {
            uint8 cTokenDecimals = CErc20Interface(baseAddress).decimals();
            uint256 exchangeRate = abi.decode(returnData, (uint256));
            uint256 diffFactor =
                uint256(10)**uint256(18).diff(uint256(cTokenDecimals));

            if (cTokenDecimals > uint256(18)) {
                exchangeRate = exchangeRate.mul(diffFactor);
            } else {
                exchangeRate = exchangeRate.div(diffFactor);
            }

            uint8 assetDecimals;
            if (baseAddress == settings.CETH_ADDRESS()) {
                baseAddress = settings.ETH_ADDRESS();
                assetDecimals = uint8(18);
            } else {
                baseAddress = CErc20Interface(baseAddress).underlying();
                assetDecimals = ERC20Detailed(baseAddress).decimals();
            }

            baseAmount = baseAmount.mul(exchangeRate).div(
                uint256(10)**assetDecimals
            );
        }
        return
            settings.chainlinkAggregator().valueFor(
                baseAddress,
                quoteAddress,
                baseAmount
            );
    }
}
