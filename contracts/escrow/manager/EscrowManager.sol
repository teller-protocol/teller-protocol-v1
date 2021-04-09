// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./IDestroyable.sol";
import "./EscrowProxy.sol";
import "./EscrowLib.sol";
import "./EscrowLogic.sol";
import "../../contexts2/access-control/roles/RolesMods.sol";
import "../../contexts2/pausable/PausableMods.sol";

contract EscrowManager is RolesMods, PausableMods {
    bool internal upgrading;
    address internal primary;
    address internal secondary;
    bytes internal creationCode;

    function getInitializationCode() external view returns (bytes memory) {
        return
            abi.encodePacked(
                type(EscrowLogic).creationCode,
                abi.encode(address(this))
            );
    }

    function getAssetEscrow(address asset) external view returns (address) {
        return EscrowLib.getAssetEscrow(address(this), asset);
    }

    function initialize(bytes calldata _creationCode) external {
        creationCode = _creationCode;
        primary = EscrowLib.getMetamorphic(address(this), true);
        secondary = EscrowLib.getMetamorphic(address(this), false);

        _deploy(true);
    }

    /**
        Create a backup instance with the new implementation
        and destroy the main one.
     */
    function upgrade1(bytes calldata _creationCode) external {
        require(!upgrading, "662");
        creationCode = _creationCode;
        _deploy(false);
        _destroy(true);
        upgrading = true;
    }

    /**
        Deploy the main one and destroy the backup.
     */
    function upgrade2() external {
        require(upgrading, "221");
        _deploy(true);
        _destroy(false);
        upgrading = false;
    }

    function create(address asset) external returns (address) {
        address existing = EscrowLib.getAssetEscrow(address(this), asset);
        uint256 size;
        assembly {
            size := extcodesize(existing)
        }
        require(size == 0, "208");
        EscrowProxy proxy = new EscrowProxy(); /* primary, secondary */
        return address(proxy);
    }

    function _deploy(bool isPrimary) internal {
        address deployed;
        address expected = EscrowLib.getMetamorphic(address(this), isPrimary);
        bytes memory initCode = EscrowLib.INIT_CODE;
        // console.log(initCode.length);
        bytes32 salt = EscrowLib.getSalt(address(this), isPrimary);
        assembly {
            let encoded_data := add(0x20, initCode) // load initialization code.
            let encoded_size := mload(initCode) // load the init code's length.
            deployed := create2(
                // call CREATE2 with 4 arguments.
                0, // do not forward any endowment.
                encoded_data, // pass in initialization code.
                encoded_size, // pass in init code's length.
                salt // pass in the salt value.
            )
        }
        require(expected == deployed, "778");
    }

    function _destroy(bool isPrimary) internal {
        IDestroyable(EscrowLib.getMetamorphic(address(this), isPrimary))
            .destroy();
    }
}
