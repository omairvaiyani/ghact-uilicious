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

    const testOutcomes: {
      testName: string;
      didPass: boolean;
      testRunUrl: string;
    }[] = [];

    try {
      const { testLister, testRunner } = this;
      const { projectName, tests, pattern, browser, dataset, blowUp, verbose } =
        params;
      const log = verbose ? this.log : Runner.dummyLog;

      const testNames = tests.split(",").map((t) => t.trim());

      log(`provided tests: ${testNames}`);

      let list: string[] = testNames;
      if (pattern) {
        log(`pattern mode, looking for tests in project with pattern: ${pattern}`);
        const allTests = await testLister.listAll({
          projectName,
          ...(verbose ? { verbose } : {}),
        });
        log(
          `found ${allTests.length} test(s)`
        );
        list = testLister.filter(allTests, testNames);
        log(
          `pattern filter matched ${list.length} test(s), e.g. '${list[0]}'`
        );
      }

      let done = 0;
      for (const testName of list) {
        log(`triggering test ${++done} of ${list.length}: ${testName}`);

        const { didPass, testRunUrl } = await testRunner.run({
          projectName,
          testName,
          ...(browser ? { browser } : {}),
          ...(dataset ? { dataset } : {}),
          ...(verbose ? { verbose } : {}),
        });

        log(`"${testName}" ${didPass ? "passed" : "failed"} - ${testRunUrl}`);

        testOutcomes.push({
          testName,
          didPass,
          testRunUrl,
        });
      }

      log("all tests completed, determining outcome");

      const failedOutcomes = testOutcomes.filter((outcome) => !outcome.didPass);

      totalTests = testOutcomes.length;
      totalFailed = failedOutcomes.length;
      didPass = totalFailed === 0;

      if (!didPass && blowUp) {
        blowUpMessage = `${totalFailed} test(s) failed`;
      }
    } catch (e) {
      blowUpMessage = e.message;
    }

    return {
      testOutcomes,
      didPass,
      totalTests,
      totalFailed,
      blowUpMessage,
    };
  }
}

export { Runner };
