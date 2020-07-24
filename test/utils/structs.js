const { NULL_BYTES } = require('./consts');

module.exports = {
    createInterestRequest:(lender, startTime, endTime, requestTime, consensusAddress,) => {
        return {
            lender: lender,
            consensusAddress,
            startTime: startTime,
            endTime: endTime,
            requestTime: requestTime,
        }
    },
    createUnsignedInterestResponse: (signer, responseTime, interest, signerNonce, consensusAddress) => {
        return {
            signer: signer,
            consensusAddress,
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
    createUnsignedLoanResponse: (signer, responseTime, interestRate, collateralRatio, maxLoanAmount, signerNonce, consensusAddress = undefined) => {
        return {
            signer: signer,
            consensusAddress,
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
    createLoanRequest: (borrower, recipient, requestNonce, amount, duration, requestTime, consensusAddress) => {
        return {
            borrower: borrower,
            recipient: recipient,
            consensusAddress,
            requestNonce: requestNonce,
            amount: amount,
            duration: duration,
            requestTime: requestTime,
        }
    }
}