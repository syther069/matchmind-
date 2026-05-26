import { expect } from "chai";
import { ethers } from "hardhat";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";

describe("PredictionRegistry", function () {
  async function deployFixture() {
    const [owner, agent, resolver, stranger] = await ethers.getSigners();
    const Registry = await ethers.getContractFactory("PredictionRegistry");
    const registry = await Registry.deploy(owner.address, agent.address);
    await registry.waitForDeployment();
    await registry.connect(owner).setResolver(resolver.address);
    return { registry, owner, agent, resolver, stranger };
  }

  it("stores immutable AI predictions and emits an event", async function () {
    const { registry, agent } = await deployFixture();

    await expect(registry.connect(agent).submitPrediction(101, 0, 73, "bafyReasoning"))
      .to.emit(registry, "PredictionSubmitted")
      .withArgs(101, 0, 73, "bafyReasoning", anyValue);

    const prediction = await registry.getPrediction(101);
    expect(prediction.matchId).to.equal(101);
    expect(prediction.outcome).to.equal(0);
    expect(prediction.confidence).to.equal(73);
    expect(prediction.reasoningCID).to.equal("bafyReasoning");
    expect(prediction.resolved).to.equal(false);
  });

  it("rejects non-agent submissions and invalid prediction data", async function () {
    const { registry, stranger, agent } = await deployFixture();

    await expect(registry.connect(stranger).submitPrediction(1, 0, 60, "cid"))
      .to.be.revertedWithCustomError(registry, "Unauthorized");
    await expect(registry.connect(agent).submitPrediction(1, 3, 60, "cid"))
      .to.be.revertedWithCustomError(registry, "InvalidOutcome");
    await expect(registry.connect(agent).submitPrediction(1, 0, 0, "cid"))
      .to.be.revertedWithCustomError(registry, "InvalidConfidence");
    await expect(registry.connect(agent).submitPrediction(1, 0, 101, "cid"))
      .to.be.revertedWithCustomError(registry, "InvalidConfidence");
    await expect(registry.connect(agent).submitPrediction(1, 0, 60, ""))
      .to.be.revertedWithCustomError(registry, "EmptyCID");
  });

  it("validates admin setters and missing predictions", async function () {
    const { registry, owner, agent, resolver, stranger } = await deployFixture();

    await expect(registry.connect(owner).setAgent(stranger.address))
      .to.emit(registry, "AgentUpdated")
      .withArgs(agent.address, stranger.address);
    expect(await registry.agent()).to.equal(stranger.address);

    await expect(registry.connect(owner).setAgent(ethers.ZeroAddress))
      .to.be.revertedWithCustomError(registry, "ZeroAddress");
    await expect(registry.connect(owner).setResolver(ethers.ZeroAddress))
      .to.be.revertedWithCustomError(registry, "ZeroAddress");
    await expect(registry.getPrediction(999)).to.be.revertedWithCustomError(registry, "PredictionMissing");
    await expect(registry.connect(resolver).markResolved(999, true))
      .to.be.revertedWithCustomError(registry, "PredictionMissing");
  });

  it("prevents overwriting a committed prediction", async function () {
    const { registry, agent } = await deployFixture();

    await registry.connect(agent).submitPrediction(42, 2, 81, "cid-1");
    await expect(registry.connect(agent).submitPrediction(42, 1, 90, "cid-2"))
      .to.be.revertedWithCustomError(registry, "PredictionExists");
  });

  it("allows only the resolver to mark a prediction resolved", async function () {
    const { registry, agent, resolver, stranger } = await deployFixture();

    await registry.connect(agent).submitPrediction(77, 1, 62, "cid");
    await expect(registry.connect(stranger).markResolved(77, true))
      .to.be.revertedWithCustomError(registry, "Unauthorized");

    await expect(registry.connect(resolver).markResolved(77, true))
      .to.emit(registry, "PredictionResolved")
      .withArgs(77, true, anyValue);

    const prediction = await registry.getPrediction(77);
    expect(prediction.resolved).to.equal(true);
    expect(prediction.correct).to.equal(true);

    await expect(registry.connect(resolver).markResolved(77, true))
      .to.be.revertedWithCustomError(registry, "AlreadyResolved");
  });

  it("rejects zero agent at deployment", async function () {
    const [owner] = await ethers.getSigners();
    const Registry = await ethers.getContractFactory("PredictionRegistry");
    await expect(Registry.deploy(owner.address, ethers.ZeroAddress)).to.be.revertedWithCustomError(
      Registry,
      "ZeroAddress"
    );
  });
});
