// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../../../shared/interfaces/ICErc20.sol";
import "../../../shared/libraries/NumbersLib.sol";
import "../../../settings/asset/MaxLoanAmountLib.sol";
import "../../../settings/asset/MaxDebtRatioLib.sol";
import "../../../contexts/ticketed/Ticketed.sol";
import "../storage.sol" as Storage;

contract Rebalance is Ticketed {
    using NumbersLib for uint256;

    address public immutable lendingToken;
    address public immutable tToken;
    address public immutable cToken;
    address public immutable chainlinkAggregator;

    function() internal pure returns (Storage.Store storage) constant S = Storage.store;

    constructor(
        address _lendingToken,
        address _tToken,
        address _cToken,
        address _chainlinkAggregator
    ) {
        lendingToken = _lendingToken;
        tToken = _tToken;
        cToken = _cToken;
        chainlinkAggregator = _chainlinkAggregator;
    }

    /**
        Called by community members, third party developers, etc. to rebalance
        the amount of capital allocated to the investment strategy (compound) vs. 
        sitting idle in the pool. Just looks at the maximum debt ratio and tries to
        keep that amount at most on the balance of the lending pool.
        This uses a ticketing system where users are rewarded semi-cheap "tickets"
        for doing this action. The idea is to reward holders of pattern matching
        tickets together. Tickets can be traded, it's fully up to the owner.
        Rewards should be proportional to how much impact a given call had. This would
        be measured by how much interest is accrued as part of the call and the size of
        the rebalancing which happened. Alternatively we can pay a flat amount of the
        interest accrued to the caller.
    */
    function rebalance()
        external
        ticketed(ticketId(), msg.sender)
    {
        ICErc20 _cToken = ICErc20(cToken);
        _cToken.accrueInterest();
        uint256 maxLoanAmount = MaxLoanAmountLib.get(lendingToken);
        uint256 maxDebtRatio = MaxDebtRatioLib.get(lendingToken);

        uint256 _localUnderlyingSupply =
            IERC20(lendingToken).balanceOf(address(this));
        uint256 _compoundUnderlyingSupply =
            // TODO: don't store the value here as well? Maybe compound just does
            // sometimes and not always.
            S().cToken.balanceOfUnderlying(address(this));
        uint256 _totalUnderlyingSupply =
            _localUnderlyingSupply + _compoundUnderlyingSupply;

        // We are missing some funds in address(this), wouldn't be able to cover
        // max loan capacity. Therefore we withdraw from compound.
        if (
            _totalUnderlyingSupply.ratioOf(_localUnderlyingSupply) <
            maxDebtRatio
        ) {
            uint256 amountToWithdraw =
                (maxDebtRatio * _totalUnderlyingSupply) /
                    10000 -
                    _localUnderlyingSupply;
            S().cToken.redeemUnderlying(amountToWithdraw);
            return;
        }
        // Otherwise, we have more than max debt in address(this), e.g. from lots
        // of repayments. So we mint cTokens (deposit into compound) unless it would
        // leave us with less than maxLoan left.
        else {
            uint256 amountToDeposit =
                _localUnderlyingSupply -
                    ((maxDebtRatio * _totalUnderlyingSupply) / 10000);
            if (_localUnderlyingSupply - amountToDeposit > maxLoanAmount) {
                S().cToken.mint(amountToDeposit);
                return;
            }
        }

        // We don't want to ticket this call.
        revert("Invalid call");
    }



    function ticketId() internal view returns (bytes32 id) {
        bytes memory data = bytes.concat(msg.data[:4], bytes20(uint160(tx.gasprice << 80)), bytes8(uint64(block.number)));
        assembly {
            id := mload(add(data, 0x20))
        }
        
    }


}
