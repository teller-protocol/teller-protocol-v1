// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Contracts
import "./Base.sol";

// Libraries
import "@openzeppelin/contracts/utils/Address.sol";

// Interfaces
import "../interfaces/loans/ILoanManager.sol";
import "../interfaces/IDappRegistry.sol";

// Commons
import "../util/AddressLib.sol";
import "../util/AddressArrayLib.sol";

/*****************************************************************************************************/
/**                                             WARNING                                             **/
/**                                  THIS CONTRACT IS UPGRADEABLE!                                  **/
/**  ---------------------------------------------------------------------------------------------  **/
/**  Do NOT change the order of or PREPEND any storage variables to this or new versions of this    **/
/**  contract as this will cause the the storage slots to be overwritten on the proxy contract!!    **/
/**                                                                                                 **/
/**  Visit https://docs.openzeppelin.com/upgrades/2.6/proxies#upgrading-via-the-proxy-pattern for   **/
/**  more information.                                                                              **/
/*****************************************************************************************************/
/**
    @notice This contract is used as a factory for the escrow contract that will be owned by the borrowers.

    @author develop@teller.finance
 */
contract DappRegistry is IDappRegistry, Base {
    using AddressArrayLib for AddressArrayLib.AddressArray;
    using AddressLib for address;
    using Address for address;

    /* State Variables */

    /**
        @dev It holds the Dapp's configuration.
     */
    mapping(address => TellerCommon.Dapp) private _dapps;

    /**
     *  @dev It contains all the dapps added in this factory.
     */
    AddressArrayLib.AddressArray internal dappsList;

    /* Modifiers */

    /* External Functions */

    function dapps(address dapp)
        public
        view
        override
        returns (TellerCommon.Dapp memory)
    {
        return _dapps[dapp];
    }

    /**
        @notice It adds a new dapp to the factory.
        @param dapp address to add in this factory.
        @param unsecured boolean to describe in the dapp is allowed to be used with unsecured loans.
     */
    function addDapp(address dapp, bool unsecured)
        external
        override
        onlyPauser
    {
        require(dapp.isContract(), "DAPP_ISNT_A_CONTRACT");
        require(!_isDapp(dapp), "DAPP_ALREADY_EXIST");

        _dapps[dapp] = TellerCommon.Dapp({
            exists: true,
            unsecured: unsecured
        });
        dappsList.add(dapp);

        emit NewDappAdded(msg.sender, dapp, unsecured);
    }

    /**
        @notice It updates a dapp configuration.
        @param dapp address to add in this factory.
        @param unsecured boolean that describes if the dapp can be used by with an unsecured loan.
     */
    function updateDapp(address dapp, bool unsecured)
        external
        override
        onlyPauser
    {
        require(_isDapp(dapp), "DAPP_NOT_EXIST");

        _dapps[dapp].unsecured = unsecured;

        emit DappUpdated(msg.sender, dapp, unsecured);
    }

    /**
        @notice It removes a current dapp from the factory.
        @param dapp address to remove.
     */
    function removeDapp(address dapp) external override onlyPauser {
        require(dapp.isContract(), "DAPP_ISNT_A_CONTRACT");
        require(_isDapp(dapp), "DAPP_NOT_EXIST");

        _dapps[dapp].exists = false;
        dappsList.remove(dapp);

        emit DappRemoved(msg.sender, dapp);
    }

    /**
        @notice Gets all the dapps in the factory.
        @return an array of dapps (addresses).
     */
    function getDapps() external view override returns (address[] memory) {
        return dappsList.array;
    }

    /**
        @notice It initializes this escrow contract factory instance.
     */
    function initialize() external override {
        _initialize(msg.sender);
    }

    /** Internal Functions */

    /**
        @notice It tests whether an address is a dapp or not.
        @param dapp address to test.
        @return true if the address is a dapp. Otherwise it returns false.
     */
    function _isDapp(address dapp) internal view returns (bool) {
        return _dapps[dapp].exists;
    }
}
