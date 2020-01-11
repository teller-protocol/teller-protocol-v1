/*
    Copyright 2019 Fabrx Labs Inc.
    
    Licensed under the Apache License, Version 2.0 (the "License");
    you may not use this file except in compliance with the License.
    You may obtain a copy of the License at
    
    http://www.apache.org/licenses/LICENSE-2.0
    
    Unless required by applicable law or agreed to in writing, software
    distributed under the License is distributed on an "AS IS" BASIS,
    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
    See the License for the specific language governing permissions and
    limitations under the License.
*/

pragma solidity 0.5.0;
pragma experimental ABIEncoderV2;

import "https://github.com/OpenZeppelin/openzeppelin-contracts/contracts/math/SafeMath.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/contracts/token/ERC20/ERC20.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/contracts/access/roles/MinterRole.sol";


/**
 * @title zeroCollateralMain
 * @author Fabrx Labs Inc.
 *
 * Zero Collateral Main Contract
 * 
 * Values of borrows are dictated in 2 decimals. All other values dictated in DAI (18) decimals.
 */
 
 contract zeroCollateralMain is
    ERC20, 
    MinterRole
{
    using SafeMath for uint256;

    // ============ State Variables ============
    
    // zDAI ERC20 States
    string private _name;
    string private _symbol;
    uint8 private _decimals;
    
    // address of the DAI Contract
    address public DAI_CONTRACT;
    
    // borrow count
    uint256 BORROW_COUNT = 0;
    
    // total accrued interest
    uint256 TOTAL_ACCRUED_INTEREST = 0;
    
    // last block number of accrued interest
    uint256 BLOCK_ACCRUED_INTEREST = block.number;
    
    // amount of DAI remaining as unredeemed interest
    uint256 REDEMPTION_POOL = 0;
    
    // amount of DAI remaining as unredeemed interest
    uint256 DEFAULT_POOL = 0;
    
    // amount collateral locked in contract
    uint256 COLLATERAL_LOCKED = 0;
    
    // interest accrued from ledning account
    struct LendAccount {
        uint256 lastBlockAccrued;
        uint256 totalAccruedInterest;
    }
    
    // array of all lending accounts
    mapping (address => LendAccount) lendAccounts;
    
    // borrower account details
    struct BorrowAccount {
        uint256 lastBorrowId;
        uint256 amountPaidRedemptionPool;
        uint256 amountPaidDefaultPool;
        uint256 collateralRedeemable;
        uint256 collateralNonRedeemable;
    }
    
    // array of all borrower accounts
    mapping (address => BorrowAccount) borrowAccounts;
    
    // event on mint zDAI
    event Minted(address indexed lenderAccount, uint256 amount);
    
    // event on burn zDAI
    event Burned(address indexed lenderAccount, uint256 amount);
    
    // event on redemption of interest
    event Redeemed(address indexed lenderAccount, uint256 amount);
    
    // data per borrow as struct
    struct Borrow {
        uint256 amouontBorrow;
        uint256 amountOwed;
        uint256 amountOwedInitial;
        bool active;
        uint256 blockStart;
        uint256 blockEnd;
        address account;
        bool liquidated;
        uint256 id;
    }
    
    // mapping of all borrows 
    mapping (uint256 => Borrow) borrows;
    
    // publically accessible array of all borrows
    Borrow[] public BorrowStucts;
    
    // collateral deposited by borrower
    event collateralDeposited(address indexed borrower, uint256 amount);
    
    // collateral withdrawn by borrower
    event collateralWithdrawn(address indexed borrower, uint256 amount);
    
    // set number max blocks for borrow to be paid
    uint256 MAX_BLOCKS_BORROW = 172800; // equates to ~thirty days (at 4 blocks per minute)
    
    // borrow event initiated 
    event borrowInitiated(address indexed borrower, Borrow borrow);

    // ============ Constructor ============

    constructor(
        address daiContract,
        string memory name, 
        string memory symbol, 
        uint8 decimals
    )
        public
    {
        DAI_CONTRACT = daiContract;
        _name = name;
        _symbol = symbol;
        _decimals = decimals;
    }

    // ============ Public Functions ============
    
    // zDAI name
    function name() public view returns (string memory) {
        return _name;
    }

    // zDAI symbol
    function symbol() public view returns (string memory) {
        return _symbol;
    }

    // zDAI number of decimals
    function decimals() public view returns (uint8) {
        return _decimals;
    }
    
    // lend DAI, mint ZDAI 
    function mintZDAI(
        uint256 amount        
    ) 
        public
        payable
        returns (uint256)
    {
        ERC20(DAI_CONTRACT).transferFrom(msg.sender, address(this), amount);
        require(checkSuccess(), "ERC20#deposit: TRANSFER_FAILED");
        
        updateTotalAccruedInterest();
        updateAccountAccruedInterest();
        
        _mint(msg.sender, amount);
        emit Minted(msg.sender, amount);
        
        return amount;
        
    }
    
    // burn ZDAI, receive DAI
    function burnZDAI(
        uint256 amount    
    )
        public
        payable
        returns (uint256)
    {
        // cannot withdraw collateral
        uint256 amountAvailableForWithdraw = ERC20(DAI_CONTRACT).balanceOf(address(this)) - COLLATERAL_LOCKED - DEFAULT_POOL - REDEMPTION_POOL;
        
        // only allow withdraw up to available
        if (amount > amountAvailableForWithdraw){
            amount = amountAvailableForWithdraw;
        }
        
        updateTotalAccruedInterest();
        updateAccountAccruedInterest();
        
        _burn(msg.sender, amount);
        
        ERC20(DAI_CONTRACT).transfer(msg.sender, amount);
        require(checkSuccess(), "ERC20#withdraw: TRANSFER_FAILED");
        
        emit Burned(msg.sender, amount);
        
        return amount;
    }
    
    // get total accrued interest
    function getTotalAccruedInterest() public view returns(uint256) {
        return TOTAL_ACCRUED_INTEREST;
    }
    
    // call update total accrued interest
    function callUpdateTotalAccruedInterest() public returns(uint256) {
        updateTotalAccruedInterest();
        return TOTAL_ACCRUED_INTEREST;
    }
    
    // get accrued interest of sender account
    function getAccountAccruedInterest() public view returns(uint256) {
        return lendAccounts[msg.sender].totalAccruedInterest;
    }
    
    // call update accrued interest of sender account
    function callUpdateAccountAccruedInterest() public returns(uint256) {
        updateTotalAccruedInterest();
        updateAccountAccruedInterest();
        return lendAccounts[msg.sender].totalAccruedInterest;
    }
    
    // get REDEMPTION_POOL
    function getRedemptionPool() public view returns(uint256) {
        return REDEMPTION_POOL;
    }
    
    // get DEFAULT_POOL
    function getDefaultPool() public view returns(uint256) {
        return DEFAULT_POOL;
    }
    
    // redeem interest from redemption pool 
    function redeemInterestFromPool() public returns (uint256) {
        // update redeemable interest
        updateTotalAccruedInterest();
        updateAccountAccruedInterest();
        
         // calculated interest_redeemable as amount of DAI in decimals
        uint256 interest_redeemable = ((lendAccounts[msg.sender].totalAccruedInterest * REDEMPTION_POOL) / TOTAL_ACCRUED_INTEREST) ;
        
        // update TOTAL_ACCRUED_INTEREST
        TOTAL_ACCRUED_INTEREST -= lendAccounts[msg.sender].totalAccruedInterest;
        
        // set accrued interest of lender to 0
        lendAccounts[msg.sender].totalAccruedInterest = 0;
        
        // update REDEMPTION_POOL
        REDEMPTION_POOL -= interest_redeemable;
        
        // transfer DAI to lender
        ERC20(DAI_CONTRACT).transfer(msg.sender, interest_redeemable);
        require(checkSuccess(), "ERC20#withdraw: TRANSFER_FAILED");
        
        // emit event of redemption
        emit Redeemed(msg.sender, interest_redeemable);
        
        return interest_redeemable;
    }
    
    // calculate borrower collateral needed for specific borrow. collateral in value of DAI
    function getCollateralNeeded(uint256 amountBorrow) view public returns(uint256){
        uint256 poolContributions = (borrowAccounts[msg.sender].amountPaidRedemptionPool);
        uint256 amountBorrowDecimals = amountBorrow*(10**16); // convert to DAI decimals
        
        if ((poolContributions/2) >= amountBorrowDecimals){
            return 0;
        }else{
            return ( (amountBorrowDecimals - (poolContributions/2)) ); // return DAI units of collateral
        }
    }
    
    // get total collateral of borrower
    function collateralsOf(address borrower) public view returns (uint256) {
        uint256 totalCollateral = borrowAccounts[borrower].collateralRedeemable + borrowAccounts[borrower].collateralNonRedeemable;
        return totalCollateral;
    }
    
    // get redeemable collateral of borrower
    function getRedeemableCollateral(address borrower) public view returns (uint256) {
        uint256 redeemableCollateral = borrowAccounts[borrower].collateralRedeemable;
        return redeemableCollateral;
    }
    
    // get borrower account
    function getBorrowAccount(address borrower) public view returns (BorrowAccount memory) {
        return borrowAccounts[borrower];
    }
    
    // borrower deposit redeemable collateral
    function depositCollateralRedeemableBorrower(uint256 amount) public payable {
        
        ERC20(DAI_CONTRACT).transferFrom(msg.sender, address(this), amount);
        require(checkSuccess(), "ERC20#deposit: TRANSFER_FAILED");
        
        COLLATERAL_LOCKED += amount;
        
        // updated account collateral redeemable
        borrowAccounts[msg.sender].collateralRedeemable += amount;
        emit collateralDeposited(msg.sender, amount);
    }
    
    // borrower deposit non-redeemable collateral
    function depositCollateralNonredeemableBorrower(uint256 amount) public payable {
        
        ERC20(DAI_CONTRACT).transferFrom(msg.sender, address(this), amount);
        require(checkSuccess(), "ERC20#deposit: TRANSFER_FAILED");
        
        DEFAULT_POOL += amount;
        
        // updated account collateral redeemable
        borrowAccounts[msg.sender].collateralNonRedeemable += amount;
        emit collateralDeposited(msg.sender, amount);
    }
    
    // borrower withdraw collateral
    function withdrawCollateralBorrower(uint256 amount) public payable {
        
        // liquidate any outstanding unpaid borrows
        liquidate(msg.sender);
        
        // check for no outstanding borrow
        uint256 borrowerLastBorrowId = borrowAccounts[msg.sender].lastBorrowId;
        if (borrowerLastBorrowId != 0){
            bool outstandingBorrow = getBorrow(borrowerLastBorrowId).active;
            require(outstandingBorrow==false, "Collateral#withdraw: OUTSTANDING_BORROW");
        }
        
        if (borrowAccounts[msg.sender].collateralRedeemable > amount){
            borrowAccounts[msg.sender].collateralRedeemable -= amount;
            COLLATERAL_LOCKED -= amount;
            ERC20(DAI_CONTRACT).transfer(msg.sender, amount);
            require(checkSuccess(), "ERC20#withdraw: TRANSFER_FAILED");
            
            emit collateralWithdrawn(msg.sender, amount);
        }else{
            uint256 transfer_amount = borrowAccounts[msg.sender].collateralRedeemable;
            borrowAccounts[msg.sender].collateralRedeemable = 0;
            COLLATERAL_LOCKED -= transfer_amount;
            ERC20(DAI_CONTRACT).transfer(msg.sender, transfer_amount);
            require(checkSuccess(), "ERC20#withdraw: TRANSFER_FAILED");
            
            emit collateralWithdrawn(msg.sender, borrowAccounts[msg.sender].collateralRedeemable);
        }
        
    }
    
    // liquidate unpaid borrows
    function liquidate(address borrower) public{
        
        uint256 borrowerLastBorrowId = borrowAccounts[borrower].lastBorrowId;
        
        if (borrows[borrowerLastBorrowId].active ==  true && block.number > borrows[borrowerLastBorrowId].blockEnd){
            // set old amount paid to DEFAULT_POOL
            uint256 oldAmountPaidDefaultPool = borrowAccounts[borrower].amountPaidDefaultPool;
            
            // liquidate account
            borrowAccounts[borrower].amountPaidRedemptionPool = 0;
            borrowAccounts[borrower].amountPaidDefaultPool = 0;
            
            
            // amount owed from loan
            uint256 amountOwedDAI = ((borrows[borrowerLastBorrowId].amountOwed * (10**18))/100);
            
            if (amountOwedDAI > oldAmountPaidDefaultPool){
                uint256 liquidatedCollateral = amountOwedDAI - oldAmountPaidDefaultPool;
                
                // primary liquidation: non-redeemable collateral
                if (liquidatedCollateral > borrowAccounts[borrower].collateralNonRedeemable){
                    // update collateralNonRedeemable
                    uint256 oldCollateralNonRedeemable = borrowAccounts[borrower].collateralNonRedeemable;
                    
                    borrowAccounts[borrower].collateralNonRedeemable = 0;
                    liquidatedCollateral -= oldCollateralNonRedeemable;
                    
                    // update default pool (where non-redeemable collateral resides)
                    DEFAULT_POOL -= oldCollateralNonRedeemable;
                    REDEMPTION_POOL += oldCollateralNonRedeemable;
                    
                }else{
                    // update collateralNonRedeemable
                    borrowAccounts[borrower].collateralNonRedeemable -= liquidatedCollateral;
                    
                    // update default pool (where non-redeemable collateral resides)
                    DEFAULT_POOL -= liquidatedCollateral;
                    REDEMPTION_POOL += liquidatedCollateral;
                    
                    // set liquidatedCollateral to 0
                    liquidatedCollateral = 0;
                    
                }
                
                // secondary liquidation: redeemable collateral
                if (liquidatedCollateral > borrowAccounts[borrower].collateralRedeemable){
                    // update collateralRedeemable
                    uint256 oldCollateralRedeemable = borrowAccounts[borrower].collateralRedeemable;
                    borrowAccounts[borrower].collateralRedeemable = 0;
                    liquidatedCollateral -= oldCollateralRedeemable;
                
                    // update collateral locked
                    COLLATERAL_LOCKED -= oldCollateralRedeemable;
                    REDEMPTION_POOL += oldCollateralRedeemable;
                }else{
                    // update collateralRedeemable
                    borrowAccounts[borrower].collateralRedeemable -= liquidatedCollateral;
                    
                    // update collateral locked
                    COLLATERAL_LOCKED -= liquidatedCollateral;
                    REDEMPTION_POOL += liquidatedCollateral;
                    
                    // set liquidatedCollateral to 0
                    liquidatedCollateral = 0;
                }
                
            }
            
            borrows[borrowerLastBorrowId].liquidated = true;
            borrows[borrowerLastBorrowId].active = false;
        } 
    }
    
    function calculateInterest(uint256 amountBorrow) view public returns (uint256) {
        
        // calculate % of interest paid (18 decimals) + collateralNonRedeemable (18 decimals), divided by borrow amount (2 decimals). Resulting 16 decimals.
        uint256 x = ((borrowAccounts[msg.sender].amountPaidRedemptionPool + borrowAccounts[msg.sender].collateralNonRedeemable)) / amountBorrow;
        
        if (x > (10**16)){
            x = (10**16);
        }
        
        // interest rate calculated
         uint256 interest_rate = ((12 * (10**16)) - (x*8)) / (10**16);
         
         return interest_rate;
    }
    
    // retrieve all borrows
    function getAllBorrows() view public returns(Borrow[] memory) {
        return BorrowStucts;
    }
    
    // retrieve borrow by id
    function getBorrow(uint256 id) view public returns (Borrow memory) {
        return (borrows[id]);
    }
    
    function createBorrow(uint256 amouontBorrow) public returns(bool) {
        // cannot withdraw collateral
        uint256 amountAvailableForWithdraw = (ERC20(DAI_CONTRACT).balanceOf(address(this)) - COLLATERAL_LOCKED - DEFAULT_POOL - REDEMPTION_POOL) / (10**16);
        
        // only allow withdraw up to available
        if (amouontBorrow > amountAvailableForWithdraw){
            amouontBorrow = amountAvailableForWithdraw;
        }
        
        // check if any outstanding borrows
        uint256 borrowerLastBorrowId = borrowAccounts[msg.sender].lastBorrowId;
        
        if (borrowerLastBorrowId != 0){
            if (getBorrow(borrowerLastBorrowId).active ==  true){
                return false;
            }
        }
        
        
        // check if collateralDeposited > getCollateralNeeded
        if (getCollateralNeeded(amouontBorrow) > collateralsOf(msg.sender)){
            return false;
        }
        
        // increment borrow count
        BORROW_COUNT++;
        
        // create borrow
        Borrow storage borrow = borrows[BORROW_COUNT];
        
        uint256 BORROW_INTEREST_RATE = calculateInterest(amouontBorrow);
        
        borrow.amouontBorrow = amouontBorrow;
        borrow.amountOwed = (amouontBorrow*(100+BORROW_INTEREST_RATE))/100; // using 100 multiplier to maintain number above decimal
        borrow.amountOwedInitial = (amouontBorrow*(100+BORROW_INTEREST_RATE))/100;
        borrow.active = true;
        borrow.blockStart = block.number;
        borrow.blockEnd = block.number + MAX_BLOCKS_BORROW;
        borrow.account = msg.sender;
        borrow.liquidated = false;
        borrow.id = BORROW_COUNT;
        
        BorrowStucts.push(borrow);
        borrowAccounts[msg.sender].lastBorrowId = BORROW_COUNT;
        
        ERC20(DAI_CONTRACT).transfer(msg.sender, ( (amouontBorrow * (10**18)) / 100 ));
        require(checkSuccess(), "ERC20#withdraw: TRANSFER_FAILED");
        
        emit borrowInitiated(msg.sender, borrow);
        
        return true;
    }
    
    function repayBorrow(uint256 amouontRepay) public returns(uint256) {
        uint256 repayOverAmount;
        
        uint256 borrowerLastBorrowId = borrowAccounts[msg.sender].lastBorrowId;
        
            if (borrows[borrowerLastBorrowId].active ==  true){
               
               // set initial redemption pool additional value to zero
               uint256 redemption_pool_addition = 0;
               uint256 default_pool_addition = 0;
               
               // calculate general borrow interest
               uint256 interest = borrows[borrowerLastBorrowId].amountOwedInitial - borrows[borrowerLastBorrowId].amouontBorrow;
               
               if (amouontRepay > borrows[borrowerLastBorrowId].amountOwed){
                   repayOverAmount += (amouontRepay - borrows[borrowerLastBorrowId].amountOwed);
                   
                    // transfer DAI to this address from borrow address
                    ERC20(DAI_CONTRACT).transferFrom(msg.sender, address(this), ((borrows[borrowerLastBorrowId].amountOwed * (10**18))/100) );
                    require(checkSuccess(), "ERC20#deposit: TRANSFER_FAILED");
                    
                    // update redemption_pool_addition based on previous paybacks
                    if (interest > borrows[borrowerLastBorrowId].amountOwed){
                        redemption_pool_addition = (borrows[borrowerLastBorrowId].amountOwed / 2);
                        default_pool_addition = (borrows[borrowerLastBorrowId].amountOwed / 2);
                    }else{
                        redemption_pool_addition = (interest / 2);
                        default_pool_addition = (interest / 2);
                    }
                    
                    // updated amount of DAI in REDEMPTION_POOL & DEFAULT_POOL
                    REDEMPTION_POOL += ((redemption_pool_addition * (10**18))/100); // 10^18 decimals for DAI
                    DEFAULT_POOL += ((default_pool_addition * (10**18))/100) ; // 10^18 decimals for DAI
                    
                    borrowAccounts[msg.sender].amountPaidRedemptionPool += ((redemption_pool_addition * (10**18))/100);
                    borrowAccounts[msg.sender].amountPaidDefaultPool += ((default_pool_addition * (10**18))/100);
                   
                    borrows[borrowerLastBorrowId].amountOwed = 0;
               }else{
                    // transfer DAI to this address from borrow address
                    ERC20(DAI_CONTRACT).transferFrom(msg.sender, address(this), ((amouontRepay * (10**18))/100) );
                    require(checkSuccess(), "ERC20#deposit: TRANSFER_FAILED");
                    
                    // update redemption_pool_addition based on previous paybacks
                    uint256 remainingOwed = borrows[borrowerLastBorrowId].amountOwed - amouontRepay;
                    if (interest > borrows[borrowerLastBorrowId].amountOwed){
                        redemption_pool_addition = (amouontRepay / 2);
                        default_pool_addition = (amouontRepay / 2);
                    }else if (interest > remainingOwed){
                        redemption_pool_addition = ((interest - remainingOwed) / 2);
                        default_pool_addition = ((interest - remainingOwed) / 2);
                    }
                    
                    // updated amount of DAI in REDEMPTION_POOL
                    REDEMPTION_POOL += ((redemption_pool_addition * (10**18))/100) ; // 10^18 decimals for DAI
                    DEFAULT_POOL += ((default_pool_addition * (10**18))/100) ; // 10^18 decimals for DAI
                    
                    borrowAccounts[msg.sender].amountPaidRedemptionPool += ((redemption_pool_addition * (10**18))/100);
                    borrowAccounts[msg.sender].amountPaidDefaultPool += ((default_pool_addition * (10**18))/100);
                    
                    borrows[borrowerLastBorrowId].amountOwed -= amouontRepay;
               }
               if (borrows[borrowerLastBorrowId].amountOwed == 0){
                   borrows[borrowerLastBorrowId].active =  false;
               }
                   
        }
        
        // Resend funds to borrower
        return repayOverAmount;
    }
    

    // ============ Private Functions ============

    function updateTotalAccruedInterest(
    ) 
        private 
        returns (uint256) 
    {
        uint256 totalSupply = ERC20(address(this)).totalSupply();
        uint256 blockAccruedInterestPrevious = BLOCK_ACCRUED_INTEREST;
        BLOCK_ACCRUED_INTEREST = block.number;
        TOTAL_ACCRUED_INTEREST += ((block.number - blockAccruedInterestPrevious) * totalSupply);
        return TOTAL_ACCRUED_INTEREST;
    }
    
    function updateAccountAccruedInterest(
    ) 
        private 
        returns (uint256) 
    {
        uint256 lastBlockAccrued = lendAccounts[msg.sender].lastBlockAccrued;
        uint256 balanceOf = ERC20(address(this)).balanceOf(msg.sender);
        
        lendAccounts[msg.sender].lastBlockAccrued = block.number;
        lendAccounts[msg.sender].totalAccruedInterest += ((block.number - lastBlockAccrued) * balanceOf);
        
        return lendAccounts[msg.sender].totalAccruedInterest;
    }
    
    // ============ Helper Functions ============
    function checkSuccess()
        private pure
        returns (bool)
      {
        uint256 returnValue = 0;
    
        /* solium-disable-next-line security/no-inline-assembly */
        assembly {
          // check number of bytes returned from last function call
          switch returndatasize
    
          // no bytes returned: assume success
          case 0x0 {
            returnValue := 1
          }
    
          // 32 bytes returned: check if non-zero
          case 0x20 {
            // copy 32 bytes into scratch space
            returndatacopy(0x0, 0x0, 0x20)
    
            // load those bytes into returnValue
            returnValue := mload(0x0)
          }
    
          // not sure what was returned: dont mark as success
          default { }
        }
    
        return returnValue != 0;
      }
}
    
    function calculateInterest(uint256 amountBorrow) view public returns (uint256) {
        
        // calculate % of interest paid (18 decimals) + collateralNonRedeemable (18 decimals), divided by borrow amount (2 decimals). Resulting 16 decimals.
        uint256 x = ((borrowAccounts[msg.sender].amountPaidRedemptionPool + borrowAccounts[msg.sender].collateralNonRedeemable)) / amountBorrow;
        
        if (x > (10**16)){
            x = (10**16);
        }
        
        // interest rate calculated
         uint256 interest_rate = ((12 * (10**16)) - (x*8)) / (10**16);
         
         return interest_rate;
    }
    
    // retrieve all borrows
    function getAllBorrows() view public returns(Borrow[] memory) {
        return BorrowStucts;
    }
    
    // retrieve borrow by id
    function getBorrow(uint256 id) view public returns (Borrow memory) {
        return (borrows[id]);
    }
    
    function createBorrow(uint256 amouontBorrow) public returns(bool) {
        // cannot withdraw collateral
        uint256 amountAvailableForWithdraw = (ERC20(DAI_CONTRACT).balanceOf(address(this)) - COLLATERAL_LOCKED - DEFAULT_POOL - REDEMPTION_POOL) / (10**16);
        
        // only allow withdraw up to available
        if (amouontBorrow > amountAvailableForWithdraw){
            amouontBorrow = amountAvailableForWithdraw;
        }
        
        // check if any outstanding borrows
        uint256 borrowerLastBorrowId = borrowAccounts[msg.sender].lastBorrowId;
        
        if (borrowerLastBorrowId != 0){
            if (getBorrow(borrowerLastBorrowId).active ==  true){
                return false;
            }
        }
        
        
        // check if collateralDeposited > getCollateralNeeded
        if (getCollateralNeeded(amouontBorrow) > collateralsOf(msg.sender)){
            return false;
        }
        
        // increment borrow count
        BORROW_COUNT++;
        
        // create borrow
        Borrow storage borrow = borrows[BORROW_COUNT];
        
        uint256 BORROW_INTEREST_RATE = calculateInterest(amouontBorrow);
        
        borrow.amouontBorrow = amouontBorrow;
        borrow.amountOwed = (amouontBorrow*(100+BORROW_INTEREST_RATE))/100; // using 100 multiplier to maintain number above decimal
        borrow.amountOwedInitial = (amouontBorrow*(100+BORROW_INTEREST_RATE))/100;
        borrow.active = true;
        borrow.blockStart = block.number;
        borrow.blockEnd = block.number + MAX_BLOCKS_BORROW;
        borrow.account = msg.sender;
        borrow.liquidated = false;
        borrow.id = BORROW_COUNT;
        
        BorrowStucts.push(borrow);
        borrowAccounts[msg.sender].lastBorrowId = BORROW_COUNT;
        
        ERC20(DAI_CONTRACT).transfer(msg.sender, ( (amouontBorrow * (10**18)) / 100 ));
        require(checkSuccess(), "ERC20#withdraw: TRANSFER_FAILED");
        
        emit borrowInitiated(msg.sender, borrow);
        
        return true;
    }
    
    function repayBorrow(uint256 amouontRepay) public returns(uint256) {
        uint256 repayOverAmount;
        
        uint256 borrowerLastBorrowId = borrowAccounts[msg.sender].lastBorrowId;
        
            if (borrows[borrowerLastBorrowId].active ==  true){
               
               // set initial redemption pool additional value to zero
               uint256 redemption_pool_addition = 0;
               uint256 default_pool_addition = 0;
               
               // calculate general borrow interest
               uint256 interest = borrows[borrowerLastBorrowId].amountOwedInitial - borrows[borrowerLastBorrowId].amouontBorrow;
               
               if (amouontRepay > borrows[borrowerLastBorrowId].amountOwed){
                   repayOverAmount += (amouontRepay - borrows[borrowerLastBorrowId].amountOwed);
                   
                    // transfer DAI to this address from borrow address
                    ERC20(DAI_CONTRACT).transferFrom(msg.sender, address(this), ((borrows[borrowerLastBorrowId].amountOwed * (10**18))/100) );
                    require(checkSuccess(), "ERC20#deposit: TRANSFER_FAILED");
                    
                    // update redemption_pool_addition based on previous paybacks
                    if (interest > borrows[borrowerLastBorrowId].amountOwed){
                        redemption_pool_addition = (borrows[borrowerLastBorrowId].amountOwed / 2);
                        default_pool_addition = (borrows[borrowerLastBorrowId].amountOwed / 2);
                    }else{
                        redemption_pool_addition = (interest / 2);
                        default_pool_addition = (interest / 2);
                    }
                    
                    // updated amount of DAI in REDEMPTION_POOL & DEFAULT_POOL
                    REDEMPTION_POOL += ((redemption_pool_addition * (10**18))/100); // 10^18 decimals for DAI
                    DEFAULT_POOL += ((default_pool_addition * (10**18))/100) ; // 10^18 decimals for DAI
                    
                    borrowAccounts[msg.sender].amountPaidRedemptionPool += ((redemption_pool_addition * (10**18))/100);
                    borrowAccounts[msg.sender].amountPaidDefaultPool += ((default_pool_addition * (10**18))/100);
                   
                    borrows[borrowerLastBorrowId].amountOwed = 0;
               }else{
                    // transfer DAI to this address from borrow address
                    ERC20(DAI_CONTRACT).transferFrom(msg.sender, address(this), ((amouontRepay * (10**18))/100) );
                    require(checkSuccess(), "ERC20#deposit: TRANSFER_FAILED");
                    
                    // update redemption_pool_addition based on previous paybacks
                    uint256 remainingOwed = borrows[borrowerLastBorrowId].amountOwed - amouontRepay;
                    if (interest > borrows[borrowerLastBorrowId].amountOwed){
                        redemption_pool_addition = (amouontRepay / 2);
                        default_pool_addition = (amouontRepay / 2);
                    }else if (interest > remainingOwed){
                        redemption_pool_addition = ((interest - remainingOwed) / 2);
                        default_pool_addition = ((interest - remainingOwed) / 2);
                    }
                    
                    // updated amount of DAI in REDEMPTION_POOL
                    REDEMPTION_POOL += ((redemption_pool_addition * (10**18))/100) ; // 10^18 decimals for DAI
                    DEFAULT_POOL += ((default_pool_addition * (10**18))/100) ; // 10^18 decimals for DAI
                    
                    borrowAccounts[msg.sender].amountPaidRedemptionPool += ((redemption_pool_addition * (10**18))/100);
                    borrowAccounts[msg.sender].amountPaidDefaultPool += ((default_pool_addition * (10**18))/100);
                    
                    borrows[borrowerLastBorrowId].amountOwed -= amouontRepay;
               }
               if (borrows[borrowerLastBorrowId].amountOwed == 0){
                   borrows[borrowerLastBorrowId].active =  false;
               }
                   
        }
        
        // Resend funds to borrower
        return repayOverAmount;
    }
    

    // ============ Private Functions ============

    function updateTotalAccruedInterest(
    ) 
        private 
        returns (uint256) 
    {
        uint256 totalSupply = ERC20(address(this)).totalSupply();
        uint256 blockAccruedInterestPrevious = BLOCK_ACCRUED_INTEREST;
        BLOCK_ACCRUED_INTEREST = block.number;
        TOTAL_ACCRUED_INTEREST += ((block.number - blockAccruedInterestPrevious) * totalSupply);
        return TOTAL_ACCRUED_INTEREST;
    }
    
    function updateAccountAccruedInterest(
    ) 
        private 
        returns (uint256) 
    {
        uint256 lastBlockAccrued = lendAccounts[msg.sender].lastBlockAccrued;
        uint256 balanceOf = ERC20(address(this)).balanceOf(msg.sender);
        
        lendAccounts[msg.sender].lastBlockAccrued = block.number;
        lendAccounts[msg.sender].totalAccruedInterest += ((block.number - lastBlockAccrued) * balanceOf);
        
        return lendAccounts[msg.sender].totalAccruedInterest;
    }
    
    // ============ Helper Functions ============
    function checkSuccess()
        private pure
        returns (bool)
      {
        uint256 returnValue = 0;
    
        /* solium-disable-next-line security/no-inline-assembly */
        assembly {
          // check number of bytes returned from last function call
          switch returndatasize
    
          // no bytes returned: assume success
          case 0x0 {
            returnValue := 1
          }
    
          // 32 bytes returned: check if non-zero
          case 0x20 {
            // copy 32 bytes into scratch space
            returndatacopy(0x0, 0x0, 0x20)
    
            // load those bytes into returnValue
            returnValue := mload(0x0)
          }
    
          // not sure what was returned: dont mark as success
          default { }
        }
    
        return returnValue != 0;
      }
}