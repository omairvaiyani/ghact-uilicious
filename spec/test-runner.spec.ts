import { expect } from "chai";
import { CliWrapper } from "../src/cli-wrapper";
import { TestRunner } from "../src/test-runner";

describe("TestRunner", () => {
  const successfulRunFixture: string[] = require("./fixtures/run-success.json");
  const failRunFixture: string[] = require("./fixtures/run-fail.json");
  const notFoundRunFixture: string[] = require("./fixtures/run-not-found.json");

  const getCliWrapper = (fixture = successfulRunFixture) => {
    const cliWrapper = new CliWrapper("foo");
    cliWrapper.run = async () => {
      return [...fixture];
    };
    return cliWrapper;
  };

  describe("run", () => {
    it("should trigger the test run once", async () => {
      const cliWrapper = getCliWrapper();

      let runCalls: any[] = [];
      cliWrapper.run = async (params) => {
        runCalls.push(params);
        return [...successfulRunFixture];
      };

      const subject = new TestRunner(cliWrapper);

      await subject.run({
        projectName: "Foo",
        testName: "authentication/login",
        browser: "firefox",
      });

      expect(runCalls).to.have.length(1);
      expect(runCalls[0].projectName).to.equal("Foo");
      expect(runCalls[0].testName).to.equal("authentication/login");
      expect(runCalls[0].browser).to.equal("firefox");
    });

    it("should return the test outcome including all steps", async () => {
      const subject = new TestRunner(getCliWrapper(successfulRunFixture));
      const outcome = await subject.run({
        projectName: "Foo",
        testName: "authentication/login",
      });

      expect(outcome).to.be.ok;
      expect(outcome.didPass).to.be.a("boolean");
      expect(outcome.steps).to.be.an.instanceOf(Array);
      expect(outcome.steps).to.have.length(10);
    });

    it("should return steps in order", async () => {
      const subject = new TestRunner(getCliWrapper(successfulRunFixture));
      const outcome = await subject.run({
        projectName: "Foo",
        testName: "authentication/login",
      });

      let stepNumber = 1;
      outcome.steps.forEach((step) =>
        expect(step.stepNumber).to.equal(stepNumber++)
      );
    });

    it("should include the step message as title", async () => {
      const subject = new TestRunner(getCliWrapper(successfulRunFixture));
      const { steps } = await subject.run({
        projectName: "Foo",
        testName: "authentication/login",
      });

      expect(steps[0].title).to.equal("[start of test]");
      expect(steps[1].title).to.equal(`I go to "https://example.com"`);
      expect(steps[steps.length - 1].title).to.equal("[end of test]");
    });

    it("should return didPass:false if test fails including step failures", async () => {
      const subject = new TestRunner(getCliWrapper(failRunFixture));
      const outcome = await subject.run({
        projectName: "Foo",
        testName: "authentication/login",
      });

      expect(outcome).to.be.ok;
      expect(outcome.didPass).to.be.false;
    });

    it("should specify the exact steps which failed", async () => {
      const subject = new TestRunner(getCliWrapper(failRunFixture));
      const outcome = await subject.run({
        projectName: "Foo",
        testName: "authentication/login",
      });

      const failedSteps = outcome.steps.filter((step) => !step.didPass);
      expect(failedSteps).to.have.length(2);
      expect(failedSteps[0].stepNumber).to.equal(3);
      expect(failedSteps[1].stepNumber).to.equal(5);
    });

    it("should throw if test was not found", async () => {
      const subject = new TestRunner(getCliWrapper(notFoundRunFixture));

      try {
        await subject.run({
          projectName: "Foo",
          testName: "unknown-test",
        });
        fail("should throw");
      } catch (e) {
        expect(e.message).to.include("ERROR - File not found in project");
      }
    });

    it("should throw if test output is not understood", async () => {
      const subject = new TestRunner(
        getCliWrapper(["invalid - test - output"])
      );

      try {
        await subject.run({
          projectName: "Foo",
          testName: "unknown-test",
        });
        fail("should throw");
      } catch (e) {
        expect(e.message).to.include("Unable to read the test output properly");
      }
    });
  });
});
