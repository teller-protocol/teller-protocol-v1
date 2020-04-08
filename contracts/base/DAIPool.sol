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
import "../interfaces/DAIPoolInterface.sol";
import "../interfaces/LenderInfoInterface.sol";
import "../interfaces/ZDAIInterface.sol";

// Contracts
import "./Initializable.sol";


/**
    @notice The DAIPool contract holds all of the DAI that lenders transfer into the protocol. It is the contract that lenders interact with to deposit and withdraw DAI including interest. The DAIPool interacts with the LenderInformation contract to ensure DAI balances and interest owed is kept up to date.
 */
contract DAIPool is DAIPoolInterface, Initializable {
    using AddressLib for address;

    /* State Variables */

    IERC20 public dai;

    ZDAIInterface public zdai;

    LenderInfoInterface public lenderInfo;

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
        @param daiAddress DAI token address.
        @param lenderInfoAddress LenderInfo contract address.
        @param loansAddress Loans contract address.
        @dev It throws a require error if the contract is already initialized.
     */
    function initialize(
        address zdaiAddress,
        address daiAddress,
        address lenderInfoAddress,
        address loansAddress
    ) external isNotInitialized() {
        zdaiAddress.requireNotEmpty("ZDai address is required.");
        daiAddress.requireNotEmpty("DAI address is required.");
        lenderInfoAddress.requireNotEmpty("LenderInfo address is required.");
        loansAddress.requireNotEmpty("Loans address is required.");

        initialize();

        zdai = ZDAIInterface(zdaiAddress);
        dai = IERC20(daiAddress);
        lenderInfo = LenderInfoInterface(lenderInfoAddress);
        loans = loansAddress;
    }

    /**
        @notice It allows users to deposit DAIs into the pool.
        @dev the user must call DAI.approve function previously.
        @param amount of DAIs to deposit in the pool.
    */
    function depositDai(uint256 amount) external isInitialized() {
        // Transfering DAI tokens to DAIPool
        daiTransferFrom(msg.sender, amount);

        // Mint ZDAI tokens
        zdaiMint(msg.sender, amount);

        // Notify ZDAI tokens were minted
        lenderInfo.zDaiMinted(msg.sender, amount);

        // Emit event
        emit DaiDeposited(msg.sender, amount);
    }

    /**
        @notice It allows any zDAI holder to burn their zDAI tokens and withdraw their DAIs.
        @param amount of DAI tokens to withdraw.
     */
    function withdrawDai(uint256 amount) external isInitialized() {
        // Burn ZDAI tokens.
        zdai.burn(amount);

        // Notify ZDAI tokens were burnt/
        lenderInfo.zDaiBurnt(msg.sender, amount);

        // Transfers DAI tokens
        daiTransfer(msg.sender, amount);

        // Emit event.
        emit DaiWithdrawn(msg.sender, amount);
    }

    /**
        @notice It allows a borrower repaying their loan. 
        @dev This function can be called ONLY by the Loans contract.
        @dev It requires a DAI.approve call before calling it.
        @dev It throws a require error if borrower called DAI.approve function before calling it.
        @param amount in DAI tokens.
        @param borrower address that is repaying the loan.
     */
    function repayDai(uint256 amount, address borrower)
        external
        isInitialized()
        isLoan()
    {
        // Transfers DAI tokens to DAIPool.
        daiTransferFrom(borrower, amount);

        // Emits event.
        emit DaiRepaid(borrower, amount);
    }

    /**
        @notice Once a loan is liquidated, it transfers the amount in DAI tokens to the liquidator address.
        @param amount in DAI tokens to liquidate.
        @param liquidator address to receive the tokens.
     */
    function liquidationPayment(uint256 amount, address liquidator)
        external
        isInitialized()
        isLoan()
    {
        // Transfers DAIs to the liquidator.
        daiTransfer(liquidator, amount);

        // Emits event
        emit PaymentLiquidated(liquidator, amount);
    }

    /**
        @notice Once the loan is created, it transfers the amount of DAIs to the borrower.

        @param amount of DAI tokens to transfer.
        @param borrower address which will receive the DAI tokens.
        @dev This function only can be invoked by the LoansInterface implementation.
     */
    function createLoan(uint256 amount, address borrower)
        external
        isInitialized()
        isLoan()
    {
        // Transfer DAIs to the borrower.
        daiTransfer(borrower, amount);
    }

    function withdrawInterest(uint256 amount) external isInitialized() {}

    /** Internal functions */

    /** Private functions */

    /**
        @notice It transfers an amount of DAI tokens to a specific address.
        @param recipient address which will receive the DAI tokens.
        @param amount of tokens to transfer.
        @dev It throws a require error if 'transfer' invocation fails.
     */
    function daiTransfer(address recipient, uint256 amount) private {
        bool transferResult = dai.transfer(recipient, amount);
        require(transferResult, "Transfer was not successful.");
    }

    /**
        @notice It transfers an amount of DAI tokens from an address to this contract.
        @param from address where the DAI tokens will transfer from.
        @param amount to be transferred.
        @dev It throws a require error if 'transferFrom' invocation fails.
     */
    function daiTransferFrom(address from, uint256 amount) private {
        bool transferFromResult = dai.transferFrom(from, address(this), amount);
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
