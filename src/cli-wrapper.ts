import childProcess from "child_process";
import { info } from "@actions/core";
import { TestDownloadParams, TestRunParams } from "./interface";

/**
 * Executes shell commands in a spawned child
 * process, specifically, wraps commands available
 * via the "uilicious-cli".
 */
class CliWrapper {
  constructor(private accessKey: string, private spawn = childProcess.spawn) {}

  public async download(params: TestDownloadParams) {
    return this.execute(
      "download",
      [`'${params.projectName}'`, `'${params.destDir}'`],
      params.verbose
    );
  }

  public async run(params: TestRunParams) {
    let opts = [`'${params.projectName}'`, `'${params.testName}'`];

    if (params.browser) {
      opts = opts.concat(["--browser", params.browser]);
    }
    if (params.dataset) {
      opts = opts.concat(["--dataset", params.dataset]);
    }
    if (params.dataObject) {
      opts = opts.concat(["--dataObject", params.dataObject]);
    }

    return this.execute("run", opts, params.verbose);
  }

  private async execute(
    cmd: string,
    params: string[],
    verbose?: boolean
  ): Promise<string[]> {
    return new Promise((resolve) => {
      const command = "uilicious-cli";
      let opts = [cmd, ...params, "-k", this.accessKey];

      const cp = this.spawn(command, opts, {
        shell: true,
      });

      const output: string[] = [];
      const addOutput = (message: Buffer) => {
        const msg = message.toString();
        output.push(msg);
        if (verbose) {
          info(msg);
        }
      };

      cp.stdout.on("data", addOutput);
      cp.stderr.on("data", addOutput);

      cp.on("exit", () => {
        resolve(output);
      });
    });
  }
}

export { CliWrapper };
