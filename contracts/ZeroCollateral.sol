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

pragma solidity ^0.5.0;
pragma experimental ABIEncoderV2;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20Detailed.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "openzeppelin-solidity/contracts/access/roles/MinterRole.sol";
import "./Chainlink.sol";

/**
 * @title ZeroCollateralMain
 * @author Fabrx Labs Inc.
 *
 * Zero Collateral Main Contract
 *
 * Values of borrows are dictated in 2 decimals. All other values dictated in DAI (18 decimals).
 */

 contract ZeroCollateralMain is ERC20Detailed, ERC20, MinterRole, Chainlink {
    using SafeMath for uint256;

    // ============ State Variables ============

    // address of the DAI Contract
    address public DAI_CONTRACT;

     // address of the Zero Collateral DAO Wallet
    address public ZC_DAO_CONTRACT;

    // borrow count
    uint256 borrowCount = 0;

    // total accrued interest
    uint256 public totalAccruedInterest = 0;

    // last block number of accrued interest
    uint256 BLOCK_ACCRUED_INTEREST = block.number;

    // amount of DAI remaining as unredeemed interest
    uint256 public unredeemedDAIIntered = 0;

    // amount of DAI remaining as unredeemed interest
    uint256 DEFAULT_POOL = 0;

    // amount collateral locked in contract
    uint256 public collateralLocked = 0;

    // interest accrued from lending account
    struct LendAccount {
        uint256 lastBlockAccrued;
        uint256 totalAccruedInterest;
    }

    // array of all lending accounts
    mapping (address => LendAccount) lenderAccounts;

    // borrower account details
    struct BorrowAccount {
        uint256 lastBorrowId;
        uint256 amountPaidRedemptionPool;
        uint256 amountPaidDefaultPool;
        uint256 collateralRedeemable;
        uint256 collateralNonRedeemable;
    }

    // array of all borrower accounts
    mapping (address => BorrowAccount) borrowerAccounts;
    
    // data per borrow as struct
    struct Borrow {
        uint256 amountBorrow;
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
    Borrow[] public borrowStucts;

    // collateral deposited by borrower
    event CollateralDeposited(address indexed borrower, uint256 amount);

    // collateral withdrawn by borrower
    event CollateralWithdrawn(address indexed borrower, uint256 amount);

    // borrow event initiated
    event BorrowInitiated(address indexed borrower, Borrow borrow);

    // ============ Constructor ============

    constructor(
        address daiContract,
        address daoContract,
        string memory name,
        string memory symbol,
        uint8 decimals
    )
    ERC20Detailed(
        name,
        symbol,
        decimals
    )
        public
    {
        DAI_CONTRACT = daiContract;
        ZC_DAO_CONTRACT = daoContract;
    }

    // ============ Public Functions ============

    // lend DAI, mint ZDAI
    function mintZDAI(
        uint256 amount
    )
        public
        returns (uint256)
    {
        require(IERC20(DAI_CONTRACT).transferFrom(msg.sender, address(this), amount));

        updateTotalAccruedInterest();
        updateAccountAccruedInterest();

        _mint(msg.sender, amount);

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
        uint256 amountAvailableForWithdraw = IERC20(DAI_CONTRACT).balanceOf(address(this))
        amountAvailableForWithdraw = amountAvailableForWithdraw.sub(collateralLocked.sub(DEFAULT_POOL.sub(unredeemedDAIIntered)));

        // only allow withdraw up to available
        uint256 finalAmount = amount
        if (amount > amountAvailableForWithdraw){
            finalAmount = amountAvailableForWithdraw;
        }
        
        updateTotalAccruedInterest();
        updateAccountAccruedInterest();
        
        _burn(msg.sender, finalAmount);
        
        require(IERC20(DAI_CONTRACT).transfer(msg.sender, finalAmount));
        
        return finalAmount;
    }
    
    // call update total accrued interest
    function callUpdateTotalAccruedInterest() public returns(uint256) {
        updateTotalAccruedInterest();
        return totalAccruedInterest;
    }
    
    // get accrued interest of sender account
    function getAccountAccruedInterest() public view returns(uint256) {
        return lenderAccounts[msg.sender].totalAccruedInterest;
    }
    
    // call update accrued interest of sender account
    function callUpdateAccountAccruedInterest() public returns(uint256) {
        updateTotalAccruedInterest();
        updateAccountAccruedInterest();
        return lenderAccounts[msg.sender].totalAccruedInterest;
    }
    
    // get unredeemedDAIIntered
    function getRedemptionPool() public view returns(uint256) {
        return unredeemedDAIIntered;
    }
    
    // get DEFAULT_POOL
    function getDefaultPool() public view returns(uint256) {
        return DEFAULT_POOL;
    }
    
    // get collateralLocked
    function getCollateralLocked() public view returns(uint256) {
        return collateralLocked;
    }
    
    // redeem interest from redemption pool 
    function redeemInterestFromPool() public returns (uint256) {
        // update redeemable interest
        updateTotalAccruedInterest();
        updateAccountAccruedInterest();
        
         // calculated interest_redeemable as amount of DAI in decimals
        uint256 interest_redeemable = ((lenderAccounts[msg.sender].totalAccruedInterest * unredeemedDAIIntered) / totalAccruedInterest) ;
        
        // update totalAccruedInterest
        totalAccruedInterest -= lenderAccounts[msg.sender].totalAccruedInterest;
        
        // set accrued interest of lender to 0
        lenderAccounts[msg.sender].totalAccruedInterest = 0;
        
        // update unredeemedDAIIntered
        unredeemedDAIIntered -= interest_redeemable;
        
        // transfer DAI to lender
        ERC20(DAI_CONTRACT).transfer(msg.sender, interest_redeemable);
        require(checkSuccess(), "ERC20#withdraw: TRANSFER_FAILED");
        
        // emit event of redemption
        emit Redeemed(msg.sender, interest_redeemable);
        
        return interest_redeemable;
    }
    
    // calculate borrower collateral needed for specific borrow. collateral in value of DAI
    function getCollateralNeeded(uint256 amountBorrow) view public returns(uint256){
        uint256 poolContributions = (borrowerAccounts[msg.sender].amountPaidRedemptionPool);
        uint256 amountBorrowDecimals = amountBorrow*(10**16); // convert to DAI decimals
        
        if (poolContributions >= amountBorrowDecimals){
            return 0;
        }else{
            return ( amountBorrowDecimals - poolContributions ); // return DAI units of collateral
        }
    }
    
    // get total collateral of borrower
    function collateralsOf(address borrower) public view returns (uint256) {
        uint256 totalCollateral = borrowerAccounts[borrower].collateralRedeemable + borrowerAccounts[borrower].collateralNonRedeemable;
        return totalCollateral;
    }
    
    // get redeemable collateral of borrower
    function getRedeemableCollateral(address borrower) public view returns (uint256) {
        uint256 redeemableCollateral = borrowerAccounts[borrower].collateralRedeemable;
        return redeemableCollateral;
    }
    
    // get borrower account
    function getBorrowAccount(address borrower) public view returns (BorrowAccount memory) {
        return borrowerAccounts[borrower];
    }
    
    // borrower deposit redeemable collateral
    function depositCollateralRedeemableBorrower(uint256 amount) public payable {
        
        ERC20(DAI_CONTRACT).transferFrom(msg.sender, address(this), amount);
        require(checkSuccess(), "ERC20#deposit: TRANSFER_FAILED");
        
        collateralLocked += amount;
        
        // updated account collateral redeemable
        borrowerAccounts[msg.sender].collateralRedeemable += amount;
        emit collateralDeposited(msg.sender, amount);
    }
    
    // borrower deposit non-redeemable collateral
    function depositCollateralNonredeemableBorrower(uint256 amount) public payable {
        
        ERC20(DAI_CONTRACT).transferFrom(msg.sender, address(this), amount);
        require(checkSuccess(), "ERC20#deposit: TRANSFER_FAILED");
        
        DEFAULT_POOL += amount;
        
        // updated account collateral redeemable
        borrowerAccounts[msg.sender].collateralNonRedeemable += amount;
        emit collateralDeposited(msg.sender, amount);
    }
    
    // borrower withdraw collateral
    function withdrawCollateralBorrower(uint256 amount) public payable {
        
        // liquidate any outstanding unpaid borrows
        liquidate(msg.sender);
        
        // check for no outstanding borrow
        uint256 borrowerLastBorrowId = borrowerAccounts[msg.sender].lastBorrowId;
        if (borrowerLastBorrowId != 0){
            bool outstandingBorrow = getBorrow(borrowerLastBorrowId).active;
            require(outstandingBorrow==false, "Collateral#withdraw: OUTSTANDING_BORROW");
        }
        
        if (borrowerAccounts[msg.sender].collateralRedeemable > amount){
            borrowerAccounts[msg.sender].collateralRedeemable -= amount;
            collateralLocked -= amount;
            ERC20(DAI_CONTRACT).transfer(msg.sender, amount);
            require(checkSuccess(), "ERC20#withdraw: TRANSFER_FAILED");
            
            emit collateralWithdrawn(msg.sender, amount);
        }else{
            uint256 transfer_amount = borrowerAccounts[msg.sender].collateralRedeemable;
            borrowerAccounts[msg.sender].collateralRedeemable = 0;
            collateralLocked -= transfer_amount;
            ERC20(DAI_CONTRACT).transfer(msg.sender, transfer_amount);
            require(checkSuccess(), "ERC20#withdraw: TRANSFER_FAILED");
            
            emit collateralWithdrawn(msg.sender, borrowerAccounts[msg.sender].collateralRedeemable);
        }
        
    }
    
    // liquidate unpaid borrows
    function liquidate(address borrower) public{
        
        uint256 borrowerLastBorrowId = borrowerAccounts[borrower].lastBorrowId;
        
        if (borrows[borrowerLastBorrowId].active ==  true && block.timestamp > borrows[borrowerLastBorrowId].blockEnd){
            // set old amount paid to DEFAULT_POOL
            uint256 oldAmountPaidDefaultPool = borrowerAccounts[borrower].amountPaidDefaultPool;
            
            // liquidate account
            borrowerAccounts[borrower].amountPaidRedemptionPool = 0;
            borrowerAccounts[borrower].amountPaidDefaultPool = 0;
            
            
            // amount owed from loan
            uint256 amountOwedDAI = ((borrows[borrowerLastBorrowId].amountOwed * (10**18))/100);
            
            if (amountOwedDAI > oldAmountPaidDefaultPool){
                uint256 liquidatedCollateral = amountOwedDAI - oldAmountPaidDefaultPool;
                
                // primary liquidation: non-redeemable collateral
                if (liquidatedCollateral > borrowerAccounts[borrower].collateralNonRedeemable){
                    // update collateralNonRedeemable
                    uint256 oldCollateralNonRedeemable = borrowerAccounts[borrower].collateralNonRedeemable;
                    
                    borrowerAccounts[borrower].collateralNonRedeemable = 0;
                    liquidatedCollateral -= oldCollateralNonRedeemable;
                    
                    // update default pool (where non-redeemable collateral resides)
                    DEFAULT_POOL -= oldCollateralNonRedeemable;
                    unredeemedDAIIntered += oldCollateralNonRedeemable;
                    
                }else{
                    // update collateralNonRedeemable
                    borrowerAccounts[borrower].collateralNonRedeemable -= liquidatedCollateral;
                    
                    // update default pool (where non-redeemable collateral resides)
                    DEFAULT_POOL -= liquidatedCollateral;
                    unredeemedDAIIntered += liquidatedCollateral;
                    
                    // set liquidatedCollateral to 0
                    liquidatedCollateral = 0;
                    
                }
                
                // secondary liquidation: redeemable collateral
                if (liquidatedCollateral > borrowerAccounts[borrower].collateralRedeemable){
                    // update collateralRedeemable
                    uint256 oldCollateralRedeemable = borrowerAccounts[borrower].collateralRedeemable;
                    borrowerAccounts[borrower].collateralRedeemable = 0;
                    liquidatedCollateral -= oldCollateralRedeemable;
                
                    // update collateral locked
                    collateralLocked -= oldCollateralRedeemable;
                    unredeemedDAIIntered += oldCollateralRedeemable;
                }else{
                    // update collateralRedeemable
                    borrowerAccounts[borrower].collateralRedeemable -= liquidatedCollateral;
                    
                    // update collateral locked
                    collateralLocked -= liquidatedCollateral;
                    unredeemedDAIIntered += liquidatedCollateral;
                    
                    // set liquidatedCollateral to 0
                    liquidatedCollateral = 0;
                }
                
            }
            
            borrows[borrowerLastBorrowId].liquidated = true;
            borrows[borrowerLastBorrowId].active = false;
        } 
    }
    
    // calculate interest rate given number of days (0 decimals)
    function calculateInterestWithDays(uint256 numberDays) view public returns (uint256) {
        // max term 365 days
        require(numberDays <= 365, "Number Days: MORE THAN 365");
        
        uint256 interest_rate = 12 * (10**18);
        
        if (numberDays <= 7){
            interest_rate = (0*(10**18)) + (( (1*(10**18)) * (numberDays - 0)) / 7 );
        }else if (7 < numberDays && numberDays <= 14){
            interest_rate = (1*(10**18)) + (( (5*(10**17)) * (numberDays - 7)) / 7 );
        }else if (14 < numberDays && numberDays <= 30){
            interest_rate = (15*(10**17)) + (( (1*(10**18)) * (numberDays - 14)) / 14 );
        }else if (30 < numberDays && numberDays <= 60){
            interest_rate = (25*(10**17)) + (( (15*(10**17)) * (numberDays - 30)) / 30 );
        }else if (60 < numberDays && numberDays <= 120){
            interest_rate = (4*(10**18)) + (( (2*(10**18)) * (numberDays - 60)) / 60 );
        }else if (120 < numberDays && numberDays <= 180){
            interest_rate = (6*(10**18)) + (( (2*(10**18)) * (numberDays - 120)) / 60 );
        }else if (180 < numberDays && numberDays <= 365){
            interest_rate = (8*(10**18)) + (( (4*(10**18)) * (numberDays - 180)) / 185 );
        }
         
         return interest_rate;
    }
    
    function calculateInterestDiscount(uint256 amountBorrow, uint256 numberDays) view public returns (uint256) {
        
        // calculate % of interest paid (18 decimals) + collateralNonRedeemable (18 decimals), divided by borrow amount (2 decimals). Resulting 16 decimals.
        uint256 x = ((borrowerAccounts[msg.sender].amountPaidRedemptionPool + borrowerAccounts[msg.sender].collateralNonRedeemable)) / amountBorrow;
        
        if (x > (10**16)){
            x = (10**16);
        }
        
        // interest rate discount calculated
        uint256 interest_rate = calculateInterestWithDays(numberDays); // 18 decimals
        uint256 interest_rate_discount = interest_rate - (((interest_rate * x)/3)  / (10**16)); // 18 decimals
         
         return interest_rate_discount;
    }
    
    // retrieve all borrows
    function getAllBorrows() view public returns(Borrow[] memory) {
        return BorrowStucts;
    }
    
    // retrieve borrow by id
    function getBorrow(uint256 id) view public returns (Borrow memory) {
        return (borrows[id]);
    }
    
    function createBorrow(uint256 amountBorrow, uint256 numberDays) public returns(bool) {
        // max term 365 days
        require(numberDays <= 365, "Number Days: MORE THAN 365");
        
        // cannot withdraw collateral
        uint256 amountAvailableForWithdraw = (ERC20(DAI_CONTRACT).balanceOf(address(this)) - collateralLocked - DEFAULT_POOL - unredeemedDAIIntered) / (10**16);
        
        // only allow withdraw up to available
        if (amountBorrow > amountAvailableForWithdraw){
            amountBorrow = amountAvailableForWithdraw;
        }
        
        // check if any outstanding borrows
        uint256 borrowerLastBorrowId = borrowerAccounts[msg.sender].lastBorrowId;
        
        if (borrowerLastBorrowId != 0){
            if (getBorrow(borrowerLastBorrowId).active ==  true){
                return false;
            }
        }
        
        
        // check if collateralDeposited > getCollateralNeeded
        if (getCollateralNeeded(amountBorrow) > collateralsOf(msg.sender)){
            return false;
        }
        
        // increment borrow count
        borrowCount++;
        
        // create borrow
        Borrow storage borrow = borrows[borrowCount];
        
        uint256 BORROW_INTEREST_RATE = (calculateInterestDiscount(amountBorrow, numberDays));
        
        borrow.amountBorrow = amountBorrow;
        borrow.amountOwed = amountBorrow + (amountBorrow*BORROW_INTEREST_RATE)/(10**20); // divided by 18 + 2 decimals to remove inerest rate decimals
        borrow.amountOwedInitial = amountBorrow + (amountBorrow*BORROW_INTEREST_RATE)/(10**20);
        borrow.active = true;
        borrow.blockStart = block.timestamp;
        borrow.blockEnd = block.timestamp + (numberDays * 60*60*24);
        borrow.account = msg.sender;
        borrow.liquidated = false;
        borrow.id = borrowCount;
        
        if (borrow.amountBorrow == borrow.amountOwedInitial){
            borrow.amountOwed = amountBorrow + 1;
            borrow.amountOwedInitial = amountBorrow + 1;
        }
        
        BorrowStucts.push(borrow);
        borrowerAccounts[msg.sender].lastBorrowId = borrowCount;
        
        ERC20(DAI_CONTRACT).transfer(msg.sender, ( (amountBorrow * (10**18)) / 100 ));
        require(checkSuccess(), "ERC20#withdraw: TRANSFER_FAILED");
        
        emit borrowInitiated(msg.sender, borrow);
        
        return true;
    }
    
    function repayBorrow(uint256 amouontRepay) public returns(uint256) {
        uint256 repayOverAmount;
        
        uint256 borrowerLastBorrowId = borrowerAccounts[msg.sender].lastBorrowId;
        
            if (borrows[borrowerLastBorrowId].active ==  true){
               
               // set initial redemption pool additional value to zero
               uint256 unredeemedDAIIntered_addition = 0;
               uint256 default_pool_addition = 0;
               
               // calculate general borrow interest
               uint256 interest = borrows[borrowerLastBorrowId].amountOwedInitial - borrows[borrowerLastBorrowId].amountBorrow;
               
               if (amouontRepay > borrows[borrowerLastBorrowId].amountOwed){
                   repayOverAmount += (amouontRepay - borrows[borrowerLastBorrowId].amountOwed);
                   
                    // transfer DAI to this address from borrow address
                    ERC20(DAI_CONTRACT).transferFrom(msg.sender, address(this), ((borrows[borrowerLastBorrowId].amountOwed * (10**18))/100) );
                    require(checkSuccess(), "ERC20#deposit: TRANSFER_FAILED");
                    
                    // update unredeemedDAIIntered_addition based on previous paybacks
                    if (interest > borrows[borrowerLastBorrowId].amountOwed){
                        unredeemedDAIIntered_addition = (borrows[borrowerLastBorrowId].amountOwed / 2);
                        default_pool_addition = (borrows[borrowerLastBorrowId].amountOwed / 2);
                    }else{
                        unredeemedDAIIntered_addition = (interest / 2);
                        default_pool_addition = (interest / 2);
                    }
                    
                    // split redepmtion pool and dao funding amounts
                    uint256 dao_funding_amount = (((unredeemedDAIIntered_addition * (10**18))/100) * 2)/10;
                    uint256 unredeemedDAIIntered_amount = (((unredeemedDAIIntered_addition * (10**18))/100) * 8)/10;
                    
                    // updated amount of DAI in unredeemedDAIIntered & DEFAULT_POOL
                    unredeemedDAIIntered += unredeemedDAIIntered_amount; // 10^18 decimals for DAI
                    DEFAULT_POOL += ((default_pool_addition * (10**18))/100) ; // 10^18 decimals for DAI
                    
                    borrowerAccounts[msg.sender].amountPaidRedemptionPool += unredeemedDAIIntered_amount;
                    borrowerAccounts[msg.sender].amountPaidDefaultPool += ((default_pool_addition * (10**18))/100);
                   
                    borrows[borrowerLastBorrowId].amountOwed = 0;
                    
                    // transfer DAI to ZC DAO wallet from this address
                    ERC20(DAI_CONTRACT).transfer(ZC_DAO_CONTRACT, dao_funding_amount);
                    require(checkSuccess(), "ERC20#dao_funding: TRANSFER_FAILED");
                    
                    
               }else{
                    // transfer DAI to this address from borrow address
                    ERC20(DAI_CONTRACT).transferFrom(msg.sender, address(this), ((amouontRepay * (10**18))/100) );
                    require(checkSuccess(), "ERC20#deposit: TRANSFER_FAILED");
                    
                    // update unredeemedDAIIntered_addition based on previous paybacks
                    uint256 remainingOwed = borrows[borrowerLastBorrowId].amountOwed - amouontRepay;
                    if (interest > borrows[borrowerLastBorrowId].amountOwed){
                        unredeemedDAIIntered_addition = (amouontRepay / 2);
                        default_pool_addition = (amouontRepay / 2);
                    }else if (interest > remainingOwed){
                        unredeemedDAIIntered_addition = ((interest - remainingOwed) / 2);
                        default_pool_addition = ((interest - remainingOwed) / 2);
                    }
                    
                    // split redepmtion pool and dao funding amounts
                    uint256 dao_funding_amount = (((unredeemedDAIIntered_addition * (10**18))/100) * 2)/10;
                    uint256 unredeemedDAIIntered_amount = (((unredeemedDAIIntered_addition * (10**18))/100) * 8)/10;
                    
                    // updated amount of DAI in unredeemedDAIIntered
                    unredeemedDAIIntered += unredeemedDAIIntered_amount; // 10^18 decimals for DAI
                    DEFAULT_POOL += ((default_pool_addition * (10**18))/100) ; // 10^18 decimals for DAI
                    
                    borrowerAccounts[msg.sender].amountPaidRedemptionPool += unredeemedDAIIntered_amount;
                    borrowerAccounts[msg.sender].amountPaidDefaultPool += ((default_pool_addition * (10**18))/100);
                    
                    borrows[borrowerLastBorrowId].amountOwed -= amouontRepay;
                    
                    // transfer DAI to ZC DAO wallet from this address
                    ERC20(DAI_CONTRACT).transfer(ZC_DAO_CONTRACT, dao_funding_amount);
                    require(checkSuccess(), "ERC20#dao_funding: TRANSFER_FAILED");
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
        totalAccruedInterest += ((block.number - blockAccruedInterestPrevious) * totalSupply);
        return totalAccruedInterest;
    }
    
    function updateAccountAccruedInterest(
    ) 
        private 
        returns (uint256) 
    {
        uint256 lastBlockAccrued = lenderAccounts[msg.sender].lastBlockAccrued;
        uint256 balanceOf = ERC20(address(this)).balanceOf(msg.sender);
        
        lenderAccounts[msg.sender].lastBlockAccrued = block.number;
        lenderAccounts[msg.sender].totalAccruedInterest += ((block.number - lastBlockAccrued) * balanceOf);
        
        return lenderAccounts[msg.sender].totalAccruedInterest;
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