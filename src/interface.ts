interface RunnerParams {
  projectName: string;
  tests: string;
  browser?: string;
  dataset?: string;
  dataObject?: string;
  blowUp?: boolean;
  pattern?: boolean;
  verbose?: boolean;
}

interface TestDownloadParams {
  projectName: string;
  destDir: string;
  verbose?: boolean;
}

interface TestListerParams {
  projectName: string;
  globPatterns?: string[];
  verbose?: boolean;
}

interface TestRunParams {
  projectName: string;
  testName: string;
  browser?: string;
  dataset?: string;
  dataObject?: string;
  verbose?: boolean;
}

export { RunnerParams, TestDownloadParams, TestListerParams, TestRunParams };
