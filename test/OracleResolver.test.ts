import { expect } from "chai";
import { ethers } from "hardhat";

describe("OracleResolver", function () {
  async function deployFixture() {
    const [owner, agent, backend, feeRecipient, stranger] = await ethers.getSigners();

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
      ethers.parseEther("0.001")
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
    await registry.connect(agent).submitPrediction(2024, 2, 88, "bafyCid");

    return { registry, pool, resolver, owner, agent, backend, stranger };
  }

  it("opens markets and resolves both registry and pool through the trusted backend", async function () {
    const { registry, pool, resolver, backend } = await deployFixture();
    const latest = await ethers.provider.getBlock("latest");
    const kickoff = latest!.timestamp + 7200;

    await expect(resolver.connect(backend).openMarket(2024, kickoff))
      .to.emit(resolver, "MarketConfigured")
      .withArgs(2024, kickoff, backend.address);

    const poolBefore = await pool.pools(2024);
    expect(poolBefore.kickoff).to.equal(kickoff);

    await expect(resolver.connect(backend).resolveMatch(2024, true))
      .to.emit(resolver, "MatchResolutionSubmitted")
      .withArgs(2024, true, backend.address);

    const prediction = await registry.getPrediction(2024);
    const poolAfter = await pool.pools(2024);
    expect(prediction.resolved).to.equal(true);
    expect(prediction.correct).to.equal(true);
    expect(poolAfter.resolved).to.equal(true);
    expect(poolAfter.agentCorrect).to.equal(true);
  });

  it("allows owner to rotate backend but rejects everyone else", async function () {
    const { resolver, owner, backend, stranger } = await deployFixture();

    await expect(resolver.connect(stranger).setBackend(stranger.address))
      .to.be.revertedWithCustomError(resolver, "OwnableUnauthorizedAccount");
    await expect(resolver.connect(owner).setBackend(stranger.address))
      .to.emit(resolver, "BackendUpdated")
      .withArgs(backend.address, stranger.address);
    expect(await resolver.backend()).to.equal(stranger.address);
  });

  it("rejects zero addresses at deployment and backend rotation", async function () {
    const { registry, pool, resolver, owner } = await deployFixture();
    const Resolver = await ethers.getContractFactory("OracleResolver");

    await expect(
      Resolver.deploy(owner.address, ethers.ZeroAddress, await pool.getAddress(), owner.address)
    ).to.be.revertedWithCustomError(Resolver, "ZeroAddress");
    await expect(
      Resolver.deploy(owner.address, await registry.getAddress(), ethers.ZeroAddress, owner.address)
    ).to.be.revertedWithCustomError(Resolver, "ZeroAddress");
    await expect(
      Resolver.deploy(owner.address, await registry.getAddress(), await pool.getAddress(), ethers.ZeroAddress)
    ).to.be.revertedWithCustomError(Resolver, "ZeroAddress");
    await expect(resolver.connect(owner).setBackend(ethers.ZeroAddress))
      .to.be.revertedWithCustomError(resolver, "ZeroAddress");
  });
});
