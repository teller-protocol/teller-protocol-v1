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
    
    // total accrued interest
    uint256 TOTAL_ACCRUED_INTEREST = 0;
    
    // last block number of accrued interest
    uint256 BLOCK_ACCRUED_INTEREST = block.number;
    
    // amount of DAI remaining as unredeemed interest
    uint256 REDEMPTION_POOL = 0;
    
    // amount collateral locked in contract
    uint256 COLLATERAL_LOCKED = 0;
    
    // interest accrued from ledning account
    struct LendAccount {
        uint256 lastBlockAccrued;
        uint256 totalAccruedInterest;
    }
    
    // array of all lending accounts
    mapping (address => LendAccount) lendAccounts;
    
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
        uint256 maxBorrow;
        bool active;
        uint256 blockStart;
        uint256 blockEnd;
        address account;
        bool liquidated;
    }
    
    // mapping of all borrows 
    mapping (address => Borrow) borrows;
    
    // publically accessible array of all borrows
    Borrow[] public BorrowStucts;
    
    // mapping of all collateral deposits 
    mapping (address => uint256) _collaterals;
    
    // collateral deposited by borrower
    event collateralDeposited(address indexed borrower, uint256 amount);
    
    // collateral withdrawn by borrower
    event collateralWithdrawn(address indexed borrower, uint256 amount);
    
    // starting maximum borrow amount
    uint256 INITIAL_MAX_BORROW = 100; // setting initial max amount to 1 DAI. 100 = 1 DAI.
    
    // set borrow interest rate 
    uint256 BORROW_INTEREST_RATE = 20; // equates to 20% interest rate
    
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
        uint256 amountAvailableForWithdraw = ERC20(DAI_CONTRACT).balanceOf(address(this)) - COLLATERAL_LOCKED;
        
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
    
    // get accrued interest of specific account
    function getAccountAccruedInterest() public view returns(uint256) {
        return lendAccounts[msg.sender].totalAccruedInterest;
    }
    
    // get REDEMPTION_POOL
    function getRedemptionPool() public view returns(uint256) {
        return REDEMPTION_POOL;
    }
    
    // redeem interest from redemption pool 
    function redeemInterestFromPool() public returns (uint256) {
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
    function getCollateralNeeded(uint256 amouontBorrow) view public returns(uint256){
        uint256 poolContributions;
        for (uint256 j = 0; j < BorrowStucts.length; j++) {
            if (BorrowStucts[j].account == msg.sender && BorrowStucts[j].active ==  false){
               poolContributions+=(BorrowStucts[j].amountOwedInitial - BorrowStucts[j].amouontBorrow);
            }       
        }
        
        if (poolContributions >= amouontBorrow){
            return 0;
        }else{
            return (((amouontBorrow - poolContributions)*(10**18))/100); // return DAI units of collateral
        }
    }
    
    // get collateral of borrower
    function collateralsOf(address borrower) public view returns (uint256) {
        return _collaterals[borrower];
    }
    
    // borrower deposit collateral
    function depositCollateralBorrower(uint256 amount) public payable {
        
        ERC20(DAI_CONTRACT).transferFrom(msg.sender, address(this), amount);
        require(checkSuccess(), "ERC20#deposit: TRANSFER_FAILED");
        
        COLLATERAL_LOCKED += amount;
        
        _collaterals[msg.sender] = _collaterals[msg.sender].add(amount);
        emit collateralDeposited(msg.sender, amount);
    }
    
    // borrower withdraw collateral
    function withdrawCollateralBorrower(uint256 amount) public payable {
        
        // liquidate any outstanding unpaid borrows
        liquidateAll(msg.sender);
        
        // check for no outstanding borrows 
        uint256 outstandingBorrows = 0;
        for (uint256 j = 0; j < BorrowStucts.length; j++) {
            if (BorrowStucts[j].account == msg.sender && BorrowStucts[j].active ==  true){
               outstandingBorrows++;
            }       
        }
        require(outstandingBorrows==0, "Collateral#withdraw: OUTSTANDING_BORROW");
        
        if (_collaterals[msg.sender] > amount){
            _collaterals[msg.sender] -= amount;
            COLLATERAL_LOCKED -= amount;
            ERC20(DAI_CONTRACT).transfer(msg.sender, amount);
            require(checkSuccess(), "ERC20#withdraw: TRANSFER_FAILED");
            
            emit collateralWithdrawn(msg.sender, amount);
        }else{
            uint256 transfer_amount = _collaterals[msg.sender];
            _collaterals[msg.sender] = 0;
            COLLATERAL_LOCKED -= transfer_amount;
            ERC20(DAI_CONTRACT).transfer(msg.sender, transfer_amount);
            require(checkSuccess(), "ERC20#withdraw: TRANSFER_FAILED");
            emit collateralWithdrawn(msg.sender, _collaterals[msg.sender]);
        }
        
    }
    
    // liquidate unpaid borrows
    function liquidateAll(address borrower) public{
        bool liquidatedBorrow = false;
        for (uint256 j = 0; j < BorrowStucts.length; j++) {
            if (BorrowStucts[j].account == borrower && BorrowStucts[j].active ==  true && block.number > BorrowStucts[j].blockEnd){
                _collaterals[borrower] -= ((BorrowStucts[j].amountOwed * (10**18))/100);
                COLLATERAL_LOCKED -= ((BorrowStucts[j].amountOwed * (10**18))/100);
                REDEMPTION_POOL += ((BorrowStucts[j].amountOwed * (10**18))/100);
                liquidatedBorrow = true;
            }       
        }
        
        if (liquidatedBorrow){
           for (uint256 j = 0; j < BorrowStucts.length; j++) {
                BorrowStucts[j].liquidated = true;
            } 
        }
    } 
    
    // calculate maximum borrow of account
    function maxBorrow() view public returns (uint256) {
        uint256 percentBorrowedOfMax;
        uint256 senderBorrowCount;
        for (uint256 j = 0; j < BorrowStucts.length; j++) {
            if (BorrowStucts[j].account == msg.sender && BorrowStucts[j].liquidated == false){
                senderBorrowCount++;
                percentBorrowedOfMax += (( (BorrowStucts[j].amouontBorrow * (10**18)) / BorrowStucts[j].maxBorrow )); // multiplier (10**18) used to maintain number above decimal
            }       
        }
        
        if (senderBorrowCount==0){
            return INITIAL_MAX_BORROW;
        }
        
        uint256 n = ((percentBorrowedOfMax/senderBorrowCount) * senderBorrowCount)/(10**18); // removed multiplier by dividing by (10**18)
        if (n==0){n=1;}
        
        uint256 maxBorrowInt = 11**n;
        if (n==1){ 
            maxBorrowInt = 110; 
        } else {
            maxBorrowInt = maxBorrowInt / (10**(n-2));
        }
        
        return maxBorrowInt;
    }
    
    // retrieve all borrows
    function getAllBorrows() view public returns(Borrow[] memory) {
        return BorrowStucts;
    }
    
    // retrieve latest borrow by account
    function getLatestBorrow(address account) view public returns (Borrow memory) {
        return (borrows[account]);
    }
    
    function createBorrow(uint256 amouontBorrow) public returns(bool) {
        // cannot withdraw collateral
        uint256 amountAvailableForWithdraw = ((ERC20(address(this)).balanceOf(msg.sender) - COLLATERAL_LOCKED) / (10**18))*100;
        
        // only allow withdraw up to available
        if (amouontBorrow > amountAvailableForWithdraw){
            amouontBorrow = amountAvailableForWithdraw;
        }
        
        // check if any outstanding borrows
        for (uint256 j = 0; j < BorrowStucts.length; j++) {
            if (BorrowStucts[j].account == msg.sender && BorrowStucts[j].active ==  true){
               return false;
            }       
        }
        
        uint256 maxBorrowAccount = maxBorrow();
        
        // revert if amouontBorrow > maxBorrow
        if (amouontBorrow > maxBorrowAccount){
            return false;
        }
        
        // check if collateralDeposited > getCollateralNeeded
        if (getCollateralNeeded(amouontBorrow) > collateralsOf(msg.sender)){
            return false;
        }
        
        // create borrow
        Borrow storage borrow = borrows[msg.sender];
        
        borrow.amouontBorrow = amouontBorrow;
        borrow.amountOwed = (amouontBorrow*(100+BORROW_INTEREST_RATE))/100; // using 100 multiplier to maintain number above decimal
        borrow.amountOwedInitial = (amouontBorrow*(100+BORROW_INTEREST_RATE))/100;
        borrow.maxBorrow = maxBorrowAccount;
        borrow.active = true;
        borrow.blockStart = block.number;
        borrow.blockEnd = block.number + MAX_BLOCKS_BORROW;
        borrow.account = msg.sender;
        borrow.liquidated = false;
        
        BorrowStucts.push(borrow);
        
        ERC20(DAI_CONTRACT).transfer(msg.sender, ( (amouontBorrow * (10**18)) / 100 ));
        require(checkSuccess(), "ERC20#withdraw: TRANSFER_FAILED");
        
        emit borrowInitiated(msg.sender, borrow);
        
        return true;
    }
    
    function repayBorrow(uint256 amouontRepay) public returns(uint256) {
        uint256 repayOverAmount;
        for (uint256 j = 0; j < BorrowStucts.length; j++) {
            if (BorrowStucts[j].account == msg.sender && BorrowStucts[j].active ==  true){
               
               // set initial redemption pool additional value to zero
               uint256 redemption_pool_addition = 0;
               
               // calculate general borrow interest
               uint256 interest = BorrowStucts[j].amountOwedInitial - BorrowStucts[j].amouontBorrow;
               
               if (amouontRepay > BorrowStucts[j].amountOwed){
                   repayOverAmount += (amouontRepay - BorrowStucts[j].amountOwed);
                   
                    // transfer DAI to this address from borrow address
                    ERC20(DAI_CONTRACT).transferFrom(msg.sender, address(this), ((BorrowStucts[j].amountOwed * (10**18))/100) );
                    require(checkSuccess(), "ERC20#deposit: TRANSFER_FAILED");
                    
                    // update redemption_pool_addition based on previous paybacks
                    if (interest > BorrowStucts[j].amountOwed){
                        redemption_pool_addition = BorrowStucts[j].amountOwed;
                    }else{
                        redemption_pool_addition = interest;
                    }
                    
                    // updated amount of DAI in REDEMPTION_POOL
                    REDEMPTION_POOL += ((redemption_pool_addition * (10**18))/100) ; // 10^18 decimals for DAI
                   
                    BorrowStucts[j].amountOwed = 0;
               }else{
                    // transfer DAI to this address from borrow address
                    ERC20(DAI_CONTRACT).transferFrom(msg.sender, address(this), ((amouontRepay * (10**18))/100) );
                    require(checkSuccess(), "ERC20#deposit: TRANSFER_FAILED");
                    
                    // update redemption_pool_addition based on previous paybacks
                    uint256 remainingOwed = BorrowStucts[j].amountOwed - amouontRepay;
                    if (interest > BorrowStucts[j].amountOwed){
                        redemption_pool_addition = amouontRepay;
                    }else if (interest > remainingOwed){
                        redemption_pool_addition = interest - remainingOwed;
                    }
                    
                    // updated amount of DAI in REDEMPTION_POOL
                    REDEMPTION_POOL += ((redemption_pool_addition * (10**18))/100) ; // 10^18 decimals for DAI
                    
                    BorrowStucts[j].amountOwed -= amouontRepay;
               }
               if (BorrowStucts[j].amountOwed == 0){
                   BorrowStucts[j].active =  false;
               }
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