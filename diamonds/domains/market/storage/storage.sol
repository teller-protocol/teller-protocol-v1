import { ITToken } from "diamonds/Interfaces.sol";

struct MarketLayout {
    ITToken tToken;
    CErc20Interface cToken;
    ERC20 lendingToken;
    ERC20 comp;
    ERC20 collateralToken;
    IComptroller compound;
    uint256 loanIDCounter;
    uint256 totalBorrowed;
    uint256 totalRepaid;
    uint256 totalCollateral;
    mapping(string => address) addresses;
    mapping(address => uint256[]) borrowerLoans;
    mapping(uint256 => TellerCommon.Loan) loans;
    AddressArrayLib.AddressArray signers;
}
