import multimatch from "multimatch";
import { CliWrapper } from "./cli-wrapper";
import { TestListerParams } from "./interface";

class TestLister {
  private static DEST_DIR = "/tmp/";
  private static DOWNLOAD_LINE_PREFIX = "Downloaded file - ";
  private static TEST_FILE_EXT = ".test.js";

  constructor(private cliWrapper: CliWrapper) {}

  /**
   * Downloads all files from the given
   * Ui-licious project, and extracts
   * the test names based on the file
   * extension pattern.
   */
  public async listAll(params: TestListerParams): Promise<string[]> {
    const { DEST_DIR: destDir } = TestLister;

    const output = await this.cliWrapper.download({
      projectName: params.projectName,
      destDir,
      ...(params.verbose ? { verbose: params.verbose } : {}),
    });

    return output
      .filter(TestLister.filterDownloadLines())
      .map(TestLister.extractTestName(destDir));
  }

  /**
   * Filters tests by matching against the provided
   * _glob_ patterns. A test path that is matched
   * by any one of the patterns will be included.
   *
   * Negative patterns are removed even where
   * included in another.
   *
   * @see {@link https://github.com/sindresorhus/multimatch}
   * for pattern specification
   */
  public filter(list: string[], patterns: string[]): string[] {
    if (!patterns?.length) {
      return list;
    }
    return multimatch(list, patterns);
  }

  private static filterDownloadLines() {
    return (line: string) => line.startsWith(TestLister.DOWNLOAD_LINE_PREFIX);
  }

  private static extractTestName(destDir: string) {
    const prefix = `${TestLister.DOWNLOAD_LINE_PREFIX}${destDir}`;
    return (line: string) =>
      line.replace(`${prefix}`, "").split(TestLister.TEST_FILE_EXT)[0];
  }
}

export { TestLister };
