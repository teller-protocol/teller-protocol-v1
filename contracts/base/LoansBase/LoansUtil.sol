pragma solidity 0.5.17;
pragma experimental ABIEncoderV2;

// Libraries
import "@openzeppelin/contracts-ethereum-package/contracts/math/SafeMath.sol";

// Smart Contracts
import "../BaseUpgradeable.sol";

// Interfaces
import "./LoansUtilInterface.sol";

/*****************************************************************************************************/
/**                                             WARNING                                             **/
/**                              THIS CONTRACT IS AN UPGRADEABLE BASE!                              **/
/**  ---------------------------------------------------------------------------------------------  **/
/**  Do NOT change the order of, PREPEND, or APPEND any storage variables to this or new versions   **/
/**  of this contract as this will cause a ripple affect to the storage slots of all child          **/
/**  contracts that inherit from this contract to be overwritten on the deployed proxy contract!!   **/
/**                                                                                                 **/
/**  Visit https://docs.openzeppelin.com/upgrades/2.6/proxies#upgrading-via-the-proxy-pattern for   **/
/**  more information.                                                                              **/
/*****************************************************************************************************/
/**
    @notice This contract is used as a basis for the creation of the different types of loans across the platform
    @notice It implements the Base contract from Teller and the LoansInterface

    @author develop@teller.finance
 */

contract LoansUtil is BaseUpgradeable, LoansUtilInterface {
    using SafeMath for uint256;

    /**
        @notice Checks whether a loan is allowed to be deposited to an Externally Owned Account.
        @param collateralRatio Collateral ratio required by loan.
        @return bool indicating whether the loan with specified parameters can be deposited to an EOA.
     */
    function canLoanGoToEOA(uint256 collateralRatio) external view returns (bool) {
        uint256 overCollateralizedBuffer = settings().getPlatformSettingValue(
            settings().consts().OVER_COLLATERALIZED_BUFFER_SETTING()
        );
        uint256 collateralBuffer = settings().getPlatformSettingValue(
            settings().consts().COLLATERAL_BUFFER_SETTING()
        );
        uint256 liquidationReward = settings().consts().ONE_HUNDRED_PERCENT().sub(
            settings().getPlatformSettingValue(
                settings().consts().LIQUIDATE_ETH_PRICE_SETTING()
            )
        );

        return
            collateralRatio >=
            overCollateralizedBuffer.add(collateralBuffer).add(liquidationReward);
    }
}
