pragma solidity 0.5.17;

// Interfaces
import "../providers/compound/CErc20Interface.sol";

// Contracts
import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/ERC20Detailed.sol";

library CompoundRatesLib {
    function EXCHANGE_RATE_DECIMALS() public pure returns (uint8) {
        return 18;
    }

    function valueInUnderlying(CErc20Interface cToken, uint256 cTokenAmount)
        internal
        view
        returns (uint256)
    {
        return
            (cTokenAmount * cToken.exchangeRateStored()) /
            (uint256(10)**uint256(EXCHANGE_RATE_DECIMALS()));
    }

    function valueOfUnderlying(CErc20Interface cToken, uint256 underlyingAmount)
        internal
        view
        returns (uint256)
    {
        return
            (underlyingAmount * uint256(10)**uint256(EXCHANGE_RATE_DECIMALS())) /
            cToken.exchangeRateStored();
    }
}
