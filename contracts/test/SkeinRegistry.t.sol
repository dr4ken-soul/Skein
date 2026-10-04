// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Test} from "forge-std/Test.sol";
import {SkeinRegistry} from "../src/SkeinRegistry.sol";

contract RejectingReceiver {
    receive() external payable {
        revert("rejected");
    }
}

contract SkeinRegistryTest is Test {
    SkeinRegistry registry;
    bytes32 constant SALT = keccak256("skein.v1");
    address lenderA = makeAddr("lenderA");
    address lenderB = makeAddr("lenderB");
    address seller = makeAddr("seller");

    bytes32 idA = keccak256("invoice-A");
    bytes32 idB = keccak256("invoice-B");

    function setUp() public {
        registry = new SkeinRegistry(SALT);
        vm.deal(lenderA, 100 ether);
        vm.deal(lenderB, 100 ether);
        vm.deal(seller, 1 ether);
    }

    function testFirstPledgeSucceeds() public {
        uint256 sellerBalBefore = seller.balance;
        vm.prank(lenderA);
        registry.fundAndPledge{value: 1 ether}(idA, seller, bytes32(uint256(1)), bytes32(uint256(2)));

        assertEq(seller.balance, sellerBalBefore + 1 ether);
        assertEq(registry.pledgeCount(), 1);
        bytes32[] memory ids = registry.recentIds(0, 10);
        assertEq(ids.length, 1);
        assertEq(ids[0], idA);

        SkeinRegistry.Pledge memory p = registry.getPledge(idA);
        assertEq(p.lender, lenderA);
        assertEq(p.seller, seller);
        assertEq(p.advance, 1 ether);
        assertEq(p.settled, false);
    }

    function testSecondPledgeRevertsAlreadyPledged() public {
        vm.prank(lenderA);
        registry.fundAndPledge{value: 1 ether}(idA, seller, bytes32(uint256(1)), bytes32(uint256(2)));

        SkeinRegistry.Pledge memory p = registry.getPledge(idA);
        vm.prank(lenderB);
        vm.expectRevert(abi.encodeWithSelector(SkeinRegistry.AlreadyPledged.selector, idA, lenderA, p.blockNumber));
        registry.fundAndPledge{value: 1 ether}(idA, seller, bytes32(uint256(3)), bytes32(uint256(4)));
    }

    function testFuzzCheckAgreesWithWrite(bytes32 fuzzId) public {
        (bool pledgedBefore,,,) = registry.check(fuzzId);
        assertEq(pledgedBefore, false);

        address fSeller = makeAddr(string(abi.encodePacked("seller", fuzzId)));
        vm.deal(fSeller, 1 ether);
        // Give lender enough
        vm.prank(lenderA);
        registry.fundAndPledge{value: 0.01 ether}(fuzzId, fSeller, bytes32(uint256(1)), bytes32(uint256(2)));

        (bool pledgedAfter, address lender,,) = registry.check(fuzzId);
        assertEq(pledgedAfter, true);
        assertEq(lender, lenderA);

        // Second attempt must revert
        vm.prank(lenderB);
        vm.expectRevert();
        registry.fundAndPledge{value: 0.01 ether}(fuzzId, fSeller, bytes32(uint256(1)), bytes32(uint256(2)));
    }

    function testRejectingSellerLeavesSlotEmpty() public {
        RejectingReceiver r = new RejectingReceiver();
        vm.prank(lenderA);
        vm.expectRevert(SkeinRegistry.TransferFailed.selector);
        registry.fundAndPledge{value: 1 ether}(idA, address(r), bytes32(uint256(1)), bytes32(uint256(2)));

        (bool pledged,,,) = registry.check(idA);
        assertEq(pledged, false);
        assertEq(registry.pledgeCount(), 0);
    }

    function testZeroSellerReverts() public {
        vm.prank(lenderA);
        vm.expectRevert(SkeinRegistry.ZeroSeller.selector);
        registry.fundAndPledge{value: 1 ether}(idA, address(0), bytes32(uint256(1)), bytes32(uint256(2)));
    }

    function testZeroAmountReverts() public {
        vm.prank(lenderA);
        vm.expectRevert(SkeinRegistry.ZeroAmount.selector);
        registry.fundAndPledge{value: 0}(idA, seller, bytes32(uint256(1)), bytes32(uint256(2)));
    }

    function testReleaseReopensSlot() public {
        vm.prank(lenderA);
        registry.fundAndPledge{value: 1 ether}(idA, seller, bytes32(uint256(1)), bytes32(uint256(2)));

        vm.prank(lenderA);
        registry.releasePledge(idA);

        (bool pledged,,,) = registry.check(idA);
        assertEq(pledged, false);

        vm.prank(lenderB);
        registry.fundAndPledge{value: 1 ether}(idA, seller, bytes32(uint256(3)), bytes32(uint256(4)));

        SkeinRegistry.Pledge memory p = registry.getPledge(idA);
        assertEq(p.lender, lenderB);
    }

    function testReleaseAccessControl() public {
        vm.prank(lenderA);
        registry.fundAndPledge{value: 1 ether}(idA, seller, bytes32(uint256(1)), bytes32(uint256(2)));

        vm.prank(lenderB);
        vm.expectRevert(SkeinRegistry.NotLender.selector);
        registry.releasePledge(idA);
    }

    function testRepayExact() public {
        vm.prank(lenderA);
        registry.fundAndPledge{value: 1 ether}(idA, seller, bytes32(uint256(1)), bytes32(uint256(2)));

        // Wrong amount
        vm.deal(seller, 2 ether);
        vm.prank(seller);
        vm.expectRevert(abi.encodeWithSelector(SkeinRegistry.WrongRepayment.selector, 1 ether));
        registry.repay{value: 0.5 ether}(idA);

        // Correct amount
        uint256 lenderBalBefore = lenderA.balance;
        vm.prank(seller);
        registry.repay{value: 1 ether}(idA);

        SkeinRegistry.Pledge memory p = registry.getPledge(idA);
        assertEq(p.settled, true);
        assertEq(lenderA.balance, lenderBalBefore + 1 ether);
    }

    function testRepayAccessControl() public {
        vm.prank(lenderA);
        registry.fundAndPledge{value: 1 ether}(idA, seller, bytes32(uint256(1)), bytes32(uint256(2)));

        vm.deal(lenderB, 2 ether);
        vm.prank(lenderB);
        vm.expectRevert(SkeinRegistry.NotSeller.selector);
        registry.repay{value: 1 ether}(idA);
    }

    function testInvariantOneLenderPerId() public {
        vm.prank(lenderA);
        registry.fundAndPledge{value: 1 ether}(idA, seller, bytes32(uint256(1)), bytes32(uint256(2)));

        bytes32[] memory lenderAIds = registry.lenderIds(lenderA);
        assertEq(lenderAIds.length, 1);

        // No second lender can claim same id
        vm.prank(lenderB);
        vm.expectRevert();
        registry.fundAndPledge{value: 1 ether}(idA, seller, bytes32(uint256(1)), bytes32(uint256(2)));
    }

    function testInvoiceIdDerivation() public view {
        bytes32 root = keccak256("test-root");
        bytes32 expected = keccak256(abi.encode(SALT, root));
        assertEq(registry.invoiceId(root), expected);
    }

    function testLenderIdsAndRecentIds() public {
        vm.prank(lenderA);
        registry.fundAndPledge{value: 1 ether}(idA, seller, bytes32(uint256(1)), bytes32(uint256(1)));
        vm.prank(lenderA);
        registry.fundAndPledge{value: 1 ether}(idB, seller, bytes32(uint256(2)), bytes32(uint256(2)));

        bytes32[] memory recent = registry.recentIds(0, 10);
        assertEq(recent.length, 2);
        bytes32[] memory page = registry.recentIds(1, 1);
        assertEq(page.length, 1);
        assertEq(page[0], idB);

        bytes32[] memory empty = registry.recentIds(10, 5);
        assertEq(empty.length, 0);

        bytes32[] memory byLender = registry.lenderIds(lenderA);
        assertEq(byLender.length, 2);
    }

    function testReleaseSettledReverts() public {
        vm.prank(lenderA);
        registry.fundAndPledge{value: 1 ether}(idA, seller, bytes32(uint256(1)), bytes32(uint256(2)));
        vm.deal(seller, 2 ether);
        vm.prank(seller);
        registry.repay{value: 1 ether}(idA);

        vm.prank(lenderA);
        vm.expectRevert(SkeinRegistry.AlreadySettled.selector);
        registry.releasePledge(idA);
    }

    function testRepayAlreadySettledReverts() public {
        vm.prank(lenderA);
        registry.fundAndPledge{value: 1 ether}(idA, seller, bytes32(uint256(1)), bytes32(uint256(2)));
        vm.deal(seller, 3 ether);
        vm.prank(seller);
        registry.repay{value: 1 ether}(idA);

        vm.prank(seller);
        vm.expectRevert(SkeinRegistry.AlreadySettled.selector);
        registry.repay{value: 1 ether}(idA);
    }
}
