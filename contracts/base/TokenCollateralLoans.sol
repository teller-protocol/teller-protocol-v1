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
    @notice This contract is used as a basis for the creation of loans (not wei) across the platform
    @notice It implements the LoansBase contract from Teller

    @author develop@teller.finance
 */
contract TokenCollateralLoans is Loans {
    /** Constants */

    /** Properties */

    /** Modifiers */

    /**
        @notice Checks the value in the current transaction is zero.
        @dev It throws a require error if value is not zero.
     */
    modifier noMsgValue() {
        require(msg.value == 0, "TOKEN_LOANS_VALUE_MUST_BE_ZERO");
        _;
    }

    /** External Functions */

    function _payInCollateral(uint256 loanID, uint256 amount)
        internal
        noMsgValue()
    {
        // Transfer collateral tokens to this contract.
        _collateralTokenTransferFrom(msg.sender, amount);
        super._payInCollateral(loanID, amount);
    }

    /**
        @notice Initializes the current contract instance setting the required parameters, if allowed
        @param lendingPoolAddress Contract address of the lending pool
        @param loanTermsConsensusAddress Contract address for loan term consensus
        @param settingsAddress Contract address for the configuration of the platform
        @param collateralTokenAddress Contract address for the collateral token.
     */
    function initialize(
        address lendingPoolAddress,
        address loanTermsConsensusAddress,
        address settingsAddress,
        address collateralTokenAddress
    ) external isNotInitialized {
        collateralTokenAddress.requireNotEmpty("PROVIDE_COLL_TOKEN_ADDRESS");

        _initialize(
            lendingPoolAddress,
            loanTermsConsensusAddress,
            settingsAddress
        );

        collateralToken = collateralTokenAddress;
    }

    /** Internal Function */
    /**
        @notice Pays out collateral for the associated loan
        @param loanID The ID of the loan the collateral is for
        @param amount The amount of collateral to be paid
     */
    function _payOutCollateral(
        uint256 loanID,
        uint256 amount,
        address payable recipient
    ) internal {
        totalCollateral = totalCollateral.sub(amount);
        loans[loanID].collateral = loans[loanID].collateral.sub(amount);

        _collateralTokenTransfer(recipient, amount);
    }

    /**
        @notice It transfers an amount of collateral tokens to a specific address.
        @param recipient The address which will receive the tokens.
        @param amount The amount of tokens to transfer.
     */
    function _collateralTokenTransfer(address recipient, uint256 amount)
        internal
    {
        ERC20Detailed(collateralToken).safeTransfer(recipient, amount);
    }

    /**
        @notice It transfers an amount of collateral tokens from an address to this contract.
        @param from The address where the tokens will transfer from.
        @param amount The amount to be transferred.
     */
    function _collateralTokenTransferFrom(address from, uint256 amount)
        internal
    {
        ERC20Detailed(collateralToken).safeTransferFrom(
            from,
            address(this),
            amount
        );
    }
}
