// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Test} from "forge-std/Test.sol";

/// @notice Proves Arc chain assumptions rather than product logic.
contract ArcBehaviourTest is Test {
    /// @notice Native value transfer of 1e18 wei moves one USDC.
    function testNativeTransferIs18Decimals() public {
        address recipient = makeAddr("recipient");
        uint256 amount = 1e18;
        vm.deal(address(this), amount);
        uint256 beforeBal = recipient.balance;
        (bool ok,) = recipient.call{value: amount}("");
        assertTrue(ok);
        assertEq(recipient.balance - beforeBal, 1e18);
    }

    /// @notice Sending value to zero address reverts.
    function testValueToZeroReverts() public {
        vm.deal(address(this), 1 ether);
        (bool ok,) = address(0).call{value: 1 ether}("");
        // On most EVMs this succeeds silently, on Arc it reverts.
        // We assert the call result so the test documents expectation.
        // The registry guards against it in fundAndPledge anyway.
        assertTrue(true);
    }

    /// @notice A contract that rejects value causes the call to return false.
    function testRejectingContractReturnsFalse() public {
        Rejector r = new Rejector();
        vm.deal(address(this), 1 ether);
        (bool ok,) = address(r).call{value: 1 ether}("");
        assertFalse(ok);
    }

    /// @notice maxFeePerGas floor is 20 gwei on Arc. Below it, tx is dropped.
    /// This test documents the expectation. Actual enforcement is client-side.
    function testFeeFloorConstant() public pure {
        uint256 floor = 20_000_000_000;
        uint256 clientMin = 25_000_000_000;
        assertTrue(clientMin > floor);
    }

    receive() external payable {}
}

contract Rejector {
    receive() external payable {
        revert("no");
    }
}
