// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../SessionManager.sol";

/// @title DemoSocial
/// @notice On-chain social feed demo for Monad Session Arena.
///         Demonstrates that the SessionManager kit works for ANY app — not just gaming.
///
/// Action IDs (must match frontend allowedActions bitmask):
///   1 → POST   (bit 1 → allowedActions bit = 2)
///   2 → LIKE   (bit 2 → allowedActions bit = 4)
///   3 → FOLLOW (bit 3 → allowedActions bit = 8)
///   4 → REPOST (bit 4 → allowedActions bit = 16)
contract DemoSocial is IDemoGame {
    // ── Storage ──────────────────────────────────────────────────────────────

    struct Post {
        address author;
        string content;   // max 280 chars enforced off-chain; stored as-is
        uint256 likes;
        uint256 reposts;
        uint256 timestamp;
    }

    /// @dev Sequential post counter
    uint256 public postCount;

    /// @dev postId → Post
    mapping(uint256 => Post) public posts;

    /// @dev author → list of postIds
    mapping(address => uint256[]) public userPosts;

    /// @dev liker → postId → liked
    mapping(address => mapping(uint256 => bool)) public hasLiked;

    /// @dev follower → followee → following
    mapping(address => mapping(address => bool)) public isFollowing;

    /// @dev address → follower count
    mapping(address => uint256) public followerCount;

    /// @dev address → following count
    mapping(address => uint256) public followingCount;

    /// @dev address → post count
    mapping(address => uint256) public userPostCount;

    /// @dev address → like count
    mapping(address => uint256) public userLikes;

    /// @dev address → repost count
    mapping(address => uint256) public userReposts;

    // ── Events ───────────────────────────────────────────────────────────────

    event PostCreated(uint256 indexed postId, address indexed author, string content, uint256 timestamp);
    event PostLiked(uint256 indexed postId, address indexed liker);
    event UserFollowed(address indexed follower, address indexed followee);
    event PostReposted(uint256 indexed postId, address indexed reposter);

    // ── IDemoGame interface ───────────────────────────────────────────────────

    /// @notice Called by SessionManager after all permission checks pass.
    /// @param player  The session owner (msg.sender of the original session)
    /// @param actionId  1=POST · 2=LIKE · 3=FOLLOW · 4=REPOST
    /// @param params  ABI-encoded action parameters
    function executeAction(address player, uint16 actionId, bytes calldata params) external {
        if (actionId == 1) {
            _post(player, params);
        } else if (actionId == 2) {
            _like(player, params);
        } else if (actionId == 3) {
            _follow(player, params);
        } else if (actionId == 4) {
            _repost(player, params);
        }
    }

    // ── Internal actions ──────────────────────────────────────────────────────

    /// @dev params = abi.encode(string content)
    function _post(address player, bytes calldata params) internal {
        string memory content = abi.decode(params, (string));

        uint256 id = postCount++;
        posts[id] = Post({
            author: player,
            content: content,
            likes: 0,
            reposts: 0,
            timestamp: block.timestamp
        });
        userPosts[player].push(id);
        userPostCount[player]++;

        emit PostCreated(id, player, content, block.timestamp);
    }

    /// @dev params = abi.encode(uint256 postId)
    function _like(address player, bytes calldata params) internal {
        uint256 postId = abi.decode(params, (uint256));
        if (postId >= postCount) return; // silently ignore invalid postId
        if (hasLiked[player][postId]) return; // idempotent

        hasLiked[player][postId] = true;
        posts[postId].likes++;
        userLikes[player]++;

        emit PostLiked(postId, player);
    }

    /// @dev params = abi.encode(address followee)
    function _follow(address player, bytes calldata params) internal {
        address followee = abi.decode(params, (address));
        if (followee == player) return; // can't follow yourself
        if (isFollowing[player][followee]) return; // idempotent

        isFollowing[player][followee] = true;
        followerCount[followee]++;
        followingCount[player]++;

        emit UserFollowed(player, followee);
    }

    /// @dev params = abi.encode(uint256 postId)
    function _repost(address player, bytes calldata params) internal {
        uint256 postId = abi.decode(params, (uint256));
        if (postId >= postCount) return;

        posts[postId].reposts++;
        userReposts[player]++;

        emit PostReposted(postId, player);
    }

    // ── View helpers ──────────────────────────────────────────────────────────

    /// @notice Returns the last N posts (most recent first)
    function getRecentPosts(uint256 n) external view returns (Post[] memory) {
        uint256 total = postCount;
        uint256 size = n > total ? total : n;
        Post[] memory result = new Post[](size);
        for (uint256 i = 0; i < size; i++) {
            result[i] = posts[total - 1 - i];
        }
        return result;
    }

    /// @notice Returns all post IDs by a user
    function getPostsByUser(address user) external view returns (uint256[] memory) {
        return userPosts[user];
    }

    /// @notice Returns a single post
    function getPost(uint256 postId) external view returns (Post memory) {
        return posts[postId];
    }
}
