// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/utils/introspection/IERC165.sol";
import "@openzeppelin/contracts/proxy/Clones.sol";

// import { TELLER } from "../protocol-address.sol";

/**
    We need this to be implemented on the logic contract at all times to be able to destroy the
    contract.
 */
abstract contract AImplementation is IERC165 {
    // modifier entrance() {
    //     _;
    //     assembly {
    //         if iszero(returndatasize()) {
    //             return(caller(), 20)
    //         }
    //     }
    // }

    address internal ADMIN;

    function instantiate(address admin) external {
        ADMIN = admin;
    }

    function destroy() external {
        require(msg.sender == ADMIN && address(this) != ADMIN, "11");
        selfdestruct(payable(ADMIN));
    }

    function supportsInterface(bytes4 interfaceId)
        external
        pure
        virtual
        override
        returns (bool)
    {
        return
            interfaceId == type(IERC165).interfaceId ||
            interfaceId == this.destroy.selector ^ this.instantiate.selector;
    }
}

interface IFactory {
    /**
        @dev Don't change this signature at all, it's used in the constant METAMORPHIC_CREATION_CODE.
        Is used by the metamorphic contract's creation code to load which address to clone.
        This means the metamorphic contract's creation code (constructor + code data + constr. params)
        doesn't change through deployments. It just always clones *any address* with a non-deterministic
        static-call to msg.sender.
     */
    function getImplementation() external view returns (address);
}

library LFactory {
    /**
    @dev See [0age's implementation](https://github.com/0age/metamorphic),
    featuring the best documentation I've ever seen.
 */
    bytes32 internal constant METAMORPHIC_CREATION_CODE =
        hex"5860208158601c335a63aaf10f428752fa158151803b80938091923cf3";

    bytes32 internal constant METAMORPHIC_CREATION_CODE_HASH =
        keccak256(abi.encodePacked(METAMORPHIC_CREATION_CODE));

    function getSalt(address self, bytes32 identifier)
        internal
        pure
        returns (bytes32)
    {
        return (bytes32(bytes20(self)) << 96) ^ identifier;
    }

    function getInstance(
        address self,
        bytes32 salt,
        bytes32 PROXY_CREATION_CODE_HASH
    ) internal pure returns (address) {
        return getCreate2(self, salt, PROXY_CREATION_CODE_HASH);
    }

    function getMorph(address self, bytes32 salt)
        internal
        pure
        returns (address)
    {
        return getCreate2(self, salt, METAMORPHIC_CREATION_CODE_HASH);
    }

    function getCreate2(
        address deployer,
        bytes32 salt,
        bytes32 creationCodeHash
    ) public pure returns (address) {
        return
            address(
                uint160( // downcast to match the address type.
                    uint256( // convert to uint to truncate upper digits.
                        keccak256( // compute the CREATE2 hash using 4 inputs.
                            abi.encodePacked( // pack all inputs to the hash together.
                                hex"ff", // start with 0xff to distinguish from RLP.
                                deployer,
                                salt,
                                creationCodeHash // supply init code hash.
                            )
                        )
                    )
                )
            );
    }
}

/**
    Inherit from this contract to easily get the address of an AssetEscrow (proxy).
 */
