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
import "../interfaces/LoansInterface.sol";
import "../interfaces/ZDAIInterface.sol";

// Contracts
import "./Initializable.sol";


contract DAIPool is DAIPoolInterface, Initializable {
    using AddressLib for address;

    /* State Variables */

    IERC20 public dai;

    ZDAIInterface public zdai;

    LenderInfoInterface public lenderInfo;

    LoansInterface public loanInfo;

    /** Modifiers */

    /* Constructor */

    /** External Functions */

    function initialize(
        address zdaiAddress,
        address daiAddress,
        address lenderInfoAddress,
        address loanInfoAddress
    ) external isNotInitialized() {
        zdaiAddress.requireNotEmpty("ZDai address is required.");
        daiAddress.requireNotEmpty("DAI address is required.");
        lenderInfoAddress.requireNotEmpty("LenderInfo address is required.");
        loanInfoAddress.requireNotEmpty("LoanInfo address is required.");

        initialize();

        zdai = ZDAIInterface(zdaiAddress);
        dai = IERC20(daiAddress);
        lenderInfo = LenderInfoInterface(lenderInfoAddress);
        loanInfo = LoansInterface(loanInfoAddress);
    }

    /**
        @notice It allows users to deposit DAIs into the pool.
        @dev the user must call DAI.approve function previously.
        @param amount of DAIs to deposit in the pool.
    */
    function depositDai(uint256 amount) external isInitialized() {
        // Require DAI approval from sender to this contract.
        requireDAIAllowance(msg.sender, amount);

        // Transfering DAI tokens to DAIPool
        daiTransferFrom(msg.sender, amount);

        // Mint ZDAI tokens
        zdaiMint(msg.sender, amount);

        // Notify ZDAI tokens were minted
        lenderInfo.zDaiMinted(msg.sender, amount);

        // Emit event
        emit DaiDeposited(msg.sender, amount);
    }

    function withdrawDai(uint256 amount) external {}

    function repayDai(uint256 amount, address borrower) external {}

    function liquidationPayment(uint256 amount, address liquidator) external {}

    function createLoan(uint256 amount, address borrower) external returns (bool) {}

    function withdrawInterest(uint256 amount) external {}

    /** Internal functions */

    /** Private functions */

    /**

     */
    function requireDAIAllowance(address owner, uint256 amount) private view {
        uint256 allowanceResult = dai.allowance(owner, address(this));
        require(allowanceResult >= amount, "Not enough tokens allowed.");
    }

    /**
        @notice It transfers an amount of DAI tokens from an address to this contract.
        @param from address where the DAI tokens will transfer from.
        @param amount to be transferred.
        @dev It throws a require error if 'transferFrom' invocation fails.
     */
    function daiTransferFrom(address from, uint256 amount) private {
        bool transferFromResult = dai.transferFrom(from, address(this), amount);
        require(transferFromResult, "Transfer from was not successful.");
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
