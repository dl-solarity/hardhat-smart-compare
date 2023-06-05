// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity 0.8.20;

import "./B.sol";
import "./C.sol";

contract D is C, B {
    uint d;
}
