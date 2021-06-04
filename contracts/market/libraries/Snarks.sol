// SPDX-License-Identifier: LGPL-3.0-only
// This file is LGPL3 Licensed
pragma solidity ^0.8.0;

/**
 * @title Elliptic curve operations on twist points for alt_bn128
 * @author Mustafa Al-Bassam (mus@musalbas.com)
 * @dev Homepage: https://github.com/musalbas/solidity-BN256G2
 */

library BN256G2 {
    uint256 internal constant FIELD_MODULUS =
        0x30644e72e131a029b85045b68181585d97816a916871ca8d3c208c16d87cfd47;
    uint256 internal constant TWISTBX =
        0x2b149d40ceb8aaae81be18991be06ac3b5b4c5e559dbefa33267e6dc24a138e5;
    uint256 internal constant TWISTBY =
        0x9713b03af0fed4cd2cafadeed8fdf4a74fa084e52d1852e4a2bd0685c315d2;
    uint256 internal constant PTXX = 0;
    uint256 internal constant PTXY = 1;
    uint256 internal constant PTYX = 2;
    uint256 internal constant PTYY = 3;
    uint256 internal constant PTZX = 4;
    uint256 internal constant PTZY = 5;

    /**
     * @notice Add two twist points
     * @param pt1xx Coefficient 1 of x on point 1
     * @param pt1xy Coefficient 2 of x on point 1
     * @param pt1yx Coefficient 1 of y on point 1
     * @param pt1yy Coefficient 2 of y on point 1
     * @param pt2xx Coefficient 1 of x on point 2
     * @param pt2xy Coefficient 2 of x on point 2
     * @param pt2yx Coefficient 1 of y on point 2
     * @param pt2yy Coefficient 2 of y on point 2
     * @return (pt3xx, pt3xy, pt3yx, pt3yy)
     */
    function ECTwistAdd(
        uint256 pt1xx,
        uint256 pt1xy,
        uint256 pt1yx,
        uint256 pt1yy,
        uint256 pt2xx,
        uint256 pt2xy,
        uint256 pt2yx,
        uint256 pt2yy
    )
        public
        view
        returns (
            uint256,
            uint256,
            uint256,
            uint256
        )
    {
        if (pt1xx == 0 && pt1xy == 0 && pt1yx == 0 && pt1yy == 0) {
            if (!(pt2xx == 0 && pt2xy == 0 && pt2yx == 0 && pt2yy == 0)) {
                assert(_isOnCurve(pt2xx, pt2xy, pt2yx, pt2yy));
            }
            return (pt2xx, pt2xy, pt2yx, pt2yy);
        } else if (pt2xx == 0 && pt2xy == 0 && pt2yx == 0 && pt2yy == 0) {
            assert(_isOnCurve(pt1xx, pt1xy, pt1yx, pt1yy));
            return (pt1xx, pt1xy, pt1yx, pt1yy);
        }

        assert(_isOnCurve(pt1xx, pt1xy, pt1yx, pt1yy));
        assert(_isOnCurve(pt2xx, pt2xy, pt2yx, pt2yy));

        uint256[6] memory pt3 =
            _ECTwistAddJacobian(
                pt1xx,
                pt1xy,
                pt1yx,
                pt1yy,
                1,
                0,
                pt2xx,
                pt2xy,
                pt2yx,
                pt2yy,
                1,
                0
            );

        return
            _fromJacobian(
                pt3[PTXX],
                pt3[PTXY],
                pt3[PTYX],
                pt3[PTYY],
                pt3[PTZX],
                pt3[PTZY]
            );
    }

    /**
     * @notice Multiply a twist point by a scalar
     * @param s     Scalar to multiply by
     * @param pt1xx Coefficient 1 of x
     * @param pt1xy Coefficient 2 of x
     * @param pt1yx Coefficient 1 of y
     * @param pt1yy Coefficient 2 of y
     * @return (pt2xx, pt2xy, pt2yx, pt2yy)
     */
    function ECTwistMul(
        uint256 s,
        uint256 pt1xx,
        uint256 pt1xy,
        uint256 pt1yx,
        uint256 pt1yy
    )
        public
        view
        returns (
            uint256,
            uint256,
            uint256,
            uint256
        )
    {
        uint256 pt1zx = 1;
        if (pt1xx == 0 && pt1xy == 0 && pt1yx == 0 && pt1yy == 0) {
            pt1xx = 1;
            pt1yx = 1;
            pt1zx = 0;
        } else {
            assert(_isOnCurve(pt1xx, pt1xy, pt1yx, pt1yy));
        }

        uint256[6] memory pt2 =
            _ECTwistMulJacobian(s, pt1xx, pt1xy, pt1yx, pt1yy, pt1zx, 0);

        return
            _fromJacobian(
                pt2[PTXX],
                pt2[PTXY],
                pt2[PTYX],
                pt2[PTYY],
                pt2[PTZX],
                pt2[PTZY]
            );
    }

    /**
     * @notice Get the field modulus
     * @return The field modulus
     */
    function GetFieldModulus() public pure returns (uint256) {
        return FIELD_MODULUS;
    }

    function submod(
        uint256 a,
        uint256 b,
        uint256 n
    ) internal pure returns (uint256) {
        return addmod(a, n - b, n);
    }

    function _FQ2Mul(
        uint256 xx,
        uint256 xy,
        uint256 yx,
        uint256 yy
    ) internal pure returns (uint256, uint256) {
        return (
            submod(
                mulmod(xx, yx, FIELD_MODULUS),
                mulmod(xy, yy, FIELD_MODULUS),
                FIELD_MODULUS
            ),
            addmod(
                mulmod(xx, yy, FIELD_MODULUS),
                mulmod(xy, yx, FIELD_MODULUS),
                FIELD_MODULUS
            )
        );
    }

    function _FQ2Muc(
        uint256 xx,
        uint256 xy,
        uint256 c
    ) internal pure returns (uint256, uint256) {
        return (mulmod(xx, c, FIELD_MODULUS), mulmod(xy, c, FIELD_MODULUS));
    }

    function _FQ2Add(
        uint256 xx,
        uint256 xy,
        uint256 yx,
        uint256 yy
    ) internal pure returns (uint256, uint256) {
        return (addmod(xx, yx, FIELD_MODULUS), addmod(xy, yy, FIELD_MODULUS));
    }

    function _FQ2Sub(
        uint256 xx,
        uint256 xy,
        uint256 yx,
        uint256 yy
    ) internal pure returns (uint256 rx, uint256 ry) {
        return (submod(xx, yx, FIELD_MODULUS), submod(xy, yy, FIELD_MODULUS));
    }

    function _FQ2Div(
        uint256 xx,
        uint256 xy,
        uint256 yx,
        uint256 yy
    ) internal view returns (uint256, uint256) {
        (yx, yy) = _FQ2Inv(yx, yy);
        return _FQ2Mul(xx, xy, yx, yy);
    }

    function _FQ2Inv(uint256 x, uint256 y)
        internal
        view
        returns (uint256, uint256)
    {
        uint256 inv =
            _modInv(
                addmod(
                    mulmod(y, y, FIELD_MODULUS),
                    mulmod(x, x, FIELD_MODULUS),
                    FIELD_MODULUS
                ),
                FIELD_MODULUS
            );
        return (
            mulmod(x, inv, FIELD_MODULUS),
            FIELD_MODULUS - mulmod(y, inv, FIELD_MODULUS)
        );
    }

    function _isOnCurve(
        uint256 xx,
        uint256 xy,
        uint256 yx,
        uint256 yy
    ) internal pure returns (bool) {
        uint256 yyx;
        uint256 yyy;
        uint256 xxxx;
        uint256 xxxy;
        (yyx, yyy) = _FQ2Mul(yx, yy, yx, yy);
        (xxxx, xxxy) = _FQ2Mul(xx, xy, xx, xy);
        (xxxx, xxxy) = _FQ2Mul(xxxx, xxxy, xx, xy);
        (yyx, yyy) = _FQ2Sub(yyx, yyy, xxxx, xxxy);
        (yyx, yyy) = _FQ2Sub(yyx, yyy, TWISTBX, TWISTBY);
        return yyx == 0 && yyy == 0;
    }

    function _modInv(uint256 a, uint256 n)
        internal
        view
        returns (uint256 result)
    {
        bool success;
        assembly {
            let freemem := mload(0x40)
            mstore(freemem, 0x20)
            mstore(add(freemem, 0x20), 0x20)
            mstore(add(freemem, 0x40), 0x20)
            mstore(add(freemem, 0x60), a)
            mstore(add(freemem, 0x80), sub(n, 2))
            mstore(add(freemem, 0xA0), n)
            success := staticcall(
                sub(gas(), 2000),
                5,
                freemem,
                0xC0,
                freemem,
                0x20
            )
            result := mload(freemem)
        }
        require(success);
    }

    function _fromJacobian(
        uint256 pt1xx,
        uint256 pt1xy,
        uint256 pt1yx,
        uint256 pt1yy,
        uint256 pt1zx,
        uint256 pt1zy
    )
        internal
        view
        returns (
            uint256 pt2xx,
            uint256 pt2xy,
            uint256 pt2yx,
            uint256 pt2yy
        )
    {
        uint256 invzx;
        uint256 invzy;
        (invzx, invzy) = _FQ2Inv(pt1zx, pt1zy);
        (pt2xx, pt2xy) = _FQ2Mul(pt1xx, pt1xy, invzx, invzy);
        (pt2yx, pt2yy) = _FQ2Mul(pt1yx, pt1yy, invzx, invzy);
    }

    function _ECTwistAddJacobian(
        uint256 pt1xx,
        uint256 pt1xy,
        uint256 pt1yx,
        uint256 pt1yy,
        uint256 pt1zx,
        uint256 pt1zy,
        uint256 pt2xx,
        uint256 pt2xy,
        uint256 pt2yx,
        uint256 pt2yy,
        uint256 pt2zx,
        uint256 pt2zy
    ) internal pure returns (uint256[6] memory pt3) {
        if (pt1zx == 0 && pt1zy == 0) {
            (
                pt3[PTXX],
                pt3[PTXY],
                pt3[PTYX],
                pt3[PTYY],
                pt3[PTZX],
                pt3[PTZY]
            ) = (pt2xx, pt2xy, pt2yx, pt2yy, pt2zx, pt2zy);
            return pt3;
        } else if (pt2zx == 0 && pt2zy == 0) {
            (
                pt3[PTXX],
                pt3[PTXY],
                pt3[PTYX],
                pt3[PTYY],
                pt3[PTZX],
                pt3[PTZY]
            ) = (pt1xx, pt1xy, pt1yx, pt1yy, pt1zx, pt1zy);
            return pt3;
        }

        (pt2yx, pt2yy) = _FQ2Mul(pt2yx, pt2yy, pt1zx, pt1zy); // U1 = y2 * z1
        (pt3[PTYX], pt3[PTYY]) = _FQ2Mul(pt1yx, pt1yy, pt2zx, pt2zy); // U2 = y1 * z2
        (pt2xx, pt2xy) = _FQ2Mul(pt2xx, pt2xy, pt1zx, pt1zy); // V1 = x2 * z1
        (pt3[PTZX], pt3[PTZY]) = _FQ2Mul(pt1xx, pt1xy, pt2zx, pt2zy); // V2 = x1 * z2

        if (pt2xx == pt3[PTZX] && pt2xy == pt3[PTZY]) {
            if (pt2yx == pt3[PTYX] && pt2yy == pt3[PTYY]) {
                (
                    pt3[PTXX],
                    pt3[PTXY],
                    pt3[PTYX],
                    pt3[PTYY],
                    pt3[PTZX],
                    pt3[PTZY]
                ) = _ECTwistDoubleJacobian(
                    pt1xx,
                    pt1xy,
                    pt1yx,
                    pt1yy,
                    pt1zx,
                    pt1zy
                );
                return pt3;
            }
            (
                pt3[PTXX],
                pt3[PTXY],
                pt3[PTYX],
                pt3[PTYY],
                pt3[PTZX],
                pt3[PTZY]
            ) = (1, 0, 1, 0, 0, 0);
            return pt3;
        }

        (pt2zx, pt2zy) = _FQ2Mul(pt1zx, pt1zy, pt2zx, pt2zy); // W = z1 * z2
        (pt1xx, pt1xy) = _FQ2Sub(pt2yx, pt2yy, pt3[PTYX], pt3[PTYY]); // U = U1 - U2
        (pt1yx, pt1yy) = _FQ2Sub(pt2xx, pt2xy, pt3[PTZX], pt3[PTZY]); // V = V1 - V2
        (pt1zx, pt1zy) = _FQ2Mul(pt1yx, pt1yy, pt1yx, pt1yy); // V_squared = V * V
        (pt2yx, pt2yy) = _FQ2Mul(pt1zx, pt1zy, pt3[PTZX], pt3[PTZY]); // V_squared_times_V2 = V_squared * V2
        (pt1zx, pt1zy) = _FQ2Mul(pt1zx, pt1zy, pt1yx, pt1yy); // V_cubed = V * V_squared
        (pt3[PTZX], pt3[PTZY]) = _FQ2Mul(pt1zx, pt1zy, pt2zx, pt2zy); // newz = V_cubed * W
        (pt2xx, pt2xy) = _FQ2Mul(pt1xx, pt1xy, pt1xx, pt1xy); // U * U
        (pt2xx, pt2xy) = _FQ2Mul(pt2xx, pt2xy, pt2zx, pt2zy); // U * U * W
        (pt2xx, pt2xy) = _FQ2Sub(pt2xx, pt2xy, pt1zx, pt1zy); // U * U * W - V_cubed
        (pt2zx, pt2zy) = _FQ2Muc(pt2yx, pt2yy, 2); // 2 * V_squared_times_V2
        (pt2xx, pt2xy) = _FQ2Sub(pt2xx, pt2xy, pt2zx, pt2zy); // A = U * U * W - V_cubed - 2 * V_squared_times_V2
        (pt3[PTXX], pt3[PTXY]) = _FQ2Mul(pt1yx, pt1yy, pt2xx, pt2xy); // newx = V * A
        (pt1yx, pt1yy) = _FQ2Sub(pt2yx, pt2yy, pt2xx, pt2xy); // V_squared_times_V2 - A
        (pt1yx, pt1yy) = _FQ2Mul(pt1xx, pt1xy, pt1yx, pt1yy); // U * (V_squared_times_V2 - A)
        (pt1xx, pt1xy) = _FQ2Mul(pt1zx, pt1zy, pt3[PTYX], pt3[PTYY]); // V_cubed * U2
        (pt3[PTYX], pt3[PTYY]) = _FQ2Sub(pt1yx, pt1yy, pt1xx, pt1xy); // newy = U * (V_squared_times_V2 - A) - V_cubed * U2
    }

    function _ECTwistDoubleJacobian(
        uint256 pt1xx,
        uint256 pt1xy,
        uint256 pt1yx,
        uint256 pt1yy,
        uint256 pt1zx,
        uint256 pt1zy
    )
        internal
        pure
        returns (
            uint256 pt2xx,
            uint256 pt2xy,
            uint256 pt2yx,
            uint256 pt2yy,
            uint256 pt2zx,
            uint256 pt2zy
        )
    {
        (pt2xx, pt2xy) = _FQ2Muc(pt1xx, pt1xy, 3); // 3 * x
        (pt2xx, pt2xy) = _FQ2Mul(pt2xx, pt2xy, pt1xx, pt1xy); // W = 3 * x * x
        (pt1zx, pt1zy) = _FQ2Mul(pt1yx, pt1yy, pt1zx, pt1zy); // S = y * z
        (pt2yx, pt2yy) = _FQ2Mul(pt1xx, pt1xy, pt1yx, pt1yy); // x * y
        (pt2yx, pt2yy) = _FQ2Mul(pt2yx, pt2yy, pt1zx, pt1zy); // B = x * y * S
        (pt1xx, pt1xy) = _FQ2Mul(pt2xx, pt2xy, pt2xx, pt2xy); // W * W
        (pt2zx, pt2zy) = _FQ2Muc(pt2yx, pt2yy, 8); // 8 * B
        (pt1xx, pt1xy) = _FQ2Sub(pt1xx, pt1xy, pt2zx, pt2zy); // H = W * W - 8 * B
        (pt2zx, pt2zy) = _FQ2Mul(pt1zx, pt1zy, pt1zx, pt1zy); // S_squared = S * S
        (pt2yx, pt2yy) = _FQ2Muc(pt2yx, pt2yy, 4); // 4 * B
        (pt2yx, pt2yy) = _FQ2Sub(pt2yx, pt2yy, pt1xx, pt1xy); // 4 * B - H
        (pt2yx, pt2yy) = _FQ2Mul(pt2yx, pt2yy, pt2xx, pt2xy); // W * (4 * B - H)
        (pt2xx, pt2xy) = _FQ2Muc(pt1yx, pt1yy, 8); // 8 * y
        (pt2xx, pt2xy) = _FQ2Mul(pt2xx, pt2xy, pt1yx, pt1yy); // 8 * y * y
        (pt2xx, pt2xy) = _FQ2Mul(pt2xx, pt2xy, pt2zx, pt2zy); // 8 * y * y * S_squared
        (pt2yx, pt2yy) = _FQ2Sub(pt2yx, pt2yy, pt2xx, pt2xy); // newy = W * (4 * B - H) - 8 * y * y * S_squared
        (pt2xx, pt2xy) = _FQ2Muc(pt1xx, pt1xy, 2); // 2 * H
        (pt2xx, pt2xy) = _FQ2Mul(pt2xx, pt2xy, pt1zx, pt1zy); // newx = 2 * H * S
        (pt2zx, pt2zy) = _FQ2Mul(pt1zx, pt1zy, pt2zx, pt2zy); // S * S_squared
        (pt2zx, pt2zy) = _FQ2Muc(pt2zx, pt2zy, 8); // newz = 8 * S * S_squared
    }

    function _ECTwistMulJacobian(
        uint256 d,
        uint256 pt1xx,
        uint256 pt1xy,
        uint256 pt1yx,
        uint256 pt1yy,
        uint256 pt1zx,
        uint256 pt1zy
    ) internal pure returns (uint256[6] memory pt2) {
        while (d != 0) {
            if ((d & 1) != 0) {
                pt2 = _ECTwistAddJacobian(
                    pt2[PTXX],
                    pt2[PTXY],
                    pt2[PTYX],
                    pt2[PTYY],
                    pt2[PTZX],
                    pt2[PTZY],
                    pt1xx,
                    pt1xy,
                    pt1yx,
                    pt1yy,
                    pt1zx,
                    pt1zy
                );
            }
            (pt1xx, pt1xy, pt1yx, pt1yy, pt1zx, pt1zy) = _ECTwistDoubleJacobian(
                pt1xx,
                pt1xy,
                pt1yx,
                pt1yy,
                pt1zx,
                pt1zy
            );

            d = d / 2;
        }
    }
}

