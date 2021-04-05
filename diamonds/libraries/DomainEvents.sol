// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @dev Library of events across the Teller protocol
 *
 * @author develop@teller.finance
 */
library DomainEvents {
    /**
        @notice This event is emitted when a new platform setting is created.
        @param settingName new setting name.
        @param sender address that created it.
        @param value value for the new setting.
     */
    event PlatformSettingCreated(
        bytes32 indexed settingName,
        address indexed sender,
        uint256 value,
        uint256 minValue,
        uint256 maxValue
    );

    /**
        @notice This event is emitted when a current platform setting is removed.
        @param settingName setting name removed.
        @param sender address that removed it.
     */
    event PlatformSettingRemoved(
        bytes32 indexed settingName,
        uint256 lastValue,
        address indexed sender
    );

    /**
        @notice This event is emitted when a platform setting is updated.
        @param settingName settings name updated.
        @param sender address that updated it.
        @param oldValue old value for the setting.
        @param newValue new value for the setting.
     */
    event PlatformSettingUpdated(
        bytes32 indexed settingName,
        address indexed sender,
        uint256 oldValue,
        uint256 newValue
    );

    /**
        @notice This event is emitted when a new asset settings is created.
        @param sender the transaction sender address.
        @param assetAddress the asset address used to create the settings.
        @param cTokenAddress cToken address to configure for the asset.
        @param maxLoanAmount max loan amount to configure for the asset.
     */
    event AssetSettingsCreated(
        address indexed sender,
        address indexed assetAddress,
        address cTokenAddress,
        uint256 maxLoanAmount
    );

    /**
        @notice This event is emitted when an asset settings is removed.
        @param sender the transaction sender address.
        @param assetAddress the asset address used to remove the settings.
     */
    event AssetSettingsRemoved(
        address indexed sender,
        address indexed assetAddress
    );

    /**
        @notice This event is emitted when an asset settings (address type) is updated.
        @param assetSettingName asset setting name updated.
        @param sender the transaction sender address.
        @param assetAddress the asset address used to update the asset settings.
        @param oldValue old value used for the asset setting.
        @param newValue the value updated.
     */
    event AssetSettingsAddressUpdated(
        bytes32 indexed assetSettingName,
        address indexed sender,
        address indexed assetAddress,
        address oldValue,
        address newValue
    );

    /**
        @notice This event is emitted when an asset settings (uint256 type) is updated.
        @param assetSettingName asset setting name updated.
        @param sender the transaction sender address.
        @param assetAddress the asset address used to update the asset settings.
        @param oldValue old value used for the asset setting.
        @param newValue the value updated.
     */
    event AssetSettingsUintUpdated(
        bytes32 indexed assetSettingName,
        address indexed sender,
        address indexed assetAddress,
        uint256 oldValue,
        uint256 newValue
    );

    /**
        @notice This event is emitted when a lending pool is paused.
        @param account address that paused the lending pool.
        @param lendingPoolAddress lending pool address which was paused.
     */
    event MarketPaused(
        address indexed account,
        address indexed lendingPoolAddress
    );

    /**
        @notice This event is emitted when a lending pool is unpaused.
        @param account address that paused the lending pool.
        @param lendingPoolAddress lending pool address which was unpaused.
     */
    event MarketUnpaused(
        address indexed account,
        address indexed lendingPoolAddress
    );

    /**
        @notice This event is emitted when the platform restriction is switched
        @param restriction Boolean representing the state of the restriction
        @param pauser address of the pauser flipping the switch
    */
    event PlatformRestricted(bool restriction, address indexed pauser);

    /**
     * @notice This event is emitted when collateral has been deposited for the loan
     * @param loanID ID of the loan for which collateral was deposited
     * @param borrower Account address of the borrower
     * @param depositAmount Amount of collateral deposited
     */
    event CollateralDeposited(
        uint256 indexed loanID,
        address indexed borrower,
        uint256 depositAmount
    );

    /**
     * @notice This event is emitted when collateral has been withdrawn
     * @param loanID ID of loan from which collateral was withdrawn
     * @param borrower Account address of the borrower
     * @param recipient Account address of the recipient
     * @param amount Value of collateral withdrawn
     */
    event CollateralWithdrawn(
        uint256 indexed loanID,
        address indexed borrower,
        address indexed recipient,
        uint256 amount
    );

    /**
     * @notice This event is emitted when loan terms have been successfully set
     * @param loanID ID of loan from which collateral was withdrawn
     * @param borrower Account address of the borrower
     * @param recipient Account address of the recipient
     */
    event LoanTermsSet(
        uint256 indexed loanID,
        address indexed borrower,
        address indexed recipient,
        uint256 nonce
    );

    /**
     * @notice This event is emitted when a loan has been successfully taken out
     * @param loanID ID of loan from which collateral was withdrawn
     * @param borrower Account address of the borrower
     * @param escrow Escrow address associated to this loan
     * @param amountBorrowed Total amount taken out in the loan
     */
    event LoanTakenOut(
        uint256 indexed loanID,
        address indexed borrower,
        address indexed escrow,
        uint256 amountBorrowed
    );

    /**
     * @notice This event is emitted when a loan has been successfully repaid
     * @param loanID ID of loan from which collateral was withdrawn
     * @param borrower Account address of the borrower
     * @param amountPaid Amount of the loan paid back
     * @param payer Account address of the payer
     * @param totalOwed Total amount of the loan to be repaid
     */
    event LoanRepaid(
        uint256 indexed loanID,
        address indexed borrower,
        uint256 amountPaid,
        address payer,
        uint256 totalOwed
    );

    /**
     * @notice This event is emitted when a loan has been successfully liquidated
     * @param loanID ID of loan from which collateral was withdrawn
     * @param borrower Account address of the borrower
     * @param liquidator Account address of the liquidator
     * @param collateralOut Collateral that is sent to the liquidator
     * @param tokensIn Percentage of the collateral price paid by the liquidator to the lending pool
     */
    event LoanLiquidated(
        uint256 indexed loanID,
        address indexed borrower,
        address liquidator,
        int256 collateralOut,
        uint256 tokensIn
    );

    /**
        @notice This event is emitted when an lender withdraws interests.
        @param lender address.
        @param amount of tokens.
     */
    event InterestWithdrawn(address indexed lender, uint256 amount);

    /**
     * @notice Notifies when the Escrow's tokens have been claimed.
     * @param recipient address where the tokens where sent to.
     */
    event TokensClaimed(address recipient);

    /**
        @notice This event is emitted when an user deposits tokens into the pool.
        @param sender address.
        @param amount of tokens.
     */
    event TokenDeposited(
        address indexed sender,
        uint256 amount,
        uint256 tTokenAmount
    );

    /**
        @notice This event is emitted when an user withdraws tokens from the pool.
        @param sender address that withdrew the tokens.
        @param amount of tokens.
     */
    event TokenWithdrawn(
        address indexed sender,
        uint256 amount,
        uint256 tTokenAmount
    );

    /**
        @notice This event is emitted when an borrower repaid a loan.
        @param borrower address.
        @param amount of tokens.
     */
    event TokenRepaid(address indexed borrower, uint256 amount);

    /**
     * @notice This event is emitted when a new token is added to this Escrow.
     * @param tokenAddress address of the new token.
     * @param index Index of the added token.
     */
    event TokenAdded(address tokenAddress, uint256 index);

    /**
     * @notice This event is emitted when a new token is removed from this Escrow.
     * @param tokenAddress address of the removed token.
     * @param index Index of the removed token.
     */
    event TokenRemoved(address tokenAddress, uint256 index);

    /**
        @notice This event is emitted when a new Escrow contract is created.
        @param borrower address associated to the new escrow.
        @param loansAddress loan manager contract address.
        @param loanID loan id associated to the borrower and escrow contract.
        @param escrowAddress the new escrow contract address.
     */
    event EscrowCreated(
        address indexed borrower,
        address indexed loansAddress,
        uint256 indexed loanID,
        address escrowAddress
    );

    /**
        @notice This event is emitted when a new dapp is added to the factory.
        @param sender address.
        @param dapp address added to the factory.
        @param unsecured boolean that describes if the dapp can be used by with an unsecured loan.
     */
    event NewDappAdded(
        address indexed sender,
        address indexed dapp,
        bool unsecured
    );

    /**
        @notice This event is emitted when a dapp is updated.
        @param sender address.
        @param dapp address of dapp contract.
        @param unsecured boolean that describes if the dapp can be used by with an unsecured loan.
     */
    event DappUpdated(
        address indexed sender,
        address indexed dapp,
        bool unsecured
    );

    /**
        @notice This event is emitted when a current dapp is removed from the factory.
        @param sender address.
        @param dapp address removed from the factory.
     */
    event DappRemoved(address indexed sender, address indexed dapp);

    /**
        @notice This event is emitted every time Aave deposit is invoked successfully.
        @param tokenAddress address of the underlying token.
        @param aTokenAddress aave token address.
        @param amount amount of tokens to Deposit.
        @param aTokenBalanceBeforeDeposit aTokens balance after Deposit.
        @param aTokenBalanceAfterDeposit aTokens balance after Deposit.
     */
    event AaveDeposited(
        address indexed tokenAddress,
        address indexed aTokenAddress,
        uint256 amount,
        uint256 aTokenBalanceBeforeDeposit,
        uint256 aTokenBalanceAfterDeposit
    );

    /**
        @notice This event is emitted every time Aave redeem is invoked successfully.
        @param tokenAddress address of the underlying token.
        @param aTokenAddress aave token address.
        @param amount amount of tokens to Withdrawal.
        @param aTokenBalanceBeforeDeposit aTokens balance after Withdrawal.
        @param aTokenBalanceAfterWithdrawal aTokens balance after Withdrawal.
     */
    event AaveWithdrawn(
        address indexed tokenAddress,
        address indexed aTokenAddress,
        uint256 amount,
        uint256 aTokenBalanceBeforeDeposit,
        uint256 aTokenBalanceAfterWithdrawal
    );

    /**
        @notice This event is emitted every time Compound lend is invoked successfully.
        @param tokenAddress address of the underlying token.
        @param cTokenAddress compound token address.
        @param amount amount of tokens to Lend.
        @param tokenBalance underlying token balance after Lend.
        @param cTokenBalance cTokens balance after Lend.
     */
    event CompoundLended(
        address indexed tokenAddress,
        address indexed cTokenAddress,
        uint256 amount,
        uint256 tokenBalance,
        uint256 cTokenBalance
    );

    /**
        @notice This event is emitted every time Compound redeem is invoked successfully.
        @param tokenAddress address of the underlying token.
        @param cTokenAddress compound token address.
        @param amount amount of tokens to Redeem.
        @param isUnderlyingAmount boolean indicating if the amount was in the underlying token.
        @param tokenBalance underlying token balance after Redeem.
        @param cTokenBalance cTokens balance after Redeem.
     */
    event CompoundRedeemed(
        address indexed tokenAddress,
        address indexed cTokenAddress,
        uint256 amount,
        bool isUnderlyingAmount,
        uint256 tokenBalance,
        uint256 cTokenBalance
    );

    /**
        @notice This event is emitted every time Pool Together depositTo is invoked successfully.
        @param tokenAddress address of the underlying token.
        @param ticketAddress pool ticket token address.
        @param amount amount of tokens deposited.
        @param tokenBalance underlying token balance after depositing.
        @param creditBalanceAfter pool together credit after depositing.
     */
    event PoolTogetherDeposited(
        address indexed tokenAddress,
        address indexed ticketAddress,
        uint256 amount,
        uint256 tokenBalance,
        uint256 creditBalanceAfter
    );

    /**
        @notice This event is emitted every time Pool Together withdrawInstantlyFrom is invoked successfully.
        @param tokenAddress address of the underlying token.
        @param ticketAddress pool ticket token address.
        @param amount amount of tokens to Redeem.
        @param tokenBalance underlying token balance after Redeem.
        @param creditBalanceAfter pool together credit after depositing.
     */
    event PoolTogetherWithdrawal(
        address indexed tokenAddress,
        address indexed ticketAddress,
        uint256 amount,
        uint256 tokenBalance,
        uint256 creditBalanceAfter
    );

    /**
        @notice Event emmitted every time a successful swap has taken place.
        @param sourceToken source token address.
        @param destinationToken destination address.
        @param sourceAmount source amount sent.
        @param destinationAmount destination amount received.
     */
    event UniswapSwapped(
        address indexed sourceToken,
        address indexed destinationToken,
        uint256 sourceAmount,
        uint256 destinationAmount
    );

    /**
        @notice This event is emitted when a yVault deposit is invoked successfully
        @param iVault The address of the yVault
        @param amount The amount of funds to deposit
        @param tokenBalanceBeforeDeposit The balance of tokens held after depositing
        @param tokenBalanceAfterDeposit The balance of tokens held after depositing
     */
    event YearnDeposited(
        address tokenAddress,
        address iVault,
        uint256 amount,
        uint256 tokenBalanceBeforeDeposit,
        uint256 tokenBalanceAfterDeposit
    );

    /**
        @notice This event is emitted when a yVault withdraw is invoked successfully
        @param underlyingToken The address of the underlying token of the vault
        @param iVault The address of the yVault
        @param amount The amount of funds to withdraw
        @param tokenBalanceBeforeWithdrawal The balance of tokens held before withdrawal
        @param tokenBalanceAfterWithdrawal The balance of tokens held after withdrawal
     */
    event YearnWithdrawn(
        address underlyingToken,
        address iVault,
        uint256 amount,
        uint256 tokenBalanceBeforeWithdrawal,
        uint256 tokenBalanceAfterWithdrawal
    );

    event NewMarketCreated(
        address indexed sender,
        address indexed lendingToken,
        address indexed collateralToken,
        address loans,
        address lendingPool
    );

    event Claimed(uint256 index, address account, uint256 amount);

    event TierAdded(uint256 index);
}
