const { expect } = require("chai")
const { ethers } = require("hardhat");

describe("Community", async function () {

    const VouchThreshold = 3;

    let members;
    let notMembers;
    let community;

    beforeEach(async function () {
        const signers = await ethers.getSigners();

        // initial community members,
        // first signer leaved as a general tx executor, not a member
        members = signers.slice(1, VouchThreshold + 1);

        // regular accounts
        notMembers = signers.slice(VouchThreshold + 1);

        community = await ethers.getContractFactory("Community")
            .then(factory => factory.deploy(VouchThreshold, members));
    });

    const getSignature = async (candidate, member) => {
        const message = ethers.solidityPackedKeccak256(["address", "address"], [community.target, candidate.address]);
        return await member.signMessage(ethers.toBeArray(message));
    }

    describe("ctor", async function () {
        it("Should revert if initial member count is less than vouch threshold", async function () {
            const factory = await ethers.getContractFactory("Community");
            await expect(factory.deploy(VouchThreshold + 1, members))
                .to.be.revertedWithCustomError(community, "NoQuorum");
        });
    });

    describe("requestIdentification()", async function () {
        it("Should add a candidate", async function () {
            const candidate = notMembers[0];

            // assert account is not a candidate
            // and not a member
            expect(await community.candidates(candidate)).to.be.false;
            expect(await community.members(candidate)).to.be.false;

            // assert event is emitted
            await expect(community.connect(candidate).requestIdentification())
                .to.emit(community, "IdentificationRequested")
                .withArgs(candidate.address);

            // assert account is a candidate
            // but not a member
            expect(await community.candidates(candidate)).to.be.true;
            expect(await community.members(candidate)).to.be.false;
        });

        it("Should revert if sender is a memeber already", async function () {
            const member = members[0];
            await expect(community.connect(member).requestIdentification())
                .to.be.revertedWithCustomError(community, "AlreadyMember");
        });

        it("Should revert if sender is a candidate already", async function () {
            const candidate = notMembers[0];
            const comm = community.connect(candidate);

            // first request is ok
            await comm.requestIdentification();

            // assert following requests are not ok
            await expect(comm.requestIdentification())
                .to.be.revertedWithCustomError(community, "AlreadyCandidate");
        });
    });

    describe("vouch()", async function () {
        it("Should identify candidate", async function () {
            const candidate = notMembers[0];

            await community.connect(candidate).requestIdentification();

            // assert account is a candidate
            // but not a member
            expect(await community.candidates(candidate)).to.be.true;
            expect(await community.members(candidate)).to.be.false;

            for (let i = 0; i < VouchThreshold; i++) {
                const signature = await getSignature(candidate, members[i]);

                if (i < VouchThreshold - 1) {
                    await community.vouch(candidate, signature);
                }
                else {
                    // assert event is emitted when enough identified
                    // accounts vouched for the new account
                    await expect(community.vouch(candidate, signature))
                        .to.emit(community, "Identified")
                        .withArgs(candidate.address);
                }
            }

            // assert account is not a candidate
            // but is a member
            expect(await community.candidates(candidate)).to.be.false;
            expect(await community.members(candidate)).to.be.true;
        });

        it("Should identify candidates in parallel", async function () {
            const candidate1 = notMembers[0];
            const candidate2 = notMembers[1];

            await community.connect(candidate1).requestIdentification();
            await community.connect(candidate2).requestIdentification();

            // vote for the second candidate
            for (let i = 0; i < VouchThreshold; i++) {
                const signature = await getSignature(candidate2, members[i]);
                await community.vouch(candidate2, signature);
            }

            // assert the second candidate is a member
            expect(await community.members(candidate2)).to.be.true;

            // vote for the first candidate (without last vouch)
            for (let i = 0; i < VouchThreshold - 1; i++) {
                const signature = await getSignature(candidate1, members[i]);
                await community.vouch(candidate1, signature);
            }

            // last vouch from the second candidate (already a member)
            const signature = await getSignature(candidate1, candidate2);
            await community.vouch(candidate1, signature);

            // assert the first candidate is a member
            expect(await community.members(candidate1)).to.be.true;
        });

        it("Should revert if candidate not found", async function () {
            const candidate = notMembers[0];
            const member = members[0];

            // skip identification request
            // try to vouch right away

            const signature = await getSignature(candidate, member);

            await expect(community.vouch(candidate, signature))
                .to.be.revertedWithCustomError(community, "CandidateNotFound");
        });

        it("Should revert if member not found", async function () {
            const candidate = notMembers[0];
            const member = notMembers[1];

            await community.connect(candidate).requestIdentification();

            const signature = await getSignature(candidate, member);

            await expect(community.vouch(candidate, signature))
                .to.be.revertedWithCustomError(community, "MemberNotFound");
        });

        it("Should be idempotent", async function () {
            const candidate = notMembers[0];
            const member = members[0];

            await community.connect(candidate).requestIdentification();

            // assert account is a candidate
            // with zero votes
            expect(await community.candidates(candidate)).to.be.true;
            expect(await community.candidateVotes(candidate)).to.be.equal(0);

            // vouch for the candidate
            const signature = await getSignature(candidate, member);
            await community.vouch(candidate, signature);

            // assert candidate has one more vote
            expect(await community.candidateVotes(candidate)).to.be.equal(1);

            // vouch for the candidate one more time
            await community.vouch(candidate, signature);

            // assert number of votes hasn't changed
            expect(await community.candidateVotes(candidate)).to.be.equal(1);
        });
    });
});