// This file is MIT Licensed.
//
// Copyright 2017 Christian Reitwiessner
// Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
// The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

library Pairing {
    struct G1Point {
        uint256 X;
        uint256 Y;
    }
    // Encoding of field elements is: X[0] * z + X[1]
    struct G2Point {
        uint256[2] X;
        uint256[2] Y;
    }

    /// @return the generator of G1
    function P1() internal pure returns (G1Point memory) {
        return G1Point(1, 2);
    }

    /// @return the generator of G2
    function P2() internal pure returns (G2Point memory) {
        return
            G2Point(
                [
                    10857046999023057135944570762232829481370756359578518086990519993285655852781,
                    11559732032986387107991004021392285783925812861821192530917403151452391805634
                ],
                [
                    8495653923123431417604973247489272438418190587263600148770280649306958101930,
                    4082367875863433681332203403145435568316851327593401208105741076214120093531
                ]
            );
    }

    /// @return the negation of p, i.e. p.addition(p.negate()) should be zero.
    function negate(G1Point memory p) internal pure returns (G1Point memory) {
        // The prime q in the base field F_q for G1
        uint256 q =
            21888242871839275222246405745257275088696311157297823662689037894645226208583;
        if (p.X == 0 && p.Y == 0) return G1Point(0, 0);
        return G1Point(p.X, q - (p.Y % q));
    }

    /// @return r the sum of two points of G1
    function addition(G1Point memory p1, G1Point memory p2)
        internal
        view
        returns (G1Point memory r)
    {
        uint256[4] memory input;
        input[0] = p1.X;
        input[1] = p1.Y;
        input[2] = p2.X;
        input[3] = p2.Y;
        bool success;
        assembly {
            success := staticcall(sub(gas(), 2000), 6, input, 0xc0, r, 0x60)
            // Use "invalid" to make gas estimation work
            switch success
                case 0 {
                    invalid()
                }
        }
        require(success);
    }

    /// @return r the sum of two points of G2
    function addition(G2Point memory p1, G2Point memory p2)
        internal
        view
        returns (G2Point memory r)
    {
        (r.X[0], r.X[1], r.Y[0], r.Y[1]) = BN256G2.ECTwistAdd(
            p1.X[0],
            p1.X[1],
            p1.Y[0],
            p1.Y[1],
            p2.X[0],
            p2.X[1],
            p2.Y[0],
            p2.Y[1]
        );
    }

    /// @return r the product of a point on G1 and a scalar, i.e.
    /// p == p.scalar_mul(1) and p.addition(p) == p.scalar_mul(2) for all points p.
    function scalar_mul(G1Point memory p, uint256 s)
        internal
        view
        returns (G1Point memory r)
    {
        uint256[3] memory input;
        input[0] = p.X;
        input[1] = p.Y;
        input[2] = s;
        bool success;
        assembly {
            success := staticcall(sub(gas(), 2000), 7, input, 0x80, r, 0x60)
            // Use "invalid" to make gas estimation work
            switch success
                case 0 {
                    invalid()
                }
        }
        require(success);
    }

    /// @return the result of computing the pairing check
    /// e(p1[0], p2[0]) *  .... * e(p1[n], p2[n]) == 1
    /// For example pairing([P1(), P1().negate()], [P2(), P2()]) should
    /// return true.
    function pairing(G1Point[] memory p1, G2Point[] memory p2)
        internal
        view
        returns (bool)
    {
        require(p1.length == p2.length);
        uint256 elements = p1.length;
        uint256 inputSize = elements * 6;
        uint256[] memory input = new uint256[](inputSize);
        for (uint256 i = 0; i < elements; i++) {
            input[i * 6 + 0] = p1[i].X;
            input[i * 6 + 1] = p1[i].Y;
            input[i * 6 + 2] = p2[i].X[1];
            input[i * 6 + 3] = p2[i].X[0];
            input[i * 6 + 4] = p2[i].Y[1];
            input[i * 6 + 5] = p2[i].Y[0];
        }
        uint256[1] memory out;
        bool success;
        assembly {
            success := staticcall(
                sub(gas(), 2000),
                8,
                add(input, 0x20),
                mul(inputSize, 0x20),
                out,
                0x20
            )
            // Use "invalid" to make gas estimation work
            switch success
                case 0 {
                    invalid()
                }
        }
        require(success);
        return out[0] != 0;
    }

    /// Convenience method for a pairing check for two pairs.
    function pairingProd2(
        G1Point memory a1,
        G2Point memory a2,
        G1Point memory b1,
        G2Point memory b2
    ) internal view returns (bool) {
        G1Point[] memory p1 = new G1Point[](2);
        G2Point[] memory p2 = new G2Point[](2);
        p1[0] = a1;
        p1[1] = b1;
        p2[0] = a2;
        p2[1] = b2;
        return pairing(p1, p2);
    }

    /// Convenience method for a pairing check for three pairs.
    function pairingProd3(
        G1Point memory a1,
        G2Point memory a2,
        G1Point memory b1,
        G2Point memory b2,
        G1Point memory c1,
        G2Point memory c2
    ) internal view returns (bool) {
        G1Point[] memory p1 = new G1Point[](3);
        G2Point[] memory p2 = new G2Point[](3);
        p1[0] = a1;
        p1[1] = b1;
        p1[2] = c1;
        p2[0] = a2;
        p2[1] = b2;
        p2[2] = c2;
        return pairing(p1, p2);
    }

    /// Convenience method for a pairing check for four pairs.
    function pairingProd4(
        G1Point memory a1,
        G2Point memory a2,
        G1Point memory b1,
        G2Point memory b2,
        G1Point memory c1,
        G2Point memory c2,
        G1Point memory d1,
        G2Point memory d2
    ) internal view returns (bool) {
        G1Point[] memory p1 = new G1Point[](4);
        G2Point[] memory p2 = new G2Point[](4);
        p1[0] = a1;
        p1[1] = b1;
        p1[2] = c1;
        p1[3] = d1;
        p2[0] = a2;
        p2[1] = b2;
        p2[2] = c2;
        p2[3] = d2;
        return pairing(p1, p2);
    }
}

