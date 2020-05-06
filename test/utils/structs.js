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
    createLoanInfo: (borrowerIndex, collateralRatio, maxLoanAmount, interestRate) => {
        return {
            interestRate,
            collateralRatio,
            borrowerIndex,
            signerIndex: 0,
            maxLoanAmount,
            numberDays: 10,
            signerNonce: 0,
            takeOutLoanValue: 1,
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