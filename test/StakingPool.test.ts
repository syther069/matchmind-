import { expect } from "chai";
import { ethers, network } from "hardhat";

describe("StakingPool", function () {
  const okb = (value: string) => ethers.parseEther(value);

  async function deployFixture() {
    const [owner, agent, backend, feeRecipient, alice, bob, carol, stranger] = await ethers.getSigners();
    const minStake = okb("0.001");

    const Registry = await ethers.getContractFactory("PredictionRegistry");
    const registry = await Registry.deploy(owner.address, agent.address);
    await registry.waitForDeployment();

    const Pool = await ethers.getContractFactory("StakingPool");
    const pool = await Pool.deploy(
      await registry.getAddress(),
      owner.address,
      agent.address,
      backend.address,
      feeRecipient.address,
      minStake
    );
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

  it("accepts follow and fade native OKB stakes before kickoff", async function () {
    const { pool, alice, bob } = await deployFixture();

    await expect(pool.connect(alice).stake(9001, 0, { value: okb("10") }))
      .to.emit(pool, "StakePlaced")
      .withArgs(9001, alice.address, 0, okb("10"));
    await pool.connect(bob).stake(9001, 1, { value: okb("20") });

    const poolState = await pool.pools(9001);
    expect(poolState.followTotal).to.equal(okb("10"));
    expect(poolState.fadeTotal).to.equal(okb("20"));
    expect(await ethers.provider.getBalance(await pool.getAddress())).to.equal(okb("30"));
  });

  it("rejects small stakes, missing markets, and staking after kickoff", async function () {
    const { pool, alice } = await deployFixture();

    await expect(pool.connect(alice).stake(404, 0, { value: okb("10") })).to.be.revertedWithCustomError(pool, "MarketMissing");
    await expect(pool.connect(alice).stake(9001, 0, { value: okb("0.0005") })).to.be.revertedWithCustomError(pool, "StakeTooSmall");

    await network.provider.send("evm_increaseTime", [3700]);
    await network.provider.send("evm_mine");

    await expect(pool.connect(alice).stake(9001, 0, { value: okb("10") })).to.be.revertedWithCustomError(pool, "MarketClosed");
  });

  it("calculates proportional payouts and protocol fees in native OKB", async function () {
    const { pool, resolver, backend, alice, bob, carol } = await deployFixture();

    await pool.connect(alice).stake(9001, 0, { value: okb("10") });
    await pool.connect(bob).stake(9001, 0, { value: okb("30") });
    await pool.connect(carol).stake(9001, 1, { value: okb("20") });

    await expect(resolver.connect(backend).resolveMatch(9001, true))
      .to.emit(pool, "PoolResolved")
      .withArgs(9001, true, okb("40"), okb("20"), okb("0.4"));

    expect(await pool.previewClaim(9001, alice.address)).to.equal(okb("14.9"));
    expect(await pool.previewClaim(9001, bob.address)).to.equal(okb("44.7"));
    expect(await pool.accruedProtocolFees()).to.equal(okb("0.4"));

    await expect(pool.connect(alice).claim(9001))
      .to.emit(pool, "RewardClaimed")
      .withArgs(9001, alice.address, okb("14.9"));
    await expect(pool.connect(carol).claim(9001)).to.be.revertedWithCustomError(pool, "NothingToClaim");
    expect(await ethers.provider.getBalance(await pool.getAddress())).to.equal(okb("45.1"));
  });

  it("handles no-winner markets by allocating losing liquidity to protocol fees", async function () {
    const { pool, resolver, backend, alice } = await deployFixture();

    await pool.connect(alice).stake(9001, 0, { value: okb("10") });
    await resolver.connect(backend).resolveMatch(9001, false);

    expect(await pool.accruedProtocolFees()).to.equal(okb("10"));
    await expect(pool.connect(alice).claim(9001)).to.be.revertedWithCustomError(pool, "NothingToClaim");
  });

  it("pays fade winners when the agent is wrong", async function () {
    const { pool, resolver, backend, alice, bob } = await deployFixture();

    await pool.connect(alice).stake(9001, 0, { value: okb("20") });
    await pool.connect(bob).stake(9001, 1, { value: okb("10") });
    await resolver.connect(backend).resolveMatch(9001, false);

    expect(await pool.previewClaim(9001, bob.address)).to.equal(okb("29.6"));
    await expect(pool.connect(bob).claim(9001)).to.emit(pool, "RewardClaimed").withArgs(9001, bob.address, okb("29.6"));
  });

  it("prevents unauthorized market opening and resolution", async function () {
    const { resolver, pool, stranger } = await deployFixture();

    await expect(resolver.connect(stranger).openMarket(9001, 9999999999))
      .to.be.revertedWithCustomError(resolver, "Unauthorized");
    await expect(pool.connect(stranger).resolvePool(9001, true)).to.be.revertedWithCustomError(pool, "Unauthorized");
  });

  it("validates owner configuration and constructor inputs", async function () {
    const { pool, owner, agent, backend, stranger, feeRecipient, registry } = await deployFixture();
    const Pool = await ethers.getContractFactory("StakingPool");

    await expect(
      Pool.deploy(ethers.ZeroAddress, owner.address, agent.address, backend.address, feeRecipient.address, 1)
    ).to.be.revertedWithCustomError(Pool, "ZeroAddress");
    await expect(
      Pool.deploy(await registry.getAddress(), owner.address, agent.address, backend.address, ethers.ZeroAddress, 1)
    ).to.be.revertedWithCustomError(Pool, "ZeroAddress");

    await expect(pool.connect(owner).setResolver(stranger.address))
      .to.emit(pool, "ResolverUpdated")
      .withArgs(await pool.resolver(), stranger.address);
    await expect(pool.connect(owner).setResolver(ethers.ZeroAddress)).to.be.revertedWithCustomError(pool, "ZeroAddress");

    await expect(pool.connect(owner).setFeeRecipient(stranger.address))
      .to.emit(pool, "FeeRecipientUpdated")
      .withArgs(feeRecipient.address, stranger.address);
    await expect(pool.connect(owner).setFeeRecipient(ethers.ZeroAddress)).to.be.revertedWithCustomError(pool, "ZeroAddress");

    await expect(pool.connect(owner).setMinStake(okb("2")))
      .to.emit(pool, "MinStakeUpdated")
      .withArgs(okb("0.001"), okb("2"));
    await expect(pool.connect(owner).setMinStake(okb("0.0005"))).to.be.revertedWithCustomError(pool, "StakeTooSmall");
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
    await expect(pool.connect(alice).stake(9002, 0, { value: okb("10") })).to.be.revertedWithCustomError(pool, "PoolResolvedAlready");
    await expect(resolver.connect(backend).resolveMatch(9002, true)).to.be.revertedWithCustomError(registry, "AlreadyResolved");
    await expect(pool.connect(backend).resolvePool(404, true)).to.be.revertedWithCustomError(pool, "Unauthorized");
  });

  it("covers claim previews, double claims, and fee withdrawal", async function () {
    const { pool, resolver, backend, owner, feeRecipient, alice, bob } = await deployFixture();

    expect(await pool.previewClaim(9001, alice.address)).to.equal(0);
    await expect(pool.connect(alice).claim(9001)).to.be.revertedWithCustomError(pool, "PoolNotResolved");

    await pool.connect(alice).stake(9001, 0, { value: okb("10") });
    await pool.connect(bob).stake(9001, 1, { value: okb("10") });
    await resolver.connect(backend).resolveMatch(9001, true);

    expect(await pool.previewClaim(9001, bob.address)).to.equal(0);
    await pool.connect(alice).claim(9001);
    expect(await pool.previewClaim(9001, alice.address)).to.equal(0);
    await expect(pool.connect(alice).claim(9001)).to.be.revertedWithCustomError(pool, "AlreadyClaimed");

    await expect(pool.connect(owner).withdrawFees()).to.emit(pool, "FeesWithdrawn").withArgs(feeRecipient.address, okb("0.2"));
    await expect(pool.connect(owner).withdrawFees()).to.be.revertedWithCustomError(pool, "NothingToClaim");
    await expect(pool.connect(bob).withdrawFees()).to.be.revertedWithCustomError(pool, "OwnableUnauthorizedAccount");
  });

  it("requires native OKB value before staking", async function () {
    const { pool, alice } = await deployFixture();

    await expect(pool.connect(alice).stake(9001, 0)).to.be.revertedWithCustomError(pool, "StakeTooSmall");
  });
});
