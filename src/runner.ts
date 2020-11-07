import { RunnerParams } from "./interface";
import { TestLister } from "./test-lister";
import { TestRunner } from "./test-runner";

/**
 * Main orchastration class that determines
 * which tests are to be executed, triggers
 * them one-by-one and handles the output
 * values.
 *
 * @see {TestRunner} where individual tests
 * are executed.
 */
class Runner {
  constructor(
    private testLister: TestLister,
    private testRunner: TestRunner,
    private log?: (msg: string) => void
  ) {
    if (!log) {
      this.log = Runner.dummyLog();
    }
  }

  private static dummyLog() {
    return () => {};
  }

  public async run(params: RunnerParams) {
    let didPass: boolean;
    let totalTests: number;
    let totalFailed: number;
    let blowUpMessage: string;
    try {
      const { testLister, testRunner } = this;
      const {
        projectName,
        tests,
        pattern,
        browser,
        dataset,
        blowUp,
        verbose,
      } = params;
      const log = verbose ? this.log : Runner.dummyLog;

      const outcomes: { testName: string; didPass: boolean }[] = [];

      const testNames = tests.split(",").map((t) => t.trim());

      log(`provided tests: ${testNames}`);

      let list: string[] = testNames;
      if (pattern) {
        log("pattern mode, looking for tests in project");
        const allTests = await testLister.listAll({
          projectName,
          ...(verbose ? { verbose } : {}),
        });
        log(
          `found ${allTests.length} test(s), here is a sample: ${[
            ...allTests,
          ].slice(0, 4)}`
        );
        list = testLister.filter(allTests, testNames);
        log(
          `pattern filter matched ${list.length} test(s), here is a sample: ${[
            ...list,
          ].slice(0, 4)}`
        );
      }

      let done = 0;
      for (const testName of list) {
        log(`triggering test ${++done} of ${list.length}: ${testName}`);

        const { didPass } = await testRunner.run({
          projectName,
          testName,
          ...(browser ? { browser } : {}),
          ...(dataset ? { dataset } : {}),
          ...(verbose ? { verbose } : {}),
        });

        log(`"${testName}" ${didPass ? "passed" : "failed"}`);

        outcomes.push({
          testName,
          didPass,
        });
      }

      log("all tests completed, determining outcome");

      const failedOutcomes = outcomes.filter((outcome) => !outcome.didPass);

      totalTests = outcomes.length;
      totalFailed = failedOutcomes.length;
      didPass = totalFailed === 0;
      if (!didPass && blowUp) {
        blowUpMessage = `${totalFailed} test(s) failed`;
      }
    } catch (e) {
      blowUpMessage = e.message;
    }

    return {
      didPass,
      totalTests,
      totalFailed,
      blowUpMessage,
    };
  }
}

export { Runner };
