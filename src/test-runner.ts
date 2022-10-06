import { CliWrapper } from "./cli-wrapper";
import { TestRunParams } from "./interface";

class TestRunner {
  constructor(private cliWrapper: CliWrapper) {}

  /**
   * Executes the given test and waits for it
   * to complete. The test output is then read
   * and the result determined. All steps are
   * then returned including whether they
   * passed or not.
   */
  public async run(params: TestRunParams) {
    const output = await this.cliWrapper.run(params);

    const steps: TestRunner.Step[] = output
      .map(TestRunner.extractStepMaybe)
      .filter((step) => step !== null);

    if (!steps.length) {
      // Even empty tests will have at least 2 steps:
      // ["start of test", "end of test"]
      // Therefore, we may need to update this library
      // to cover a change in the Ui-licious API
      throw new Error("Unable to read the test output properly.\n" + output.join("\n"))
    }

    const overallResult = output
      .map(TestRunner.extractResultMaybe)
      .filter((d) => d !== null)
      .pop();

    const testRunUrl = output
      .map(TestRunner.extractRunUrlMaybe)
      .filter((d) => d !== null)
      .pop();

    return {
      didPass: this.didPassTest(overallResult, steps),
      steps,
      testRunUrl,
    };
  }

  /**
   * Whilst we can determine the result based
   * on whether _each_ step passed, it is safer
   * to check what Ui-licious determined as
   * the result - which it prints at the end
   * of the test.
   *
   * As a fallback, in case our output reader
   * was unable to figure out the result, we
   * default to checking if all steps passed.
   */
  private didPassTest(
    overallResult: string,
    steps: TestRunner.Step[]
  ): boolean {
    return ["success", "failure"].includes(overallResult)
      ? overallResult === "success"
      : steps.every((step) => step.didPass);
  }

  private static extractStepMaybe(output: string): TestRunner.Step | null {
    if (output.includes("ERROR - File not found in project")) {
      throw new Error(output);
    }

    if (!output.startsWith("[Step")) {
      return null;
    }

    // infer from "[Step 1 - success]: step title - 0.001"
    const stepLine = output;

    const [stepLeft, stepRight] = stepLine.split("]:");
    const [stepNumber, stepOutcome] = stepLeft.split("[Step ")[1].split(" - ");
    const [title, time] = stepRight.split(" - ");

    return {
      stepNumber: Number.parseInt(stepNumber),
      didPass: stepOutcome.trim() !== "failure",
      title: title.trim(),
      time: Number.parseFloat(time),
    };
  }

  private static extractResultMaybe(output: string): string | null {
    const resultRegexp = /Test result: ([a-zA-Z]*)/;
    // if match, the array will store the captured group
    // at index 1, otherwise it'll be null
    const match = output.match(resultRegexp);
    return (match && match[1]) || null;
  }

  private static extractRunUrlMaybe(output: string): string | null {
    const runUrlRegexp = /See full results at: (https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*))/;
    // if match, the array will store the captured group
    // at index 1, otherwise it'll be null
    const match = output.match(runUrlRegexp);
    return (match && match[1]) || null;
  }
}

namespace TestRunner {
  export interface Step {
    stepNumber: number;
    title: string;
    didPass: boolean;
    time: number;
  }
}

export { TestRunner };
