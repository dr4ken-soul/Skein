// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Script} from "forge-std/Script.sol";
import {SkeinRegistry} from "../src/SkeinRegistry.sol";

contract Deploy is Script {
    function run() external {
        bytes32 salt = vm.envOr("SKEIN_SALT", keccak256("skein.v1"));
        vm.startBroadcast();
        SkeinRegistry registry = new SkeinRegistry(salt);
        vm.stopBroadcast();
    }
}
