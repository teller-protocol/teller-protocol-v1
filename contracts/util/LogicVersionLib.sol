pragma solidity 0.5.17;

// Libraries
import "@openzeppelin/contracts-ethereum-package/contracts/utils/Address.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/math/SafeMath.sol";

/**
    TODO Add comments.

    @author develop@teller.finance
 */
library LogicVersionLib {
    using SafeMath for uint256;
    using Address for address;
    // TODO move  it
    struct LogicVersion {
        address logic;
        uint256 version;
        bool exists;
    }

    /**
        @notice It creates a new logic version.
        @param logic initial logic address.
     */
    function initialize(LogicVersion storage self, address logic) internal {
        requireNotExists(self);
        require(logic.isContract(), "LOGIC_MUST_BE_CONTRACT");
        self.logic = logic;
        self.version = 0;
        self.exists = true;
    }

    /**
        @notice Checks whether the current logic version exists or not.
        @dev It throws a require error if the logic version already exists.
        @param self the current logic version.
     */
    function requireNotExists(LogicVersion storage self) internal view {
        require(self.exists == false, "LOGIC_ALREADY_EXISTS");
    }

    /**
        @notice Checks whether the current logic version exists or not.
        @dev It throws a require error if the current logic version doesn't exist.
        @param self the current logic version.
     */
    function requireExists(LogicVersion storage self) internal view {
        require(self.exists == true, "LOGIC_NOT_EXISTS");
    }

    /**
        @notice It updates a logic version.
        @dev It throws a require error if:
            - The new logic is equal to the current logic.
        @param self the current logic version.
        @param newLogic the new logic to set in the logic version.
        @return oldLogic the old logic address.
        @return oldVersion the old version.
        @return newVersion the new version.
     */
    function update(LogicVersion storage self, address newLogic)
        internal
        returns (
            address oldLogic,
            uint256 oldVersion,
            uint256 newVersion
        )
    {
        requireExists(self);
        require(self.logic != newLogic, "NEW_LOGIC_REQUIRED");
        oldLogic = self.logic;
        oldVersion = self.version;
        newVersion = self.version.add(1);

        self.logic = newLogic;
        self.version = newVersion;
    }

    /**
        @notice It removes a current logic versionn.
        @param self the current logic version to remove.
     */
    function remove(LogicVersion storage self)
        internal
        returns (address lastLogic, uint256 lastVersion)
    {
        requireExists(self);
        lastLogic = self.logic;
        lastVersion = self.version;
        self.logic = address(0x0);
        self.version = 0;
        self.exists = false;
    }
}
