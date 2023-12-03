// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

contract Community {
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;

    /// @notice Event emitted when a candidate requests identification by community members.
    /// @param candidate Account of the candidate.
    event IdentificationRequested(address indexed candidate);

    /// @notice Event emitted when a candidate receives enough votes and becomes a community member.
    /// @param member Account of the new community member.
    event Identified(address indexed member);

    /// @notice Error thrown if initial members count is less then vouch threshold.
    error NoQuorum();

    /// @notice Error thrown if account requesting identification is already a community member.
    error AlreadyMember();

    /// @notice Error thrown if account requesting identification is already a registered candidate.
    error AlreadyCandidate();

    /// @notice Error thrown if account trying to vouch for a candidate is not a community member.
    error MemberNotFound();

    /// @notice Error thrown if the account, vouching for is performed, is not a registered candidate.
    error CandidateNotFound();

    /// @notice Number of votes required to become a community member.
    uint256 public immutable VOUCH_THRESHOLD;

    /// @notice Dictionary of community members.
    /// @return true if account is a community member.
    mapping(address => bool) public members;

    /// @notice Dictionary of registered candidates.
    /// @return true if account is a candidate and members are allowed to perform identification.
    mapping(address => bool) public candidates;

    /// @notice Dictionary of votes.
    /// @return Number of accounts vouched for the candidate.
    mapping(address => uint256) public candidateVotes;

    /// @dev Dictionary of hashed vouchers (signatures), used to prevent double-vouching.
    mapping(bytes32 => bool) accountedVotes;

    /// @notice Inits the contract.
    /// @param vouchThreshold Number of votes required to become a community member.
    /// @param members_ Initial community members.
    /// @dev Number of members must be greater or equal to `vouchThreshold`.
    constructor(uint256 vouchThreshold, address[] memory members_) {
        if (members_.length < vouchThreshold)
            revert NoQuorum();

        VOUCH_THRESHOLD = vouchThreshold;

        for (uint256 i = 0; i < members_.length; i++) {
            addMember(members_[i]);
        }
    }

    /// @notice Registers `msg.sender` as a candidate.
    /// @dev `msg.sender` must not be a registered candidate or a community member.
    function requestIdentification() external {
        if (candidates[msg.sender])
            revert AlreadyCandidate();

        if (members[msg.sender])
            revert AlreadyMember();

        candidates[msg.sender] = true;
        emit IdentificationRequested(msg.sender);
    }


    /// @notice Performs vouching.
    /// @param candidate Account of a candidate vouching for is performed.
    /// @param signature Community member signature.
    /// @dev `signature` is a EIP-191 (version 0x45) message, signed by a community member vouching for the `candidate`,
    /// where message is a keccak256 hash of tightly packed address of the contract and address of the `candidate` account]:
    /// keccak256("\x19Ethereum Signed Message:\n32" + keccak256(contractAddress, candidateAddress)).
    /// For an example of generating a signature on client side with ethers.js library see `getSignature` function in ../test/Community.js
    function vouch(address candidate, bytes memory signature) external {
        if (!candidates[candidate])
            revert CandidateNotFound();

        address member = keccak256(abi.encodePacked(address(this), candidate))
            .toEthSignedMessageHash()
            .recover(signature);

        if (!members[member])
            revert MemberNotFound();

        bytes32 signatureHash = keccak256(signature);

        if (accountedVotes[signatureHash])
            return;

        candidateVotes[candidate] += 1;
        accountedVotes[signatureHash] = true;

        if (candidateVotes[candidate] >= VOUCH_THRESHOLD) {
            delete candidates[candidate];
            delete candidateVotes[candidate];
            addMember(candidate);
        }
    }

    function addMember(address member) private {
        members[member] = true;
        emit Identified(member);
    }
}
