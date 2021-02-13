pragma solidity 0.5.17;
pragma experimental ABIEncoderV2;

// Contracts
import "./Loans.sol";

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
    @notice This contract is used as a basis for the creation of Ether based loans across the platform
    @notice It implements the LoansBase contract from Teller

    @author develop@teller.finance
 */
contract EtherCollateralLoans is Loans {
    /**
        @notice Initializes the current contract instance setting the required parameters
        @param lendingPoolAddress Contract address of the lending pool
        @param loanTermsConsensusAddress Contract address for loan term consensus
        @param settingsAddress Contract address for the configuration of the platform
     */
    function initialize(
        address lendingPoolAddress,
        address loanTermsConsensusAddress,
        address settingsAddress,
        address
    ) external isNotInitialized() {
        _initialize(lendingPoolAddress, loanTermsConsensusAddress, settingsAddress);

        collateralToken = _getSettings().ETH_ADDRESS();
    }

    /** Internal Functions */

    /**
     * @notice Deposit collateral tokens into a loan.
     * @param loanID The ID of the loan the collateral is for
     * @param amount The amount to deposit as collateral.
     */
    function _payInCollateral(uint256 loanID, uint256 amount) internal {
        require(msg.value == amount, "INCORRECT_ETH_AMOUNT");
        super._payInCollateral(loanID, amount);
    }

    /**
        @notice Pays out collateral for the associated loan
        @param loanID The ID of the loan the collateral is for
        @param amount The amount of collateral to be paid
        @param recipient address that will receive the given amount.
     */
    function _payOutCollateral(
        uint256 loanID,
        uint256 amount,
        address payable recipient
    ) internal {
        totalCollateral = totalCollateral.sub(amount);
        loans[loanID].collateral = loans[loanID].collateral.sub(amount);
        recipient.transfer(amount);
    }
}
