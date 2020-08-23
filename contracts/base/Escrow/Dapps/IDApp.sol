pragma solidity 0.5.17;

/*****************************************************************************************************/
/**                                             WARNING                                             **/
/**                      DAPP CONTRACT IS AN EXTENSION OF THE ESCROW CONTRACT                       **/
/**  ---------------------------------------------------------------------------------------------  **/
/**  Because there are multiple dApp contracts, and they all extend the Escrow contract that is     **/
/**  itself upgradeable, they cannot have their own storage variables as they would cause the the   **/
/**  storage slots to be overwritten on the Escrow proxy contract!                                  **/
/**                                                                                                 **/
/**  Visit https://docs.openzeppelin.com/upgrades/2.6/proxies#upgrading-via-the-proxy-pattern for   **/
/**  more information.                                                                              **/
/*****************************************************************************************************/
interface IDApp {
    /**
        @notice This event is emitted when canonical WETH address is updated.
        @param sender message sender address.
        @param previousWeth previous WETH address.
        @param newWethAddress new WETH address.
     */
    event WethAddressUpdated(
        address sender,
        address indexed previousWeth,
        address newWethAddress
    );
}
