// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Contracts
import "../../protocol/internal/roles.sol";
import "../../../contexts/access-control/modifiers/authorized.sol";
import "../storage/dapp-registry.sol";
import { int_DappRegistry } from "../internal/dapp-registry.sol";

// Libraries
import "@openzeppelin/contracts/utils/Address.sol";

abstract contract fct_DappRegistry_v1 is
    Roles,
    mod_authorized_AccessControl_v1,
    sto_DappRegistry,
    int_DappRegistry
{
    using Address for address;
    using AddressArrayLib for AddressArrayLib.AddressArray;

    /* Events */

    /**
     * @notice This event is emitted when a new dapp is added to the factory.
     * @param sender address.
     * @param dapp address added to the factory.
     * @param unsecured boolean that describes if the dapp can be used by with an unsecured loan.
     */
    event NewDappAdded(
        address indexed sender,
        address indexed dapp,
        bool unsecured
    );

    /**
     * @notice This event is emitted when a dapp is updated.
     * @param sender address.
     * @param dapp address of dapp contract.
     * @param unsecured boolean that describes if the dapp can be used by with an unsecured loan.
     */
    event DappUpdated(
        address indexed sender,
        address indexed dapp,
        bool unsecured
    );

    /**
     * @notice This event is emitted when a current dapp is removed from the factory.
     * @param sender address.
     * @param dapp address removed from the factory.
     */
    event DappRemoved(address indexed sender, address indexed dapp);

    /* Functions */

    /**
     * @notice It adds a new dapp to the factory.
     * @param dapp address to add in this factory.
     * @param unsecured boolean to describe in the dapp is allowed to be used with unsecured loans.
     */
    function addDapp(address dapp, bool unsecured)
        external
        authorized(ADMIN, msg.sender)
    {
        require(dapp.isContract(), "Teller: dapp not a contract");
        require(!_isDapp(dapp), "Teller: dapp already exists");

        dappStore().dapps[dapp] = Dapp({ exists: true, unsecured: unsecured });
        dappStore().list.add(dapp);

        emit NewDappAdded(msg.sender, dapp, unsecured);
    }

    /**
     * @notice It updates a dapp configuration.
     * @param dapp address to add in this factory.
     * @param unsecured boolean that describes if the dapp can be used by with an unsecured loan.
     */
    function updateDapp(address dapp, bool unsecured)
        external
        authorized(ADMIN, msg.sender)
    {
        require(_isDapp(dapp), "Teller: dapp does not exist");

        dappStore().dapps[dapp].unsecured = unsecured;

        emit DappUpdated(msg.sender, dapp, unsecured);
    }

    /**
     * @notice It removes a current dapp from the factory.
     * @param dapp address to remove.
     */
    function removeDapp(address dapp) external authorized(ADMIN, msg.sender) {
        require(dapp.isContract(), "Teller: dapp is not a contract");
        require(_isDapp(dapp), "Teller: dapp does not exist");

        delete dappStore().dapps[dapp];
        dappStore().list.remove(dapp);

        emit DappRemoved(msg.sender, dapp);
    }
}
