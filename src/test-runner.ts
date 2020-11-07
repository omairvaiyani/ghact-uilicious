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
      throw new Error("Unable to read the test output properly.");
    }

    return {
      didPass: this.didPassTest(steps),
      steps,
    };
  }

  private didPassTest(steps: TestRunner.Step[]): boolean {
    return steps.every((step) => step.didPass);
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
