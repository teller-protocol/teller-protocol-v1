import "./Beacon.sol";
import "./Proxy.sol";
import "../../contexts2/access-control/roles/RolesMods.sol";
import "../../shared/roles.sol";
import "contracts/shared/libraries/LibDiamond.sol";

contract EscrowManager2 {
    // Run scripts/getOffset to get these values
    uint256 constant proxyMainOffset = 55;
    uint256 constant proxyBackupOffset = 99;

    mapping(string => address) implementations;

    event BeaconCreated(
        string indexed name,
        BeaconType beaconType,
        address addr
    );
    event ProxyCreated(address addr);

    enum BeaconType { Main, Backup }

    function getImplementation(string calldata name)
        external
        view
        returns (address)
    {
        return implementations[name];
    }

    function createImplementation(string memory name, address impl) public {
        LibDiamond.enforceIsContractOwner();
        implementations[name] = impl;
        _deployBeacon(name, BeaconType.Main);
    }

    function beginUpgrade(string memory name, address newImpl) public {
        LibDiamond.enforceIsContractOwner();
        implementations[name] = newImpl;
        _deployBeacon(name, BeaconType.Backup);
        _destroyBeacon(name, BeaconType.Main);
    }

    function finishUpgrade(string memory name) public {
        LibDiamond.enforceIsContractOwner();
        _deployBeacon(name, BeaconType.Main);
        _destroyBeacon(name, BeaconType.Backup);
    }

    function createProxy(string memory name) public returns (address) {
        address main = _getBeaconAddress(name, BeaconType.Main);
        address backup = _getBeaconAddress(name, BeaconType.Backup);
        bytes memory proxyCode = type(Proxy).creationCode;

        // We need to manually overwrite the proxy bytecode where the addresses would be stored
        // since solc does not support using immutable variables in assembly code

        bytes32 targetAddress;
        uint256 locOffset;

        targetAddress = bytes32(bytes20(main));
        locOffset = 0x20 + proxyMainOffset;
        assembly {
            let code := mload(add(proxyCode, locOffset))
            let masked := and(
                code,
                0x0000000000000000000000000000000000000000ffffffffffffffffffffffff
            )
            mstore(add(proxyCode, locOffset), or(targetAddress, masked))
        }

        targetAddress = bytes32(bytes20(backup));
        locOffset = 0x20 + proxyBackupOffset;
        assembly {
            let code := mload(add(proxyCode, locOffset))
            let masked := and(
                code,
                0x0000000000000000000000000000000000000000ffffffffffffffffffffffff
            )
            mstore(add(proxyCode, locOffset), or(targetAddress, masked))
        }

        address deployed;
        assembly {
            deployed := create(0, add(proxyCode, 0x20), mload(proxyCode))
        }

        emit ProxyCreated(deployed);
        return deployed;
    }

    function _deployBeacon(string memory name, BeaconType beaconType)
        internal
        returns (address)
    {
        bytes memory bytecode = _getBeaconCode(name);
        bytes32 salt = _getBeaconSalt(name, beaconType);

        address beacon;
        assembly {
            beacon := create2(0, add(bytecode, 0x20), mload(bytecode), salt)
        }

        emit BeaconCreated(name, beaconType, beacon);
        return beacon;
    }

    function _destroyBeacon(string memory name, BeaconType beaconType)
        internal
    {
        address beaconAddress = _getBeaconAddress(name, beaconType);
        Beacon(beaconAddress).destroy();
    }

    function _getBeaconCode(string memory name)
        internal
        view
        returns (bytes memory)
    {
        return
            abi.encodePacked(
                type(Beacon).creationCode,
                abi.encode(address(this), name)
            );
    }

    function _getBeaconSalt(string memory name, BeaconType beaconType)
        internal
        pure
        returns (bytes32)
    {
        return keccak256(abi.encodePacked(beaconType, name));
    }

    function _getBeaconAddress(string memory name, BeaconType beaconType)
        internal
        view
        returns (address)
    {
        bytes32 bytecodeHash = keccak256(_getBeaconCode(name));
        bytes32 salt = _getBeaconSalt(name, beaconType);
        bytes32 dataHash =
            keccak256(
                abi.encodePacked(
                    bytes1(0xff),
                    address(this),
                    salt,
                    bytecodeHash
                )
            );
        return address(uint160(uint256(dataHash)));
    }
}
