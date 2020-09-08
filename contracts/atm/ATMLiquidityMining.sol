pragma solidity 0.5.17;

// External Libraries
import "@openzeppelin/contracts-ethereum-package/contracts/utils/Address.sol";

// Common
import "../util/AddressLib.sol";
//import "../base/TInitializable.sol";
import "./ATMTokenInterface.sol";
import "./ATMLiquidityMiningInterface.sol";
import "../interfaces/TTokenInterface.sol";

// Contracts

// Interfaces
import "./ATMGovernanceInterface.sol";

contract ATMLiquidityMining is ATMLiquidityMiningInterface {  //is TInitializable

    /* Constants */

    uint8 private constant MAX_DEPOSITS = 255;

    /* State Variables */

    ATMGovernanceInterface private atmGovernance;
    ATMTokenInterface private atmToken;
    TTokenInterface public tToken;

    constructor(address atmGovernanceProxy, address atmTokenProxy, address tTokenAddress) 
        public
    {
        atmGovernance = ATMGovernanceInterface(atmGovernanceProxy);
        atmToken = ATMTokenInterface(atmTokenProxy);
        tToken = TTokenInterface(tTokenAddress);
    }


    /**
        @notice Mint earned ATMTokens and assign them to sender.
     */
    function assignAccruedATMTokens()
        public
    {
        uint256 accruedTokens = _getAccruedATMTokensFromLastestTxs();
        require(accruedTokens > atmGovernance.getMinimumRedeem(), "NOT_ENOUGH_ATM_TOKENS_TO_REDEEM");
        atmToken.mint(msg.sender, accruedTokens);
        uint256 newBalance = atmToken.balanceOf(msg.sender);

        emit ATMTokensAssigned(
            msg.sender, 
            block.number, 
            address(atmGovernance), 
            address(atmToken), 
            accruedTokens,
            newBalance
        );
    }

    /**
        @notice Returns my complete (current + earned) ATMToken balance for this ATM. 
     */
    function atmTotalTokenBalance()
        public
        view
        returns (uint256)
    {
        uint256 previousBalance = atmToken.balanceOf(msg.sender);
        uint256 accruedTokens = _getAccruedATMTokensFromLastestTxs();
        return previousBalance + accruedTokens;
    }

    /**
        @notice Returns accrued ATMTokens based on tToken amount and olderness.
     */
    function _getAccruedATMTokensFromLastestTxs()
        internal
        view
        returns (uint256 tokens)
    {
        tokensPerBlock = atm.getBlockRewardPerToken();
        // iterate over deposits
        // calculate tokens
        for (uint8 i = 0; i < MAX_DEPOSITS; i++) {
            
        }
    }

   


}