contract Verifier {
    using Pairing for *;
    struct VerifyingKey {
        Pairing.G1Point alpha;
        Pairing.G2Point beta;
        Pairing.G2Point gamma;
        Pairing.G2Point delta;
        Pairing.G1Point[] gamma_abc;
    }
    struct Proof {
        Pairing.G1Point a;
        Pairing.G2Point b;
        Pairing.G1Point c;
    }

    function verifyingKey() internal pure returns (VerifyingKey memory vk) {
        vk.alpha = Pairing.G1Point(
            uint256(
                0x071dc19f095dbff33a962cad9cb95782d24f9dde28ce9a3f28e6df51b35d58c2
            ),
            uint256(
                0x1cfbb9f10e7557c02a7adf9dd537544a80534942664f3cca405a5046e51ad77c
            )
        );
        vk.beta = Pairing.G2Point(
            [
                uint256(
                    0x18098e9c6a59a0a87a78ef12d74e26f963c24f026d739f5e6e49913e9660d0b9
                ),
                uint256(
                    0x115d043eba15d320416d614367eeae3299423b22d6c49dd7863bd503cb9a1def
                )
            ],
            [
                uint256(
                    0x13bc011c7879a2b53445f77b07d71ac042e90f1dbcb1f95ec67933310e995fa9
                ),
                uint256(
                    0x175b71fccf2e78c80a989608281a4f5ba6619c2baa191ff7ade6601d053f95ff
                )
            ]
        );
        vk.gamma = Pairing.G2Point(
            [
                uint256(
                    0x1c6458b0a615bb7238ca5f6ea14bd5897d067685f0bbf6c2fd52a68a28263f4c
                ),
                uint256(
                    0x1b4da3bf019ecc8d3b66369422d9668747c5984ec3de70d6cd8bf44548ee511c
                )
            ],
            [
                uint256(
                    0x00cd506ef36bacd2a14af236edb809e0253ff634dfc60f9e3ea182d14c657842
                ),
                uint256(
                    0x234c017a6a0a18f615120f37efd6d512a9e084d6b202713542c9a73d0a9ef22c
                )
            ]
        );
        vk.delta = Pairing.G2Point(
            [
                uint256(
                    0x0db7d608e2b495d87be50c7043f5706b27837d633ff8c3425a72baeaec5f0205
                ),
                uint256(
                    0x2179ce98ca265cccd092dbcc68a578d0f3369505a60fbaab0f8cb10cdde72e87
                )
            ],
            [
                uint256(
                    0x2ba8dd464cbdd1b3c39d47a7af559f2a19daaca93650d118437853a561175578
                ),
                uint256(
                    0x02a6b808808ffa05ed38696eebc552112751c2eeed37a5ad4f9e3d60107a0778
                )
            ]
        );
        vk.gamma_abc = new Pairing.G1Point[](39);
        vk.gamma_abc[0] = Pairing.G1Point(
            uint256(
                0x27493ca44913db6499a0ad102ae306a7c0e691dd5199a7e68702d52c2990c42f
            ),
            uint256(
                0x053f6f4339c4795efc47155b3f16174da2552d181dc607c49888045aff64a568
            )
        );
        vk.gamma_abc[1] = Pairing.G1Point(
            uint256(
                0x07319356377fc57956dcde4f3688868d2123ce6a43adcce73ae79041c443ca65
            ),
            uint256(
                0x03c351e3450a08f9c0c90f2b6003e0379a1c704010de0411268a3649bb1708e1
            )
        );
        vk.gamma_abc[2] = Pairing.G1Point(
            uint256(
                0x119c9d9c4df473d7798d302e7835e192ad91fbce52c9c379971cdda23d3392c9
            ),
            uint256(
                0x09888c678dd1ba049c4ac703a18bf1d80985239704ef1156af1a0d49e0e48e60
            )
        );
        vk.gamma_abc[3] = Pairing.G1Point(
            uint256(
                0x0a63f27bd089327de100f417a452776b9c38e10333614d90b8aacf7eb9fc65b3
            ),
            uint256(
                0x0fb4ba0237c3fcdde8b2d0b55a503f28d170834e7ac60cd9ad2cd2c865bc3316
            )
        );
        vk.gamma_abc[4] = Pairing.G1Point(
            uint256(
                0x09bf17a567684da26b19223e640066e5773e02984b8938cc1dfbcf346244116f
            ),
            uint256(
                0x0b6fc74a8e3433fe85e5480a000770bfb17cca82a7f166ae2449b0f47b645150
            )
        );
        vk.gamma_abc[5] = Pairing.G1Point(
            uint256(
                0x0679021f23b4dc7a27b2060b5f62310fc563479cb82fd94742b3fecf3a8db379
            ),
            uint256(
                0x103e98056572d770a7452bec1be81377d2a9ef8ef5a590911ea9469861f6b979
            )
        );
        vk.gamma_abc[6] = Pairing.G1Point(
            uint256(
                0x054cb61654db61394dfccd2db0c699b7bcc1b30edae9e09ccd96ae815f9a1a28
            ),
            uint256(
                0x2dfed59c89feddf64192d5fc20734a6c929ff1fa5f5b2a9545165fcd58061bce
            )
        );
        vk.gamma_abc[7] = Pairing.G1Point(
            uint256(
                0x08e03e875e162ed7b53b2dbe822aa47d97780938b15b16dc9e5608eaf1588819
            ),
            uint256(
                0x080eb7f12630ac3906fd03e3ad4296a5b6a7ca4a2e45eeef55f78f44e897fea7
            )
        );
        vk.gamma_abc[8] = Pairing.G1Point(
            uint256(
                0x1c3716d56178036003f05eaf54accc5239e5a8fc5798734bbdf212df5b3baef4
            ),
            uint256(
                0x0175be05562f047eca52ba962ee069de092a7ae082aa215a12671f785bf7475e
            )
        );
        vk.gamma_abc[9] = Pairing.G1Point(
            uint256(
                0x1505c53f6291e9d13bcca30a8816f1044f63350f1986b067be480c88e282f9f4
            ),
            uint256(
                0x0cce1ffef8b0cfa9172008ca816b650eda832b2586dd79de2bf6d6e1317cad1c
            )
        );
        vk.gamma_abc[10] = Pairing.G1Point(
            uint256(
                0x0d1b45052c0ab19291642bab126febcca4969b296e134595833a787b7b40db83
            ),
            uint256(
                0x1925ed4b5ec4e2fa3c1650258c99ea292a478100c99c56873d709426dc016001
            )
        );
        vk.gamma_abc[11] = Pairing.G1Point(
            uint256(
                0x2448f8100213641c095dfd8413d90e78fbe27ead8ae33d33775ebda08e7ce003
            ),
            uint256(
                0x168e2ac80d68732b68db8d7723187e414480c9c1a3f2cefdc354156ff48a50f4
            )
        );
        vk.gamma_abc[12] = Pairing.G1Point(
            uint256(
                0x0bf80b2820a1dbc176844a788441d8ad20c300027e555bda74bc9c66990a325e
            ),
            uint256(
                0x2dc2202ba08593f83c340133af7737b4e725e19987e30796ae0f5da1f258fa03
            )
        );
        vk.gamma_abc[13] = Pairing.G1Point(
            uint256(
                0x15704d69505b4aa85d72583cb8a0de2da038edd9c14e8e1fb9e865472fccd354
            ),
            uint256(
                0x1687882f35f84360c9a9e3e9252c875212ba18055746a6d6e143e0e6c6040e8a
            )
        );
        vk.gamma_abc[14] = Pairing.G1Point(
            uint256(
                0x06b7e4e723598e09d5344e93dd3e0dd67b658ac56169e39b1056e81af655140d
            ),
            uint256(
                0x03f15530d38b300bd00ec2ea3003a8f756d3162d6832efcda753973e9d3bdd5f
            )
        );
        vk.gamma_abc[15] = Pairing.G1Point(
            uint256(
                0x05887d12a4b36da3210fedc88b7c5508a50b0451ec85ec37f6dda7a99b2bd355
            ),
            uint256(
                0x01f21607dd1b8797f70df9a78f5e6b9d1e99a868dbca2a729af01cbf3e5aad53
            )
        );
        vk.gamma_abc[16] = Pairing.G1Point(
            uint256(
                0x113c3af31e009e8ef4b124371ccfe29bb6e2226b4e813766429dbe8819538e45
            ),
            uint256(
                0x1d51791b30ac41c5593b3f35746027a6c48375da3534cf789b93b3bc7eba16bb
            )
        );
        vk.gamma_abc[17] = Pairing.G1Point(
            uint256(
                0x0a9ab4ffa771ff67dc29b4409e4b4193c59ebe8ab9c949f662740efbc5e486e9
            ),
            uint256(
                0x2b13b2d7727d94ff1c43b7a88b468d517fcaa7371abdd95c4ab213efaddc3364
            )
        );
        vk.gamma_abc[18] = Pairing.G1Point(
            uint256(
                0x0172e8c6cdc9649084eaba60d1b1a4755863513958f514f3653487393f09a5e2
            ),
            uint256(
                0x26c9940cf37c7d14edc4f2d571d0771721b71c151a756006532cdcde4a3e97cd
            )
        );
        vk.gamma_abc[19] = Pairing.G1Point(
            uint256(
                0x242cee63e99ae388a631a79c7eb6f4d8e55d1ba1e705b146bc1bd95985f56e82
            ),
            uint256(
                0x065477bb84fc8c99a77137c4c44fbf6a2c8a346c5ed0f998cd324bf95766904a
            )
        );
        vk.gamma_abc[20] = Pairing.G1Point(
            uint256(
                0x09435a862424f8a1040c52d53c99d96008ac354382c56ce545c85fe991d3aafb
            ),
            uint256(
                0x089d1045652999525f9468e7cb9573377d92efe5da68d71e8f41e6883cd78d89
            )
        );
        vk.gamma_abc[21] = Pairing.G1Point(
            uint256(
                0x124a0c2ebf6acaa710ecf15642ecc326c6b271025597f3faaebc4795bde95dad
            ),
            uint256(
                0x1a7ba320bf8ec96da57f3e41311ad7f54ccf17ebaecf148e17cb51c5cc777158
            )
        );
        vk.gamma_abc[22] = Pairing.G1Point(
            uint256(
                0x1235298d4f698a8e42c37df0e2422c98fb5a36803d7b013ed95cacc732e22a6e
            ),
            uint256(
                0x03c4f77b1b3ab2c12efa82a9cdc01c98d2961e5a8f1921eb1e408d9832f19fa4
            )
        );
        vk.gamma_abc[23] = Pairing.G1Point(
            uint256(
                0x17b7f5071e2d0817ad9e9cc9e0732dc7dce877dbaefc7ee49b72c1f251e093eb
            ),
            uint256(
                0x1eea695f7dbce4b7225e43d9045db41b5263f8fc5cdcc78f8d5f8156536ba6b6
            )
        );
        vk.gamma_abc[24] = Pairing.G1Point(
            uint256(
                0x25f19f9fc45d3b36530486e274ba7c4e5a370c037b258633d6e391c461155278
            ),
            uint256(
                0x2c3e47abe4100081177f139485bad04811b0b76dd3688c595085ff609f288941
            )
        );
        vk.gamma_abc[25] = Pairing.G1Point(
            uint256(
                0x12cb3c7d754dca3d599e54aff2e18665ff5746351f67beb1ddf332942350a39f
            ),
            uint256(
                0x1804088e86c37f8df5394971b4edcfe9884a45d3895a59e904b1361808c7528b
            )
        );
        vk.gamma_abc[26] = Pairing.G1Point(
            uint256(
                0x1ac4767c62b5ea06c1ac2b909da27bd00f4cd3b4e55fef96d88d418381eb4985
            ),
            uint256(
                0x1214f9ef455602584e896e311c3c822219ff9a58af4cadbf3fa664fccfefa461
            )
        );
        vk.gamma_abc[27] = Pairing.G1Point(
            uint256(
                0x057e0bfe2860b157348653267977788e5646801f095aa5a565beaf1bab526fab
            ),
            uint256(
                0x187a616589da7ab0b6062d2819e0bf3866a069d9d17c77fee809ea71836bb08a
            )
        );
        vk.gamma_abc[28] = Pairing.G1Point(
            uint256(
                0x2b15a58f15a247fcab415e665879d50c49cd9643f5923d99067b3b57affac9e2
            ),
            uint256(
                0x174479c3354d30121553c8bd2c5a2032608a7686eef694a5b85ac54dbc6ca56e
            )
        );
        vk.gamma_abc[29] = Pairing.G1Point(
            uint256(
                0x2aa7e135a7c001b5dc780e85111aa30f33dce921c85eb5dcebe95ebe6f8039bb
            ),
            uint256(
                0x1428b291623f5bd304510e7dacf3a1c7540756d5dfe86c98556856bc321e893f
            )
        );
        vk.gamma_abc[30] = Pairing.G1Point(
            uint256(
                0x15968af33069a09db5c2d8d996975b4d35f30c34df4945243209c7d411c25de0
            ),
            uint256(
                0x2cc36673e9b0ec2043fbbf9866b2d2cbb1a5b2c5a71a4ad6e4d63d4f3a9062e3
            )
        );
        vk.gamma_abc[31] = Pairing.G1Point(
            uint256(
                0x050a3cd9483d8bd8409dd62dc24d41013226ab7bbfaa735e80b7db5eba8b6fc9
            ),
            uint256(
                0x0acd09c8cf2755fd9ed249ee10b83bc563a89a8b049ecbe65d57d78ab2bc61c4
            )
        );
        vk.gamma_abc[32] = Pairing.G1Point(
            uint256(
                0x2327219937f4c43b210b494990896d1dfb06cbb838567804a46d4b24725ab27f
            ),
            uint256(
                0x241db8ed68c0aa2e8f7c483fd448c3260c59f08d3c7852b4da28651fdae917db
            )
        );
        vk.gamma_abc[33] = Pairing.G1Point(
            uint256(
                0x041e3fc0916e9fa93f2c702a5ce57fd3d1a112ed504be1774a51e6c3f6ed153a
            ),
            uint256(
                0x041bbe5d8ee426eedc8de9d6eba85d69015d7838eb1ffba712ed022f9e43c51d
            )
        );
        vk.gamma_abc[34] = Pairing.G1Point(
            uint256(
                0x1905134da6a3d5daa98a297ad6f5bcea0abf9c93c0e18d37d4a7dfe6038521a7
            ),
            uint256(
                0x140b259abe1951a59f0b89f9fe47edbed6c5234a55c6ceff8fbb239898793795
            )
        );
        vk.gamma_abc[35] = Pairing.G1Point(
            uint256(
                0x2247cf21ceb5984bcf87d08aa5280b92edf41b1de0afea86f0e831d293b0eafc
            ),
            uint256(
                0x2195016a57eec0171ec18225446cbbf1ea23b16707aa6102060b7d4fce7cd122
            )
        );
        vk.gamma_abc[36] = Pairing.G1Point(
            uint256(
                0x21c29a274b51fab686337a31f1ddf97a4b80181cc3c163da267f61e64ecd9f60
            ),
            uint256(
                0x19844236a87affeaeb37533cb4e159553a39a393c09d0ffc351eec33c6b25a4e
            )
        );
        vk.gamma_abc[37] = Pairing.G1Point(
            uint256(
                0x0e98c62024665eaf679805177af0c9c5fd39f462bd2bb1c507bbe62ed7b167e5
            ),
            uint256(
                0x061189b621186a897b34db0a722d0ec7706a130c7027ed9a56980fd493137868
            )
        );
        vk.gamma_abc[38] = Pairing.G1Point(
            uint256(
                0x028fdf9c65d95e75ec1108706e8a2ad8e24e47f68c45329989af1f4b68c3812e
            ),
            uint256(
                0x2582e5d85ac566456e3542023be9097122142ff759685e7520e011ec9afaa6ee
            )
        );
    }

    function verify(uint256[] memory input, Proof memory proof)
        internal
        view
        returns (uint256)
    {
        uint256 snark_scalar_field =
            21888242871839275222246405745257275088548364400416034343698204186575808495617;
        VerifyingKey memory vk = verifyingKey();
        require(input.length + 1 == vk.gamma_abc.length);
        // Compute the linear combination vk_x
        Pairing.G1Point memory vk_x = Pairing.G1Point(0, 0);
        for (uint256 i = 0; i < input.length; i++) {
            require(input[i] < snark_scalar_field);
            vk_x = Pairing.addition(
                vk_x,
                Pairing.scalar_mul(vk.gamma_abc[i + 1], input[i])
            );
        }
        vk_x = Pairing.addition(vk_x, vk.gamma_abc[0]);
        if (
            !Pairing.pairingProd4(
                proof.a,
                proof.b,
                Pairing.negate(vk_x),
                vk.gamma,
                Pairing.negate(proof.c),
                vk.delta,
                Pairing.negate(vk.alpha),
                vk.beta
            )
        ) return 1;
        return 0;
    }

    function verifyTx(
        uint256[2] memory a,
        uint256[2][2] memory b,
        uint256[2] memory c,
        uint256[38] memory input
    ) public view returns (bool r) {
        Proof memory proof;
        proof.a = Pairing.G1Point(a[0], a[1]);
        proof.b = Pairing.G2Point([b[0][0], b[0][1]], [b[1][0], b[1][1]]);
        proof.c = Pairing.G1Point(c[0], c[1]);
        uint256[] memory inputValues = new uint256[](38);

        for (uint256 i = 0; i < input.length; i++) {
            inputValues[i] = input[i];
        }
        if (verify(inputValues, proof) == 0) {
            return true;
        } else {
            return false;
        }
    }
}
