/*
    Copyright 2020 Fabrx Labs Inc.

    Licensed under the Apache License, Version 2.0 (the "License");
    you may not use this file except in compliance with the License.
    You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

    Unless required by applicable law or agreed to in writing, software
    distributed under the License is distributed on an "AS IS" BASIS,
    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
    See the License for the specific language governing permissions and
    limitations under the License.
*/
pragma solidity 0.5.17;

// Libraries
import "../util/AddressLib.sol";

// Commons
import "../util/ZeroCollateralCommon.sol";

// Interfaces
import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";
import "../interfaces/LendingPoolInterface.sol";
import "../interfaces/LendersInterface.sol";
import "../interfaces/ZDAIInterface.sol";

// Contracts
import "./Initializable.sol";


/**
    @notice The LendingPool contract holds all of the tokens that lenders transfer into the protocol. It is the contract that lenders interact with to deposit and withdraw their tokens including interest. The LendingPool interacts with the LenderInformation contract to ensure token balances and interest owed is kept up to date.
 */
contract LendingPool is LendingPoolInterface, Initializable {
    using AddressLib for address;

    /* State Variables */

    IERC20 public token;

    ZDAIInterface public zdai;

    LendersInterface public lenders;

    address public loans;

    /** Modifiers */

    /**
        @notice It checks the address is the Loans contract address.
        @dev It throws a require error if parameter is not equal to loans contract address.
     */
    modifier isLoan() {
        loans.requireEqualTo(msg.sender, "Address is not Loans contract.");
        _;
    }

    /* Constructor */

    /** External Functions */

    /**
        @notice It initializes the contract state variables.
        @param zdaiAddress zDAI token address.
        @param tokenAddress ERC20 token address.
        @param lendersAddress Lenders contract address.
        @param loansAddress Loans contract address.
        @dev It throws a require error if the contract is already initialized.
     */
    function initialize(
        address zdaiAddress,
        address tokenAddress,
        address lendersAddress,
        address loansAddress
    ) external isNotInitialized() {
        zdaiAddress.requireNotEmpty("ZDai address is required.");
        tokenAddress.requireNotEmpty("Token address is required.");
        lendersAddress.requireNotEmpty("Lenders address is required.");
        loansAddress.requireNotEmpty("Loans address is required.");

        initialize();

        zdai = ZDAIInterface(zdaiAddress);
        token = IERC20(tokenAddress);
        lenders = LendersInterface(lendersAddress);
        loans = loansAddress;
    }

    /**
        @notice It allows users to deposit tokens into the pool.
        @dev the user must call ERC20.approve function previously.
        @param amount of tokens to deposit in the pool.
    */
    function deposit(uint256 amount) external isInitialized() {
        // Transfering tokens to the LendingPool
        tokenTransferFrom(msg.sender, amount);

        // Mint ZDAI tokens
        zdaiMint(msg.sender, amount);

        // Notify ZDAI tokens were minted
        lenders.zDaiMinted(msg.sender, amount);

        // Emit event
        emit TokenDeposited(msg.sender, amount);
    }

    /**
        @notice It allows any zDAI holder to burn their zDAI tokens and withdraw their tokens.
        @param amount of tokens to withdraw.
     */
    function withdraw(uint256 amount) external isInitialized() {
        // Burn ZDAI tokens.
        zdai.burn(msg.sender, amount);

        // Notify ZDAI tokens were burnt
        lenders.zDaiBurnt(msg.sender, amount);

        // Transfers tokens
        tokenTransfer(msg.sender, amount);

        // Emit event.
        emit TokenWithdrawn(msg.sender, amount);
    }

    /**
        @notice It allows a borrower repaying their loan. 
        @dev This function can be called ONLY by the Loans contract.
        @dev It requires a ERC20.approve call before calling it.
        @dev It throws a require error if borrower called ERC20.approve function before calling it.
        @param amount of tokens.
        @param borrower address that is repaying the loan.
     */
    function repay(uint256 amount, address borrower) external isInitialized() isLoan() {
        // Transfers tokens to LendingPool.
        tokenTransferFrom(borrower, amount);

        // Emits event.
        emit TokenRepaid(borrower, amount);
    }

    /**
        @notice Once a loan is liquidated, it transfers the amount in tokens to the liquidator address.
        @param amount of tokens to liquidate.
        @param liquidator address to receive the tokens.
     */
    function liquidationPayment(uint256 amount, address liquidator)
        external
        isInitialized()
        isLoan()
    {
        // Transfers tokens to the liquidator.
        tokenTransfer(liquidator, amount);

        // Emits event
        emit PaymentLiquidated(liquidator, amount);
    }

    /**
        @notice Once the loan is created, it transfers the amount of tokens to the borrower.

        @param amount of tokens to transfer.
        @param borrower address which will receive the tokens.
        @dev This function only can be invoked by the LoansInterface implementation.
     */
    function createLoan(uint256 amount, address borrower)
        external
        isInitialized()
        isLoan()
    {
        // Transfer tokens to the borrower.
        tokenTransfer(borrower, amount);
    }

    function withdrawInterest(uint256 amount) external isInitialized() {}

    /** Internal functions */

    /** Private functions */

    /**
        @notice It transfers an amount of tokens to a specific address.
        @param recipient address which will receive the tokens.
        @param amount of tokens to transfer.
        @dev It throws a require error if 'transfer' invocation fails.
     */
    function tokenTransfer(address recipient, uint256 amount) private {
        bool transferResult = token.transfer(recipient, amount);
        require(transferResult, "Transfer was not successful.");
    }

    /**
        @notice It transfers an amount of tokens from an address to this contract.
        @param from address where the tokens will transfer from.
        @param amount to be transferred.
        @dev It throws a require error if 'transferFrom' invocation fails.
     */
    function tokenTransferFrom(address from, uint256 amount) private {
        bool transferFromResult = token.transferFrom(from, address(this), amount);
        require(transferFromResult, "TransferFrom wasn't successful.");
    }

    /**
        @notice It mints ZDAI tokens, and send them to a specific address.
        @param to address which will receive the minted tokens.
        @param amount to be minted.
        @dev This contract must has a Minter Role in ZDAI (mintable) token.
        @dev It throws a require error if mint invocation fails.
     */
    function zdaiMint(address to, uint256 amount) private {
        bool mintResult = zdai.mint(to, amount);
        require(mintResult, "Mint was not successful.");
    }
}
