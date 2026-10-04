// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Script, console} from "forge-std/Script.sol";
import {SkeinRegistry} from "../src/SkeinRegistry.sol";

/// @notice Seeds the five demo transactions for the README.
/// Run with two funded wallets so the refusal is genuine.
contract SeedDemo is Script {
    function run() external {
        address registryAddr = vm.envAddress("REGISTRY_ADDRESS");
        SkeinRegistry registry = SkeinRegistry(payable(registryAddr));

        bytes32 salt = registry.salt();

        // Derive two invoice ids from fingerprint roots of fixture invoices
        bytes32 rootA = keccak256("NG-2291-root");
        bytes32 rootB = keccak256("NG-2402-root");
        bytes32 idA = registry.invoiceId(rootA);
        bytes32 idB = registry.invoiceId(rootB);

        // Addresses must be funded before running
        address lenderA = vm.envAddress("LENDER_A");
        address seller = vm.envAddress("SELLER");

        console.log("Registry:", registryAddr);
        console.log("Salt:", vm.toString(salt));
        console.log("Invoice A id:");
        console.logBytes32(idA);
        console.log("Invoice B id:");
        console.logBytes32(idB);

        // Tx 1: lender A funds NG-2291
        vm.startBroadcast(lenderA);
        registry.fundAndPledge{value: 1 ether}(idA, seller, keccak256("evidence-A"), keccak256("verdict-A"));
        vm.stopBroadcast();
        console.log("Tx 1: fundAndPledge NG-2291 done");

        // Tx 3: check (view call, no tx)
        (bool pledged, address lender, uint256 blockNum, bool settled) = registry.check(idA);
        console.log("Tx 3: check NG-2291 pledged:", pledged);
        console.log("  lender:", lender);
        console.log("  block:", blockNum);

        // Tx 4: lender A funds distinct NG-2402
        vm.startBroadcast(lenderA);
        registry.fundAndPledge{value: 1 ether}(idB, seller, keccak256("evidence-B"), keccak256("verdict-B"));
        vm.stopBroadcast();
        console.log("Tx 4: fundAndPledge NG-2402 done");

        // Tx 5: seller repays NG-2291
        vm.startBroadcast(seller);
        registry.repay{value: 1 ether}(idA);
        vm.stopBroadcast();
        console.log("Tx 5: repay NG-2291 done");

        console.log("Seed complete. Tx 2 (reissue refusal) must be run from lender B and will revert.");
    }
}
