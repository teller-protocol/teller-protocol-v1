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
pragma experimental ABIEncoderV2;

// Contracts
import "../base/Base.sol";

// Libraries
import "../util/AddressLib.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";

// Interfaces
import "../interfaces/LendersInterface.sol";
import "../interfaces/ZTokenInterface.sol";
import "../interfaces/InterestConsensusInterface.sol";


contract Lenders is Base, LendersInterface {
    using AddressLib for address;
    using SafeMath for uint256;

    /* State Variables */

    address public lendingPool;
    InterestConsensusInterface public interestConsensus;

    address public zToken;

    // The total interest that has not yet been withdrawn by a lender
    mapping(address => ZeroCollateralCommon.AccruedInterest) public accruedInterest;

    /** Modifiers */
    modifier isZToken() {
        require(_areAddressesEqual(zToken, msg.sender), "SENDER_ISNT_ZTOKEN");
        _;
    }

    modifier isLendingPool() {
        require(_areAddressesEqual(lendingPool, msg.sender), "SENDER_ISNT_LENDING_POOL");
        _;
    }

    modifier isValid(address anAddress) {
        anAddress.requireNotEmpty("ADDRESS_IS_REQUIRED");
        _;
    }

    /* Constructor */

    /** External Functions */

    function initialize(
        address zTokenAddress,
        address lendingPoolAddress,
        address interestConsensusAddress,
        address settingAddress
    ) external isNotInitialized() {
        zTokenAddress.requireNotEmpty("ZTOKEN_MUST_BE_PROVIDED");
        lendingPoolAddress.requireNotEmpty("LENDING_POOL_MUST_BE_PROVIDED");
        interestConsensusAddress.requireNotEmpty("CONSENSUS_MUST_BE_PROVIDED");

        _initialize(settingAddress);

        zToken = zTokenAddress;
        lendingPool = lendingPoolAddress;
        interestConsensus = InterestConsensusInterface(interestConsensusAddress);
    }

    function setAccruedInterest(
        ZeroCollateralCommon.InterestRequest calldata request,
        ZeroCollateralCommon.InterestResponse[] calldata responses
    ) external isInitialized() whenNotPaused() whenLendingPoolNotPaused(lendingPool) {
        require(
            accruedInterest[request.lender].timeLastAccrued == request.startTime,
            "GAP_IN_INTEREST_ACCRUAL"
        );
        require(request.endTime > request.startTime, "INVALID_INTERVAL");
        require(request.requestTime >= request.endTime, "INVALID_REQUEST");

        uint256 amount = interestConsensus.processRequest(request, responses);

        accruedInterest[request.lender].totalAccruedInterest = accruedInterest[request
            .lender]
            .totalAccruedInterest
            .add(amount);

        accruedInterest[request.lender].totalNotWithdrawn = accruedInterest[request
            .lender]
            .totalNotWithdrawn
            .add(amount);

        accruedInterest[request.lender].timeLastAccrued = request.endTime;

        emit AccruedInterestUpdated(
            request.lender,
            accruedInterest[request.lender].totalNotWithdrawn,
            accruedInterest[request.lender].totalAccruedInterest
        );
    }

    function withdrawInterest(address recipient, uint256 amount)
        external
        isLendingPool()
        isValid(recipient)
        isInitialized()
        returns (uint256)
    {
        uint256 amountToWithdraw = amount;
        uint256 withdrawableInterest = accruedInterest[recipient].totalNotWithdrawn;

        if (withdrawableInterest == 0 || amountToWithdraw == 0) return 0;

        if (withdrawableInterest < amountToWithdraw) {
            amountToWithdraw = withdrawableInterest;
        }

        accruedInterest[recipient].totalNotWithdrawn = withdrawableInterest.sub(
            amountToWithdraw
        );

        emit AccruedInterestWithdrawn(recipient, amountToWithdraw);

        return amountToWithdraw;
    }

    /** Internal Functions */

    function _areAddressesEqual(address leftAddress, address rightAddress)
        internal
        view
        returns (bool)
    {
        this; // silence state mutability warning without generating bytecode - see https://github.com/ethereum/solidity/issues/2691
        return leftAddress.isEqualTo(rightAddress);
    }

    /** Private Functions */
}
