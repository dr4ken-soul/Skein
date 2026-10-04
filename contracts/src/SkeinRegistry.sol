// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

/// @title SkeinRegistry
/// @notice First-writer-wins receivable registry. Records the first pledge on
///         a fingerprinted invoice and pays the seller in the same call.
///         Holds no owner, no treasury and no fee. Amounts are native USDC,
///         18 decimals, because USDC is Arc's native asset.
contract SkeinRegistry {
    /// @notice Public salt. invoiceId is keccak256(salt, fingerprintRoot).
    bytes32 public immutable salt;

    /// @notice A single pledge record for one receivable.
    struct Pledge {
        address lender;
        address seller;
        uint256 advance;
        bytes32 evidenceHash;
        bytes32 verdictHash;
        uint64 pledgedAt;
        uint256 blockNumber;
        bool settled;
    }

    mapping(bytes32 => Pledge) internal pledges;
    mapping(address => bytes32[]) internal idsByLender;
    bytes32[] public ids;
    uint256 public pledgeCount;

    /// @notice The receivable is already financed. Carries the first claim.
    error AlreadyPledged(bytes32 invoiceId, address lender, uint256 blockNumber);
    /// @notice Seller may not be the zero address.
    error ZeroSeller();
    /// @notice Advance may not be zero.
    error ZeroAmount();
    /// @notice Caller is not the lender for this pledge.
    error NotLender();
    /// @notice Caller is not the seller for this pledge.
    error NotSeller();
    /// @notice No pledge exists for this id.
    error NotOpen();
    /// @notice Pledge is already settled.
    error AlreadySettled();
    /// @notice Repayment amount does not match the advance.
    error WrongRepayment(uint256 expected);
    /// @notice Native value transfer failed.
    error TransferFailed();

    /// @notice A receivable was pledged and the seller was paid.
    event Pledged(
        bytes32 indexed invoiceId, address indexed lender, address indexed seller,
        uint256 advance, bytes32 evidenceHash, bytes32 verdictHash, uint256 blockNumber
    );
    /// @notice A pledge was voided by its lender.
    event PledgeReleased(bytes32 indexed invoiceId, address indexed lender);
    /// @notice A seller repaid the advance in full.
    event Repaid(bytes32 indexed invoiceId, address indexed seller, uint256 amount);

    /// @param salt_ Public immutable salt, keccak256("skein.v1") by default.
    constructor(bytes32 salt_) {
        salt = salt_;
    }

    /// @notice Turns a fingerprint root into the registry key.
    /// @param fingerprintRoot Five-key fingerprint root from the reader pipeline.
    /// @return registry key used as the pledge slot id.
    function invoiceId(bytes32 fingerprintRoot) public view returns (bytes32) {
        return keccak256(abi.encode(salt, fingerprintRoot));
    }

    /// @notice Free pre-flight read. Any address, any agent, no gas beyond the call.
    /// @param id Registry key from invoiceId().
    /// @return pledged Whether a pledge exists.
    /// @return lender The pledging lender, or zero.
    /// @return blockNumber Block where the pledge was recorded.
    /// @return settled Whether the receivable has been repaid.
    function check(bytes32 id)
        external
        view
        returns (bool pledged, address lender, uint256 blockNumber, bool settled)
    {
        Pledge storage p = pledges[id];
        pledged = p.lender != address(0);
        return (pledged, p.lender, p.blockNumber, p.settled);
    }

    /// @notice Funds the seller and records the pledge atomically.
    /// @param id Registry key from invoiceId().
    /// @param seller Receives the advance. Must not be the zero address.
    /// @param evidenceHash Hash of the document set the reader saw.
    /// @param verdictHash Hash of the reader verdict, keys and confidence.
    function fundAndPledge(
        bytes32 id, address seller, bytes32 evidenceHash, bytes32 verdictHash
    ) external payable {
        if (seller == address(0)) revert ZeroSeller();
        if (msg.value == 0) revert ZeroAmount();

        Pledge storage existing = pledges[id];
        if (existing.lender != address(0)) {
            revert AlreadyPledged(id, existing.lender, existing.blockNumber);
        }

        pledges[id] = Pledge({
            lender: msg.sender,
            seller: seller,
            advance: msg.value,
            evidenceHash: evidenceHash,
            verdictHash: verdictHash,
            pledgedAt: uint64(block.timestamp),
            blockNumber: block.number,
            settled: false
        });
        idsByLender[msg.sender].push(id);
        ids.push(id);
        pledgeCount++;

        (bool ok, ) = seller.call{value: msg.value}("");
        if (!ok) revert TransferFailed();

        emit Pledged(id, msg.sender, seller, msg.value, evidenceHash, verdictHash, block.number);
    }

    /// @notice Voids a mistaken pledge so the receivable can be financed again.
    ///         Lender only, and only while unsettled. The advance has already
    ///         reached the seller, so this is the lender's own recovery decision.
    /// @param id Registry key to release.
    function releasePledge(bytes32 id) external {
        Pledge storage p = pledges[id];
        if (p.lender == address(0)) revert NotOpen();
        if (msg.sender != p.lender) revert NotLender();
        if (p.settled) revert AlreadySettled();

        address lender = p.lender;
        delete pledges[id];
        emit PledgeReleased(id, lender);
    }

    /// @notice Seller repays the exact advance. Marks the receivable settled.
    /// @param id Registry key to repay.
    function repay(bytes32 id) external payable {
        Pledge storage p = pledges[id];
        if (p.lender == address(0)) revert NotOpen();
        if (msg.sender != p.seller) revert NotSeller();
        if (p.settled) revert AlreadySettled();
        if (msg.value != p.advance) revert WrongRepayment(p.advance);

        p.settled = true;
        (bool ok, ) = p.lender.call{value: msg.value}("");
        if (!ok) revert TransferFailed();

        emit Repaid(id, msg.sender, msg.value);
    }

    /// @notice Ordered id list for the public feed. Avoids wide log queries.
    /// @param from Start index in the global id array.
    /// @param count Number of ids to return.
    function recentIds(uint256 from, uint256 count) external view returns (bytes32[] memory page) {
        uint256 end = from + count;
        if (end > ids.length) end = ids.length;
        page = new bytes32[](end > from ? end - from : 0);
        for (uint256 i = from; i < end; i++) {
            page[i - from] = ids[i];
        }
    }

    /// @notice Pledge history for one lender, for the My Pledges screen.
    /// @param lender Lender address to query.
    function lenderIds(address lender) external view returns (bytes32[] memory) {
        return idsByLender[lender];
    }

    /// @notice Full pledge record for a single id.
    /// @param id Registry key.
    function getPledge(bytes32 id) external view returns (Pledge memory) {
        return pledges[id];
    }
}
