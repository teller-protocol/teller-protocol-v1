const { NULL_BYTES } = require('./consts');

module.exports = {
    createInterestRequest:(lender, startTime, endTime, requestTime) => {
        return {
            lender: lender,
            startTime: startTime,
            endTime: endTime,
            requestTime: requestTime,
        }
    },
    createUnsignedInterestResponse: (signer, responseTime, interest, signerNonce) => {
        return {
            signer: signer,
            responseTime: responseTime,
            interest: interest,
            signature: {
                signerNonce: signerNonce,
                v: 0,
                r: NULL_BYTES,
                s: NULL_BYTES
            }
        }
    },
    createLoan: (
        loanID,
        loanTerms,
        termsExpiry,
        loanStartTime,
        collateral,
        lastCollateralIn,
        principalOwed, 
        interestOwed, 
        status,
        liquidated
    ) => {
        return {
            loanID: loanID,
            loanTerms: loanTerms,
            termsExpiry: termsExpiry,
            loanStartTime: loanStartTime,
            collateral: collateral,
            lastCollateralIn: lastCollateralIn,
            principalOwed: principalOwed,
            interestOwed: interestOwed,
            status: status,
            liquidated: liquidated,
        };
    },
    createLoanTerms: (borrower, recipient, interestRate, collateralRatio, maxLoanAmount, duration) => {
        return {
            borrower: borrower,
            recipient: recipient,
            interestRate: interestRate,
            collateralRatio: collateralRatio,
            maxLoanAmount: maxLoanAmount,
            duration: duration,
        }
    },
    createUnsignedLoanResponse: (signer, responseTime, interestRate, collateralRatio, maxLoanAmount, signerNonce) => {
        return {
            signer: signer,
            responseTime: responseTime,
            interestRate: interestRate,
            collateralRatio: collateralRatio,
            maxLoanAmount: maxLoanAmount,
            signature: {
                signerNonce: signerNonce,
                v: 0,
                r: NULL_BYTES,
                s: NULL_BYTES
            }
        }
    },
    createLoanRequest: (borrower, recipient, requestNonce, amount, duration, requestTime) => {
        return {
            borrower: borrower,
            recipient: recipient,
            requestNonce: requestNonce,
            amount: amount,
            duration: duration,
            requestTime: requestTime
        }
    }
}