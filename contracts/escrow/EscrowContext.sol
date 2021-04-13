// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/utils/introspection/IERC165.sol";
import "@openzeppelin/contracts/proxy/Clones.sol";
import { TELLER } from "../protocol-address.sol";

/**
    @dev See [0age's implementation](https://github.com/0age/metamorphic),
    featuring the best documentation I've ever seen.
 */
bytes32 constant METAMORPHIC_CREATION_CODE = hex"5860208158601c335a63aaf10f428752fa158151803b80938091923cf3";

bytes32 constant METAMORPHIC_CREATION_CODE_HASH = keccak256(
    abi.encodePacked(METAMORPHIC_CREATION_CODE)
);
/**
    @dev The address of the metamorphic contract which always holds the most recent version of the
    escrow logic, unless it is being destroyed.
*/
address constant metamorphic = address(
    uint160( // downcast to match the address type.
        uint256( // convert to uint to truncate upper digits.
            keccak256( // compute the CREATE2 hash using 4 inputs.
                abi.encodePacked( // pack all inputs to the hash together.
                    hex"ff", // start with 0xff to distinguish from RLP.
                    TELLER, // this contract will be the caller.
                    keccak256("Teller/AssetEscrow#metamorphic"), // pass in the supplied salt value.
                    METAMORPHIC_CREATION_CODE_HASH // supply init code hash.
                )
            )
        )
    )
);

/**
    @dev The creation code of proxies which will just delegate everthing to metamorphic.
    Super simple bytecode taken from 0age.
 */
bytes constant PROXY_CREATION_CODE = abi.encodePacked(
    hex"3d3d3d3d363d3d37363d73",
    metamorphic,
    hex"5af43d3d93803e602a57fd5bf3"
);

bytes32 constant PROXY_CREATION_CODE_HASH = keccak256(PROXY_CREATION_CODE);

/**
    We need this to be implemented on the logic contract at all times to be able to destroy the
    contract.
 */
interface IDestroyable {
    function destroy() external;
}

/**
    Inherit from this contract to easily get the address of an AssetEscrow (proxy).
 */
abstract contract AssetEscrowAddress {
    function assetEscrow(address asset, bytes32 ident)
        internal
        pure
        returns (address)
    {
        return
            address(
                uint160( // downcast to match the address type.
                    uint256( // convert to uint to truncate upper digits.
                        keccak256( // compute the CREATE2 hash using 4 inputs.
                            abi.encodePacked( // pack all inputs to the hash together.
                                hex"ff", // start with 0xff to distinguish from RLP.
                                TELLER, // this contract will be the caller.
                                ident ^ bytes20(asset), // pass in the supplied salt value.
                                PROXY_CREATION_CODE_HASH // supply init code hash.
                            )
                        )
                    )
                )
            );
    }
}

abstract contract AssetEscrowContext is AssetEscrowAddress {
    /**
        @dev false if this contract doesn't exist or if the metamorphic contract is upgrading.
        true if we're smooth sailing.
        Just use extcodesize(metamorphic) to check if it's actually deployed, it's cheaper.
     */
    bool private deployed;

    /**
        @dev address of the current implementation/version of the escrow logic contract.
        This is what the metamorphic creation code creates when it is deployed each time.
        So, when this changes, so does the runtime code of the new metamorphic contract;
        although it keeps its address due to our CREATE2 strategy.
     */
    address private _implementation;

    /**
        @dev HEADS UP: this deployment schedule can leave some down time where there is no code
        at the metamorphic contract's address.
        Luckily, the proxy contract keeps the storage until the next transaction is mined, where
        everything is back to normal.
        This tends to be a UX/DX problem, but I think we can simply enforce the logic contract
        to use a nice assembly? modifier which hijacks the return value if it's 0/null and instead
        returns 1 byte to differentiate this from a delegatecall into an empty contract.
     */

    /**
        @dev Don't change this signature at all, it's used in the constant METAMORPHIC_CREATION_CODE.
        Is used by the metamorphic contract's creation code to load which address to clone.
        This means the metamorphic contract's creation code (constructor + code data + constr. params)
        doesn't change through deployments. It just always clones *any address* a non-deterministic
        static-call to msg.sender.
     */
    function getImplementation() external view returns (address) {
        return _implementation;
    }

    /**
        Uses CREATE2 to create a deterministic EIP 1167 clone with the metamorphic contract as its
        delegate.
        We may eventually be able to deploy a version of the escrow logic which allows us to revamp
        the code data of the clone to encode important information like the asset, ident and metadata.
     */
    function createEscrow(address asset, bytes32 ident)
        external
        returns (address instance)
    {
        bytes memory creationCode = PROXY_CREATION_CODE;
        assembly {
            instance := create2(
                0, // give no callvalue
                add(creationCode, 0x20), // length of the creationCode
                mload(creationCode), // the creation code bytes
                or(ident, asset) // salt
            )
        }
    }

    /**
        @dev Just makes the metamorphic SELFDESCTRUCT and sets the flag to true.
     */
    function destroy() external {
        assert(deployed);
        deployed = false;
        address _metamorphic = metamorphic;
        IDestroyable(_metamorphic).destroy();
        uint256 deployedCodeSize;
        assembly {
            deployedCodeSize := extcodesize(_metamorphic)
        }
        assert(deployedCodeSize != 0);
    }

    /**
        Upgrade the escrow's logic by changing the implementation of the metamorphic contract.
        As long as the previous one was destroyed or this is the first one, the call will succeed.
        @dev We also require that the implementation supports the IDestroyable interface, which
        we can check after the deployment (as a basic precaution against bricking).
     */
    function upgrade(address implementation) external {
        assert(!deployed);
        _implementation = implementation;
        deployed = true;

        assert(
            IERC165(metamorphic).supportsInterface(
                type(IDestroyable).interfaceId
            )
        );

        // TODO: Finish this block (just deploying the metamorphic using create 2)
    }
}
