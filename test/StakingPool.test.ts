import { expect } from "chai";
import { ethers, network } from "hardhat";

describe("StakingPool", function () {
  async function deployFixture() {
    const [owner, agent, backend, feeRecipient, alice, bob, carol, stranger] = await ethers.getSigners();
    const minStake = ethers.parseEther("0.01");

    const Registry = await ethers.getContractFactory("PredictionRegistry");
    const registry = await Registry.deploy(owner.address, agent.address);
    await registry.waitForDeployment();

    const Pool = await ethers.getContractFactory("StakingPool");
    const pool = await Pool.deploy(owner.address, await registry.getAddress(), minStake, feeRecipient.address);
    await pool.waitForDeployment();

    const Resolver = await ethers.getContractFactory("OracleResolver");
    const resolver = await Resolver.deploy(
      owner.address,
      await registry.getAddress(),
      await pool.getAddress(),
      backend.address
    );
    await resolver.waitForDeployment();

    await registry.connect(owner).setResolver(await resolver.getAddress());
    await pool.connect(owner).setResolver(await resolver.getAddress());
    await registry.connect(agent).submitPrediction(9001, 0, 74, "bafyReasoning");

    const latest = await ethers.provider.getBlock("latest");
    const kickoff = BigInt(latest!.timestamp + 3600);
    await resolver.connect(backend).openMarket(9001, kickoff);

    return { registry, pool, resolver, owner, agent, backend, feeRecipient, alice, bob, carol, stranger, minStake };
  }

  it("accepts follow and fade stakes before kickoff", async function () {
    const { pool, alice, bob } = await deployFixture();

    await expect(pool.connect(alice).stake(9001, 0, { value: ethers.parseEther("1") }))
      .to.emit(pool, "StakePlaced")
      .withArgs(9001, alice.address, 0, ethers.parseEther("1"));
    await pool.connect(bob).stake(9001, 1, { value: ethers.parseEther("2") });

    const poolState = await pool.pools(9001);
    expect(poolState.followTotal).to.equal(ethers.parseEther("1"));
    expect(poolState.fadeTotal).to.equal(ethers.parseEther("2"));
  });

  it("rejects small stakes, missing markets, and staking after kickoff", async function () {
    const { pool, alice } = await deployFixture();

    await expect(pool.connect(alice).stake(404, 0, { value: ethers.parseEther("1") }))
      .to.be.revertedWithCustomError(pool, "MarketMissing");
    await expect(pool.connect(alice).stake(9001, 0, { value: ethers.parseEther("0.001") }))
      .to.be.revertedWithCustomError(pool, "StakeTooSmall");

    await network.provider.send("evm_increaseTime", [3700]);
    await network.provider.send("evm_mine");

    await expect(pool.connect(alice).stake(9001, 0, { value: ethers.parseEther("1") }))
      .to.be.revertedWithCustomError(pool, "MarketClosed");
  });

  it("calculates proportional payouts and protocol fees", async function () {
    const { pool, resolver, backend, alice, bob, carol } = await deployFixture();

    await pool.connect(alice).stake(9001, 0, { value: ethers.parseEther("1") });
    await pool.connect(bob).stake(9001, 0, { value: ethers.parseEther("3") });
    await pool.connect(carol).stake(9001, 1, { value: ethers.parseEther("2") });

    await expect(resolver.connect(backend).resolveMatch(9001, true))
      .to.emit(pool, "PoolResolved")
      .withArgs(9001, true, ethers.parseEther("4"), ethers.parseEther("2"), ethers.parseEther("0.04"));

    expect(await pool.previewClaim(9001, alice.address)).to.equal(ethers.parseEther("1.49"));
    expect(await pool.previewClaim(9001, bob.address)).to.equal(ethers.parseEther("4.47"));
    expect(await pool.accruedProtocolFees()).to.equal(ethers.parseEther("0.04"));

    await expect(pool.connect(alice).claim(9001))
      .to.emit(pool, "RewardClaimed")
      .withArgs(9001, alice.address, ethers.parseEther("1.49"));
    await expect(pool.connect(carol).claim(9001)).to.be.revertedWithCustomError(pool, "NothingToClaim");
  });

  it("handles no-winner markets by allocating losing liquidity to protocol fees", async function () {
    const { pool, resolver, backend, alice } = await deployFixture();

    await pool.connect(alice).stake(9001, 0, { value: ethers.parseEther("1") });
    await resolver.connect(backend).resolveMatch(9001, false);

    expect(await pool.accruedProtocolFees()).to.equal(ethers.parseEther("1"));
    await expect(pool.connect(alice).claim(9001)).to.be.revertedWithCustomError(pool, "NothingToClaim");
  });

  it("pays fade winners when the agent is wrong", async function () {
    const { pool, resolver, backend, alice, bob } = await deployFixture();

    await pool.connect(alice).stake(9001, 0, { value: ethers.parseEther("2") });
    await pool.connect(bob).stake(9001, 1, { value: ethers.parseEther("1") });
    await resolver.connect(backend).resolveMatch(9001, false);

    expect(await pool.previewClaim(9001, bob.address)).to.equal(ethers.parseEther("2.96"));
    await expect(pool.connect(bob).claim(9001))
      .to.emit(pool, "RewardClaimed")
      .withArgs(9001, bob.address, ethers.parseEther("2.96"));
  });

  it("prevents unauthorized market opening and resolution", async function () {
    const { resolver, pool, stranger } = await deployFixture();

    await expect(resolver.connect(stranger).openMarket(9001, 9999999999))
      .to.be.revertedWithCustomError(resolver, "Unauthorized");
    await expect(pool.connect(stranger).resolvePool(9001, true))
      .to.be.revertedWithCustomError(pool, "Unauthorized");
  });

  it("validates owner configuration and constructor inputs", async function () {
    const { pool, owner, stranger, feeRecipient, registry } = await deployFixture();
    const Pool = await ethers.getContractFactory("StakingPool");

    await expect(Pool.deploy(owner.address, ethers.ZeroAddress, 1, feeRecipient.address))
      .to.be.revertedWithCustomError(Pool, "ZeroAddress");
    await expect(Pool.deploy(owner.address, await registry.getAddress(), 1, ethers.ZeroAddress))
      .to.be.revertedWithCustomError(Pool, "ZeroAddress");

    await expect(pool.connect(owner).setResolver(stranger.address))
      .to.emit(pool, "ResolverUpdated")
      .withArgs(await pool.resolver(), stranger.address);
    await expect(pool.connect(owner).setResolver(ethers.ZeroAddress))
      .to.be.revertedWithCustomError(pool, "ZeroAddress");

    await expect(pool.connect(owner).setFeeRecipient(stranger.address))
      .to.emit(pool, "FeeRecipientUpdated")
      .withArgs(feeRecipient.address, stranger.address);
    await expect(pool.connect(owner).setFeeRecipient(ethers.ZeroAddress))
      .to.be.revertedWithCustomError(pool, "ZeroAddress");

    await expect(pool.connect(owner).setMinStake(ethers.parseEther("0.02")))
      .to.emit(pool, "MinStakeUpdated")
      .withArgs(ethers.parseEther("0.01"), ethers.parseEther("0.02"));
  });

  it("enforces kickoff update and resolution edge cases", async function () {
    const { registry, pool, resolver, backend, agent, alice } = await deployFixture();
    const latest = await ethers.provider.getBlock("latest");

    await expect(resolver.connect(backend).openMarket(9999, latest!.timestamp + 1000))
      .to.be.revertedWithCustomError(pool, "PredictionMissing");
    await expect(resolver.connect(backend).openMarket(9001, latest!.timestamp))
      .to.be.revertedWithCustomError(pool, "InvalidKickoff");

    await network.provider.send("evm_increaseTime", [3700]);
    await network.provider.send("evm_mine");
    await expect(resolver.connect(backend).openMarket(9001, latest!.timestamp + 7200))
      .to.be.revertedWithCustomError(pool, "MarketClosed");

    await registry.connect(agent).submitPrediction(9002, 0, 80, "cid-9002");
    const after = await ethers.provider.getBlock("latest");
    await resolver.connect(backend).openMarket(9002, after!.timestamp + 3600);
    await expect(resolver.connect(backend).openMarket(9002, after!.timestamp + 7200))
      .to.emit(pool, "MarketOpened")
      .withArgs(9002, after!.timestamp + 7200);
    await resolver.connect(backend).resolveMatch(9002, true);
    await expect(resolver.connect(backend).openMarket(9002, after!.timestamp + 7200))
      .to.be.revertedWithCustomError(pool, "PoolResolvedAlready");
    await expect(pool.connect(alice).stake(9002, 0, { value: ethers.parseEther("1") }))
      .to.be.revertedWithCustomError(pool, "PoolResolvedAlready");
    await expect(resolver.connect(backend).resolveMatch(9002, true))
      .to.be.revertedWithCustomError(registry, "AlreadyResolved");
    await expect(pool.connect(backend).resolvePool(404, true))
      .to.be.revertedWithCustomError(pool, "Unauthorized");
  });

  it("covers claim previews, double claims, and fee withdrawal", async function () {
    const { pool, resolver, backend, owner, feeRecipient, alice, bob } = await deployFixture();

    expect(await pool.previewClaim(9001, alice.address)).to.equal(0);
    await expect(pool.connect(alice).claim(9001)).to.be.revertedWithCustomError(pool, "PoolNotResolved");

    await pool.connect(alice).stake(9001, 0, { value: ethers.parseEther("1") });
    await pool.connect(bob).stake(9001, 1, { value: ethers.parseEther("1") });
    await resolver.connect(backend).resolveMatch(9001, true);

    expect(await pool.previewClaim(9001, bob.address)).to.equal(0);
    await pool.connect(alice).claim(9001);
    expect(await pool.previewClaim(9001, alice.address)).to.equal(0);
    await expect(pool.connect(alice).claim(9001)).to.be.revertedWithCustomError(pool, "AlreadyClaimed");

    await expect(pool.connect(owner).withdrawFees())
      .to.emit(pool, "FeesWithdrawn")
      .withArgs(feeRecipient.address, ethers.parseEther("0.02"));
    await expect(pool.connect(owner).withdrawFees()).to.be.revertedWithCustomError(pool, "NothingToClaim");
    await expect(pool.connect(bob).withdrawFees()).to.be.revertedWithCustomError(pool, "OwnableUnauthorizedAccount");
  });

  it("blocks reentrant claim attempts", async function () {
    const { pool, resolver, backend, bob } = await deployFixture();
    const Attacker = await ethers.getContractFactory("ReentrantClaimer");
    const attacker = await Attacker.deploy(await pool.getAddress());
    await attacker.waitForDeployment();

    await attacker.stake(9001, { value: ethers.parseEther("1") });
    await pool.connect(bob).stake(9001, 1, { value: ethers.parseEther("1") });
    await resolver.connect(backend).resolveMatch(9001, true);

    await expect(attacker.attack(9001)).to.be.revertedWithCustomError(pool, "TransferFailed");
  });
});
