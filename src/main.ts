import { getInput, info, setFailed, setOutput } from "@actions/core";
import { CliWrapper } from "./cli-wrapper";
import { Runner } from "./runner";
import { TestLister } from "./test-lister";
import { TestRunner } from "./test-runner";
import { getAsBoolean } from "./util";

const accessKey = getInput("access-key", { required: true });

const cliWrapper = new CliWrapper(accessKey);
const testLister = new TestLister(cliWrapper);
const testRunner = new TestRunner(cliWrapper);

const runner = new Runner(testLister, testRunner, info);

runner
  .run({
    projectName: getInput("project", { required: true }),
    tests: getInput("tests", { required: true }),
    browser: getInput("browser", { required: false }),
    dataset: getInput("dataset", { required: false }),
    pattern: getAsBoolean(getInput("pattern", { required: false }) || "false"),
    blowUp: getAsBoolean(getInput("blow-up", { required: false }) || "true"),
    verbose: getAsBoolean(getInput("verbose", { required: false }) || "false"),
  })
  .then((outcome) => {
    setOutput("pass", outcome.didPass ? "true" : "false");
    setOutput("total", `${outcome.totalTests}`);
    setOutput("total-failed", `${outcome.totalFailed}`);
    setOutput("test-outcomes", JSON.stringify(outcome.testOutcomes));
    if (outcome.blowUpMessage) {
      setFailed(outcome.blowUpMessage);
    }
  })
  .catch((e) => setFailed(e.message));
