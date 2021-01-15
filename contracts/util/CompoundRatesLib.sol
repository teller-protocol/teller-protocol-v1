pragma solidity 0.5.17;

// Interfaces
import "../providers/compound/CErc20Interface.sol";

// Contracts
import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/ERC20Detailed.sol";

library CompoundRatesLib {
    function exchangeRateDecimals() public pure returns (uint8) {
        return 18;
    }

    function valueInUnderlying(CErc20Interface cToken, uint256 cTokenAmount)
        internal
        view
        returns (uint256)
    {
        return
            (cTokenAmount * cToken.exchangeRateStored()) /
            (uint256(10)**uint256(exchangeRateDecimals()));
    }
}
