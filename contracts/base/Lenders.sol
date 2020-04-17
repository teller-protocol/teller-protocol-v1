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
import "openzeppelin-solidity/contracts/math/SafeMath.sol";

// Commons
import "../util/ZeroCollateralCommon.sol";

// Interfaces
import "../interfaces/LendersInterface.sol";
import "../interfaces/ZTokenInterface.sol";


contract Lenders is LendersInterface {
    using AddressLib for address;
    using SafeMath for uint256;

    /* State Variables */

    address public lendingPool;
    address public interestConsensus;

    ZTokenInterface public zToken;

    // The total interest that has not yet been withdrawn by a lender
    mapping(address => ZeroCollateralCommon.AccruedInterest) public accruedInterest;

    // The block number at which an address requested an interest update.
    // If the interest has been updated, this reverts to 0.
    mapping(address => uint256) public requestedInterestUpdate;

    /** Modifiers */
    modifier isZToken() {
        require(
            _areAddressesEqual(address(zToken), msg.sender),
            "Address has no permissions."
        );
        _;
    }

    modifier isLendingPool() {
        require(
            _areAddressesEqual(lendingPool, msg.sender),
            "Address has no permissions."
        );
        _;
    }

    modifier isConsensus() {
        require(
            _areAddressesEqual(interestConsensus, msg.sender),
            "Address has no permissions."
        );
        _;
    }

    modifier isValid(address anAddress) {
        anAddress.requireNotEmpty("Address is required.");
        _;
    }

    /* Constructor */

    constructor(
        address zTokenAddress,
        address lendingPoolAddress,
        address interestConsensusAddress
    ) public {
        require(zTokenAddress != address(0x0), "zToken address is required.");
        require(lendingPoolAddress != address(0x0), "LendingPool address is required.");
        require(interestConsensusAddress != address(0x0), "Consensus address is required.");
        zToken = zTokenAddress;
        lendingPool = lendingPoolAddress;
        consensus = interestConsensusAddress;
    }

    /** External Functions */

    function zTokenTransfer(address sender, address, uint256)
        external
        isZDai()
    {
        if (_getZTokenBalanceOf(sender) == 0) {
            _updateAccruedInterestFor(sender);
        }
    }

    function zTokenBurnt(address recipient, uint256) external isLendingPool() {
        // Updating accrued interest for zToken recipient.
        if (_getZTokenBalanceOf(recipient) == 0) {
            _updateAccruedInterestFor(recipient);
        }
    }

    function updateAccruedInterest() external {
        require(_getZTokenBalanceOf(msg.sender) > 0, 'SENDER_IS_NOT_LENDER');

        _updateAccruedInterestFor(msg.sender);
    }

    function setAccruedInterest(
        address lender,
        uint256 endBlock,
        uint256 amount
    )
        external
        isConsensus()
    {
        require(requestedInterestUpdate[lender] == endBlock, 'INCORRECT_END_BLOCK');

        requestedInterestUpdate[lender] = 0;

        accruedInterest[lender].totalAccruedInterest = accruedInterest[lender]
            .totalAccruedInterest
            .add(amount);

        accruedInterest[lender].totalNotWithdrawn = accruedInterest[lender]
            .totalNotWithdrawn
            .add(amount);

        accruedInterest[lender].blockLastAccrued = endBlock;

        emit AccruedInterestUpdated(
            lender,
            accruedInterest[lender].totalNotWithdrawn,
            accruedInterest[lender].totalAccruedInterest
        );
    }

    function withdrawInterest(address recipient, uint256 amount)
        external
        isLendingPool()
        isValid(recipient)
        returns (uint256)
    {
        uint256 amountToWithdraw = amount;
        uint256 withdrawableInterest = accruedInterest[recipient].totalNotWithdrawn;

        if (withdrawableInterest == 0) return 0;

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

    function _updateAccruedInterestFor(address lender) internal {
        if (requestedInterestUpdate[lender] != 0) {
          emit CancelInterestUpdate(lender, requestedInterestUpdate[lender]);
        }

        requestedInterestUpdate[lender] = _getCurrentBlockNumber();

        emit InterestUpdateRequested(lender, _getCurrentBlockNumber());
    }

    function _areAddressesEqual(address leftAddress, address rightAddress)
        internal
        view
        returns (bool)
    {
        this; // silence state mutability warning without generating bytecode - see https://github.com/ethereum/solidity/issues/2691
        return leftAddress.isEqualTo(rightAddress);
    }

    /** Private Functions */

    function _getZTokenBalanceOf(address anAddress) private view returns (uint256) {
        return zToken.balanceOf(anAddress);
    }

    function _getCurrentBlockNumber() private view returns (uint256) {
        return block.number;
    }
}
