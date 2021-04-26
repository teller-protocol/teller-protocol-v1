// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../../../../shared/interfaces/ICErc20.sol";
import "../../abstract/AStrategy.sol";
import "./Storage.sol" as Storage;
import "../../Storage.sol" as TTokenStorage;
import "../../../../settings/asset/MaxDebtRatioLib.sol";
import "../../../../settings/asset/MaxLoanAmountLib.sol";
import "../../../../shared/libraries/NumbersLib.sol";
import "../../../../contexts2/Initializable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract CompoundStrategy is AStrategy, Initializable {
    using NumbersLib for uint256;
    using SafeERC20 for ERC20;

    address private immutable TELLER;

    constructor(address teller) {
        TELLER = teller;
    }

    function() pure returns (Storage.Store storage) private constant S =
        Storage.store;

    function() pure returns (TTokenStorage.Store storage)
        private constant TTokenStore = TTokenStorage.store;

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override
        returns (bool)
    {
        return
            interfaceId == type(IStrategy).interfaceId ||
            interfaceId == this.strategize.selector ||
            super.supportsInterface(interfaceId);
    }

    function initialize(ICErc20 cToken) external initializer {
        S().cToken = cToken;
    }

    /**
        If there is too much balance of underlying in address(this), deposit
        some into compound.
        The threshold is set to max debt ratio because funds over this percentage
        are guaranteed to not be lendable.
     */
    function rebalance() public {
        uint256 localSupply = _localSupply();
        uint256 remoteSupply = _remoteSupply();
        uint256 totalSupply = localSupply + remoteSupply;
        uint256 localSupplyRatio = localSupply.ratioOf(totalSupply);
        uint256 remoteSupplyRatio = remoteSupply.ratioOf(totalSupply);
        uint256 currentDebtRatio = _getDebtRatioFor(0);
        uint256 maxLoanAmount = _getMaxLoanAmount();

        // If we have too much local, deposit into compound
        // Too much local would be
        // if (localOverRemoteSupply > desiredRatioLocal && currentDebtRatio < ) {
        //     // We should withdraw from compound
        // }
    }

    /**
        Reward caller with a ticket for detecting lack of being able to fund
        a withdrawal which is smaller than the max loan amount and wouldn't
        exceed the max debt ratio.
     */
    function resupply() public ticketed() {
        uint256 amountToWithdraw = _maxLoanAmount();
        if (_exceedsMaxDebt(amountToWithdraw)) {}
        // amountToWithdraw = require( // Don't resupply
        //     !_exceedsMaxDebt(maxLoanAmount),
        //     "FUNDED"
        // );

        require(!_enoughLocalFunds(amount), "FUNDED");
        require(!_exceedsMaxDebt(amount), "DEBT");

        uint256 percentWithdrawalAmount = _totalSupply().percent(1000);

        if (maxLoanAmount > percentWithdrawalAmount) {
            if (maxLoanAmount)
                if (_enoughRemoteFunds(maxLoanAmount * 2)) {
                    // Withdraw maxLoanAmount * 2 to prevent having to withdraw
                    // again on the next transaction.
                    amountToWithdraw = maxLoanAmount * 2;
                } else {
                    // Withdraw remaining funds in compound.
                    amountToWithdraw = _remoteSupply();
                }
        } else {
            if (_enoughLocalFunds(percentWithdrawalAmount)) {
                // Withdraw 10% of totalSupply from compound.
                amountToWithdraw = percentWithdrawalAmount;
            } else {
                // Withdraw remaining funds in compound.
                amountToWithdraw = _remoteSupply();
            }
        }

        _withdrawFromCompound(amountToWithdraw);
    }

    /**
        Needs to be accrued to get correct totalSupplyUnderlying.
     */
    function beforeDeposit() external override {
        _accrueInterest();
    }

    /**
        Do nothing because it's just not worth depositing to Compound on
        most transactions. Leave that for a direct call through strategize()
        instead of a hook.
     */
    function afterDeposit() external override {
        return;
    }

    /**
        Revert if there aren't enough funds. This should bubble to TToken which
        should exit the call.
        We don't want to withdraw from compound here implicitly due to gas cost
        estimation variance leading to bad UX.
        We have a separate function which users can call to get rewarded for
        detecting the need to rebalance.
     */
    function beforeWithdraw(uint256 amount) external override {
        require(_enoughLocalFunds(amount), "LACK_LOCAL_FUNDS");
    }

    function _strategize(bytes4 sig, bytes memory data)
        internal
        override
        returns (bytes memory output)
    {
        if (sig == this.rebalance.selector) {
            rebalance();
            return "";
        } else if (sig == this.checkWithdraw.selector) {
            checkWithdraw(abi.decode(data, (uint256)));
        } else revert("");
    }

    function _depositToCompound(uint256 amount) private {
        TTokenStore().underlying.safeApprove(address(cToken), amount);
        S().cToken.mint(amount);
    }

    function _withdrawFromCompound(uint256 amount) private {
        S().cToken.redeemUnderlying(amount);
    }

    function _accrueInterest() private {
        S().cToken.accrueInterest();
    }

    function _getDebtRatioFor(uint256 amount) private view returns (uint256) {
        uint256 totalSupply = _totalSupply();
        (, uint256 totalBorrowed, uint256 totalRepaid, ) = _getMarketState();
        uint256 newOnLoanAmount = totalBorrowed - totalRepaid + amount;
        return newOnLoanAmount.ratioOf(totalSupply);
    }

    function _exceedsMaxDebt(uint256 amount) private view returns (bool) {
        return _getDebtRatioFor(amount) > _maxDebtRatio();
    }

    function _enoughLocalFunds(uint256 amount) private view returns (bool) {
        return _localSupply() >= amount;
    }

    function _localSupply() private view returns (uint256) {
        return TTokenStore().underlying.balanceOf(address(this));
    }

    function _remoteSupply() private view returns (uint256) {
        return S().cToken.balanceOfUnderlying(address(this));
    }

    function _totalBalance() private returns (uint256) {
        _localSupply() + _remoteSupply();
    }

    function _maxDebtRatio() private view returns (uint256) {
        return MaxDebtRatioLib.get(address(TTokenStore().underlying));
    }

    function _maxLoanAmount() private view returns (uint256) {
        return MaxLoanAmountLib.get(address(TTokenStore().underlying));
    }

    function _getMarketState()
        private
        view
        returns (
            uint256 totalSupplied,
            uint256 totalBorrowed,
            uint256 totalRepaid,
            uint256 totalOnLoan
        )
    {
        return ILendingPool(TELLER).getMarketState(TTokenStore().underlying);
    }
}
