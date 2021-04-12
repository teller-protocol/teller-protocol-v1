import "./shared/libraries/LibDiamond.sol";

// /**
//     Had quite a few thoughts about how we can deploy a contract which is
//     maximally relevant through time. Obviously, we should use some for of
//     upgrade mechanism for that. List of cool ideas:
//     |- Sdatic constructor so CREATE2 returns the same result for the same
//     constructor, deployer and salt. This just means we load the list of
//     memes we want to include while constructing and assign immutable
//     storage values
//     |- Why use a constructor? Simply because storing data in code (immutable)
//     lets consumers of all sorts spend less gas when reading the data;
//     provided they use EXTCODECOPY or CODECOPY. I believe that when this
//     contract DELEGATECALLs into something, that thing doesn't have access
//     to the caller's code.
//     |- Design overview:
//     Use a [ImmutableCreate2Factory](https://github.com/0age/metamorphic/blob/master/contracts/ImmutableCreate2Factory.sol)
//     or a custom single-serve contract to deploy this at the same address
//     every time. Might not be required.
//     > This contract is a constructed metamorphic contract with immutable metadata
//     references which can be overwritten with each upgrade.
//     > The deploying contract is the Transient contract by 0age, and this one is
//     the forever structure of all iterations deployed using the same CREATE2.
//     This means we need a solid deployer account (CREATE2 param). Alternatively
//     we can EXTCODECOPY everything from version 2 and use a different deployer
//     there, since this contract should not hold any important storage. Though
//     this isn't too useful unless part of a verifiable blockchain operation i.e.
//     SCRATCH THAT we can just use the metamorphic property (more than once?) if
//     needed. Let's try it out! Nevermind, thinking about this. @Thoughts>1
//     > We make use of assembly in the constructor to dynamically modify the
//     runtime code returned without affecting the address. Instead, we fetch the
//     list of references we want to include for the build and include them at an
//     immutable slot. We have around 24KB of leeway here, minus the size of this
//     bytecode.
//     > Ideally, we encode data in several formats for optimized reads
//     (1-2 EXTCODECOPY's). The golden standard is for callers to be able to
//     directly address a position in code by providing an arbitrary input subject.
//     We could ship a helper library to be included in consumer code with runtime
//     helpers (for operations which can be expensive) and pure functions for
//     arbitrary resolution of data.
//     and they can choose their update schedule or we can build an efficient route
//     for access
//     |- Thoughts
//     1) **Managing the deployment and upgrade parameters**
//     In any case, the "deployer" (contract which calls CREATE2) must stay
//     exactly the same across any sort of code change here. Same goes for the
//     salt used and the type(Teller).creationCode.concat(...opts)? I don't think
//     opts are required as we can use the calling contract to fetch that data.
//     Although this gives us context isolation between the deployer contract and
//     the "initializer" contract, which could be desired. Can't think of a good
//     or bad reason to split them or not, but my guess is that splitting them
//     would be more extensible and complex. So split the addresses but set them
//     to the same address initially. The underlying content resolved just
//     depends on what's returned by calling the initializer, and the initializer
//     can choose to upgrade or reroute the call to the initalization function
//     arbitrarily. This is the DAO angle.
//     2) ** Mechanism to dynamically call internal function **
//     > What happens when we delegatecall, codecopy, have immutable stores with
//     internal function references? Which structures can we build using those
//     tools? I think there MUST be a mechanism to call an internal function
//     which isn't strictly implemented in the source contract, let's do some
//     digging! @Thoughts>2
//     " DELEGATECALL + CODECOPY => callee granted access to costly storage (almost
//     never use this); callee granted access to msg.data and msg.sender; callee
//     needs to use calldata or EXTCODECOPY to gain any meaningful insight on
//     the caller for cheap.
//     > Can offer cheaper alternative to SLOADing everything for consumers who
//     need access to the rich data API. This is a big maybe, I don't know how it
//     could be useful. [RStore by 0age](https://github.com/0age/RStore) is not
//     really upgradeable and we don't want anything else than at most EXTCODECOPY's
//     given the current gas parameters. Simple option for integrating partners
//     would be to maintain a RStore from which code can be copied by anyone
//     at a desired [offset,length] and can never be deleted.
//     > Original RStore idea was to deploy time-delayed transient storage contracts
//     which would be cleared and SELFDESTRUCT'ed by the integrator. This just adds
//     more overhead than is desired.
//  */
contract Teller {
    address immutable witness;

    constructor() {
        witness = address(0x0);

        assembly {

        }
    }

    function initialize() external {
        assembly {
            // keccak256("Teller/Setup#initialize");
            let initializer := sload(
                0x397d0bbd66a6c2184906ac3dd5a127a7f20fdeba806d9ae9a96d2bcfb20a7aa3
            )
            // switch initializer
            // case 0x0000000000000000000000000000000000000000
            // let position := keccak256(caller(), 32)
        }
    }

    // function creator() public view returns (address);
}