abstract contract AFactory is IFactory {
    bytes32 internal immutable NAMESPACE;

    bytes32 internal immutable MORPH_SALT;

    /**
        @dev The address of the metamorphic contract which always holds the most recent version of the
        escrow logic, unless it is being destroyed.
    */
    address internal immutable MORPH;

    /**
        @dev Proxy's creation code, simply delegatecall to MORPH.
     */
    bytes internal PROXY_CREATION_CODE;

    /**
        @dev Caching to reduce the need to hash this when passing it into getInstance.
     */
    bytes32 internal PROXY_CREATION_CODE_HASH;

    /**
        @dev address of the current implementation/version of the escrow logic contract.
        This is what the metamorphic creation code creates when it is deployed each time.
        So, when this changes, so does the runtime code of the new metamorphic contract;
        although it keeps its address due to our CREATE2 strategy.
     */
    address public implementation;

    constructor(bytes32 namespace) {
        bytes32 salt = LFactory.getSalt(address(this), namespace);
        address morph = LFactory.getMorph(address(this), salt);
        NAMESPACE = namespace;
        MORPH_SALT = salt;
        MORPH = morph;

        /**
            @dev The creation code of proxies which will just delegate everthing to metamorphic.
            Super simple bytecode taken from 0age.
        */
        PROXY_CREATION_CODE = abi.encodePacked(
            hex"3d3d3d3d363d3d37363d73",
            morph,
            hex"5af43d3d93803e602a57fd5bf3"
        );

        PROXY_CREATION_CODE_HASH = keccak256(
            abi.encodePacked(PROXY_CREATION_CODE)
        );
    }

    function getImplementation() external view override returns (address) {
        return implementation;
    }

    /**
        Uses CREATE2 to create a deterministic EIP 1167 clone with the metamorphic contract as its
        delegate.
        We may eventually be able to deploy a version of the escrow logic which allows us to revamp
        the code data of the clone to encode important information like the asset, ident and metadata.
        Of note, the clone is the one carrying the storage at all times and the metamorphic contract
        holds all of the runtime code. If want to pass proxy  configuration 
     */
    function instantiate(bytes32 instanceId)
        external
        onlyAdmin
        returns (address instance)
    {
        bytes memory creationCode = PROXY_CREATION_CODE;
        bytes32 salt = LFactory.getSalt(address(this), instanceId);

        assembly {
            instance := create2(
                0, // give no callvalue
                mload(creationCode), // length of the creationCode
                add(creationCode, 0x20), // the creation code bytes
                salt
            )
        }
        require(
            instance ==
                LFactory.getInstance(
                    address(this),
                    instanceId,
                    PROXY_CREATION_CODE_HASH
                ),
            "1"
        );
    }

    /**
        @dev Just makes the metamorphic SELFDESCTRUCT and sets the flag to true.
     */
    function destroy() external virtual onlyAdmin {
        assert(MORPH.code.length != 0);
        AImplementation(MORPH).destroy();
        assert(MORPH.code.length == 0);
        // uint256 deployedCodeSize;
        // assembly {
        // deployedCodeSize := extcodesize(_metamorphic)
        // }
        // assert(deployedCodeSize == 0);
    }

    /**
        Upgrade the escrow's logic by changing the implementation of the metamorphic contract.
        As long as the previous one was destroyed or this is the first one, the call will succeed.
        @dev We also require that the implementation supports the IDestroyable interface, which
        we can check after the deployment (as a basic precaution against bricking).
     */
    function upgrade(address _implementation) external onlyAdmin {
        assert(MORPH.code.length == 0);
        implementation = _implementation;
        address deployment;
        bytes32 creationCode = LFactory.METAMORPHIC_CREATION_CODE;
        bytes32 salt = MORPH_SALT;

        assembly {
            deployment := create2(
                0,
                mload(creationCode),
                add(creationCode, 0x20),
                salt
            )
        }

        assert(MORPH == deployment);

        // TODO: use metapod here
        // And/or better checks
        assert(
            IERC165(MORPH).supportsInterface(type(AImplementation).interfaceId)
        );

        AImplementation(MORPH).instantiate(msg.sender);
    }

    // function upgrade(bytes memory bytecode) external {}

    // function upgrade() external {}
}

// contract AssetEscrowFacet {
//     /**
//         @dev false if this contract doesn't exist or if the metamorphic contract is upgrading.
//         true if we're smooth sailing.
//         Just use extcodesize(metamorphic) to check if it's actually deployed, it's cheaper.
//      */
//     bool private deployed;

//     /**
//         @dev address of the current implementation/version of the escrow logic contract.
//         This is what the metamorphic creation code creates when it is deployed each time.
//         So, when this changes, so does the runtime code of the new metamorphic contract;
//         although it keeps its address due to our CREATE2 strategy.
//      */
//     address private _implementation;

//     /**
//         @dev HEADS UP: this deployment schedule can leave some down time where there is no code
//         at the metamorphic contract's address.
//         Luckily, the proxy contract keeps the storage until the next transaction is mined, where
//         everything is back to normal.
//         This tends to be a UX/DX problem, but I think we can simply enforce the logic contract
//         to use a nice assembly? modifier which hijacks the return value if it's 0/null and instead
//         returns 1 byte to differentiate this from a delegatecall into an empty contract.
//      */

//     /**
//         Uses CREATE2 to create a deterministic EIP 1167 clone with the metamorphic contract as its
//         delegate.
//         We may eventually be able to deploy a version of the escrow logic which allows us to revamp
//         the code data of the clone to encode important information like the asset, ident and metadata.
//      */
//     function createEscrow(
//         address asset,
//         bytes32 ident,
//         bytes calldata init
//     )
//         external
//         returns (
//             address instance,
//             bool success,
//             bytes memory result
//         )
//     {}

//     /**
//         @dev Just makes the metamorphic SELFDESCTRUCT and sets the flag to true.
//      */
//     function destroy() external {
//         assert(deployed);
//         deployed = false;
//         address _metamorphic = metamorphic;
//         AMetamorphic(_metamorphic).destroy();
//         uint256 deployedCodeSize;
//         assembly {
//             deployedCodeSize := extcodesize(_metamorphic)
//         }
//         assert(deployedCodeSize == 0);
//     }

//     /**
//         Upgrade the escrow's logic by changing the implementation of the metamorphic contract.
//         As long as the previous one was destroyed or this is the first one, the call will succeed.
//         @dev We also require that the implementation supports the IDestroyable interface, which
//         we can check after the deployment (as a basic precaution against bricking).
//      */
//     function upgrade(address implementation) external {
//         assert(!deployed);
//         _implementation = implementation;
//         deployed = true;
//         address deployment;

//         bytes32 metamorphicSalt = METAMORPHIC_SALT;

//         assembly {
//             deployment := create2(
//                 0,
//                 add(METAMORPHIC_CREATION_CODE, 0x20),
//                 mload(METAMORPHIC_CREATION_CODE),
//                 metamorphicSalt
//             )
//         }

//         assert(metamorphic == deployment);

//         assert(
//             IERC165(metamorphic).supportsInterface(
//                 type(AMetamorphic).interfaceId
//             )
//         );
//     }
// }
