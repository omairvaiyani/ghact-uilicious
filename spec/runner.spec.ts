import { expect } from "chai";
import { CliWrapper } from "../src/cli-wrapper";
import { Runner } from "../src/runner";
import { TestLister } from "../src/test-lister";
import { TestRunner } from "../src/test-runner";

describe("Runner", () => {
  describe("run", () => {
    const getSubject = (options: { log?: (msg: string) => void } = {}) => {
      const cliWrapper = new CliWrapper("Acc3ssK3y");
      const testLister = new TestLister(cliWrapper);
      const testRunner = new TestRunner(cliWrapper);

      const subject = new Runner(testLister, testRunner, options.log);

      const passRun = (): {
        didPass: boolean;
        steps: TestRunner.Step[];
        testRunUrl: string;
      } => ({
        didPass: true,
        steps: [
          {
            stepNumber: 1,
            time: new Date().getTime(),
            title: "[start of test]",
            didPass: true,
          },
          {
            stepNumber: 2,
            time: new Date().getTime(),
            title: "I do something",
            didPass: true,
          },
          {
            stepNumber: 3,
            time: new Date().getTime(),
            title: "[end of test]",
            didPass: true,
          },
        ],
        testRunUrl:
          "https://client-accesskey.uilicious.com/studio/project/FOOBAR123/editor/test/marketing-website.test.js?testRunId=abc123abc",
      });

      const failRun = (): {
        didPass: boolean;
        steps: TestRunner.Step[];
        testRunUrl: string;
      } => ({
        didPass: false,
        steps: [
          {
            stepNumber: 1,
            time: new Date().getTime(),
            title: "[start of test]",
            didPass: true,
          },
          {
            stepNumber: 2,
            time: new Date().getTime(),
            title: "I do something",
            didPass: false,
          },
          {
            stepNumber: 3,
            time: new Date().getTime(),
            title: "[end of test]",
            didPass: true,
          },
        ],
        testRunUrl:
          "https://client-accesskey.uilicious.com/studio/project/FOOBAR123/editor/test/marketing-website.test.js?testRunId=abc123abc",
      });

      // pass all tests by default
      testRunner.run = async () => {
        return passRun();
      };

      return {
        subject,
        testLister,
        testRunner,
        passRun,
        failRun,
      };
    };

    it("should run the provided test", async () => {
      const { subject, testLister, testRunner, passRun } = getSubject();

      let runParams: any;
      let runCount = 0;
      let listCalled = false;
      testRunner.run = async (params) => {
        runParams = params;
        runCount++;
        return passRun();
      };
      testLister.listAll = async () => {
        listCalled = true;
        return ["login"];
      };

      await subject.run({
        projectName: "Foo",
        tests: "login",
      });

      expect(runCount).to.equal(1);
      expect(runParams).to.eql({
        projectName: "Foo",
        testName: "login",
      });
      expect(listCalled).to.be.false;
    });

    it("should look for tests that match the pattern and only run those", async () => {
      const { subject, testLister, testRunner, passRun } = getSubject();

      let listAllParams: any;
      let listAllCount = 0;
      let filterParams: any;
      let filterCount = 0;
      testLister.listAll = async (params) => {
        listAllCount++;
        listAllParams = params;

        return ["login", "logout", "billing/cancel", "billing/invoice-history"];
      };
      testLister.filter = (list: string[], patterns: string[]) => {
        filterCount++;
        filterParams = [list, patterns];
        return ["billing/cancel", "billing/invoice-history"];
      };

      let runCount = 0;
      let runParams: any[] = [];
      testRunner.run = async (params) => {
        runCount++;
        runParams.push(params);
        return passRun();
      };

      await subject.run({
        projectName: "Foo",
        tests: "billing/**",
        pattern: true,
      });

      expect(listAllCount).to.equal(1);
      expect(listAllParams).to.eql({ projectName: "Foo" });

      expect(filterCount).to.equal(1);
      expect(filterParams[0]).to.eql([
        "login",
        "logout",
        "billing/cancel",
        "billing/invoice-history",
      ]);
      expect(filterParams[1]).to.eql(["billing/**"]);

      expect(runCount).to.equal(2);
      expect(runParams[0]).to.eql({
        projectName: "Foo",
        testName: "billing/cancel",
      });
      expect(runParams[1]).to.eql({
        projectName: "Foo",
        testName: "billing/invoice-history",
      });
    });

    it("should handle multiple tests if comma-separated", async () => {
      const { subject, testLister, testRunner, passRun } = getSubject();

      let listAllCalled = false;
      testLister.listAll = async () => {
        listAllCalled = true;

        return ["login", "logout", "billing/cancel", "billing/invoice-history"];
      };

      let runCount = 0;
      let runParams: any[] = [];
      testRunner.run = async (params) => {
        runCount++;
        runParams.push(params);
        return passRun();
      };

      await subject.run({
        projectName: "Foo",
        tests: "login, logout",
        pattern: false,
      });

      expect(listAllCalled).to.be.false;

      expect(runCount).to.equal(2);
      expect(runParams[0]).to.eql({
        projectName: "Foo",
        testName: "login",
      });
      expect(runParams[1]).to.eql({
        projectName: "Foo",
        testName: "logout",
      });
    });

    it("should send browser and dataset to TestRunner", async () => {
      const { subject, testRunner, passRun } = getSubject();

      let runParams: any;
      testRunner.run = async (params) => {
        runParams = params;
        return passRun();
      };

      await subject.run({
        projectName: "Foo",
        tests: "login",
        browser: "safari",
        dataset: "qa-test",
      });

      expect(runParams).to.have.property("browser", "safari");
      expect(runParams).to.have.property("dataset", "qa-test");
    });

    it("should log messages if verbose:true", async () => {
      let loggedMessages: string[] = [];

      const { subject } = getSubject({
        log: (msg) => loggedMessages.push(msg),
      });

      await subject.run({
        projectName: "Foo",
        tests: "login",
        verbose: true,
      });

      expect(loggedMessages.length).to.be.greaterThan(0);
      loggedMessages.forEach((msg) => expect(msg).to.be.a("string"));
    });

    it("should report test outcomes", async () => {
      const { subject, testRunner, passRun } = getSubject();

      testRunner.run = async () => passRun();

      const outcome = await subject.run({
        projectName: "Foo",
        tests: "login",
      });

      expect(outcome).to.be.ok;
      expect(outcome.didPass).to.equal(true);
      expect(outcome.totalTests).to.equal(1);
      expect(outcome.totalFailed).to.equal(0);
      expect(outcome.blowUpMessage).to.not.be.ok;
    });

    it("should return didPass:false if any test fails", async () => {
      const { subject, testRunner, passRun, failRun } = getSubject();

      testRunner.run = async (params: any) =>
        params.testName === "logout" ? failRun() : passRun();

      const outcome = await subject.run({
        projectName: "Foo",
        tests: "login, logout, forgot-password",
      });

      expect(outcome.didPass).to.equal(false);
      expect(outcome.totalTests).to.equal(3);
      expect(outcome.totalFailed).to.equal(1);
    });

    it("should return didPass:true if all tests pass", async () => {
      const { subject, testRunner, passRun } = getSubject();

      testRunner.run = async () => passRun();

      const outcome = await subject.run({
        projectName: "Foo",
        tests: "login, logout, forgot-password",
      });

      expect(outcome.didPass).to.equal(true);
      expect(outcome.totalTests).to.equal(3);
      expect(outcome.totalFailed).to.equal(0);
      expect(outcome.blowUpMessage).to.not.be.ok;
    });

    it("should return not include blowUpMessage if `blowUp:false`", async () => {
      const { subject, testRunner, failRun } = getSubject();

      testRunner.run = async () => failRun();

      const outcomeWithBlowUp = await subject.run({
        projectName: "Foo",
        tests: "login",
        blowUp: true,
      });

      const outcomeWithoutBlowUp = await subject.run({
        projectName: "Foo",
        tests: "login",
        blowUp: false,
      });

      expect(outcomeWithBlowUp.blowUpMessage).to.equal("1 test(s) failed");
      expect(outcomeWithoutBlowUp.blowUpMessage).to.be.undefined;
    });

    it("should return testOutcomes containing an entry for each test", async () => {
      const { subject, testRunner, passRun } = getSubject();

      testRunner.run = async () => passRun();

      const tests = ["login", "logout", "forgot-password"];

      const outcome = await subject.run({
        projectName: "Foo",
        tests: tests.join(", "),
      });

      expect(outcome.totalTests, "test arranged improperly").have.at.least(1);
      expect(outcome.testOutcomes).to.have.length(outcome.totalTests);
      outcome.testOutcomes.forEach((data, index) => {
        expect(data.testName).to.equal(tests[index]);
        expect(data.testRunUrl).to.include("http");
        expect(data.didPass).to.be.a("boolean");
      });
    });
  });
});
