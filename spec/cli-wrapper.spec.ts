import { expect } from "chai";
import { CliWrapper } from "../src/cli-wrapper";

describe("CliWrapper", () => {
  const mockSpawnFactory = () => {
    const spawnState: {
      count: number;
      command?: string;
      params?: string[];
      options?: any;
      onExit?: () => void;
    } = {
      count: 0,
    };
    const mockSpawn: any = (
      command: string,
      params: string[],
      options: any
    ) => {
      spawnState.command = command;
      spawnState.params = params;
      spawnState.options = options;
      spawnState.count++;
      return {
        stdout: {
          on(event: string, cb: Function) {
            if (event === "data") {
              setTimeout(() => cb("1. good"), 1);
              setTimeout(() => cb("3. good"), 3);
            }
          },
        },
        stderr: {
          on(event: string, cb: Function) {
            if (event === "data") {
              setTimeout(() => cb("2. bad"), 2);
            }
          },
        },
        on(event: string, cb: () => void) {
          if (event === "exit") {
            setTimeout(cb, 5);
          }
        },
      };
    };
    return { spawnState, mockSpawn };
  };

  describe("run", () => {
    it("should execute the CLI 'run' command", async () => {
      const { spawnState, mockSpawn } = mockSpawnFactory();

      const subject = new CliWrapper("Acc3sK3y", mockSpawn);
      await subject.run({ projectName: "Foo", testName: "Bar" });

      expect(spawnState.count).to.equal(1);
      expect(spawnState.command).to.equal("uilicious-cli");
      expect(spawnState.params[0]).to.equal("run");
      expect(spawnState.params[1]).to.equal("'Foo'");
      expect(spawnState.params[2]).to.equal("'Bar'");
    });

    it("should set access key option", async () => {
      const { spawnState, mockSpawn } = mockSpawnFactory();

      const subject = new CliWrapper("Acc3sK3y", mockSpawn);
      await subject.run({ projectName: "Foo", testName: "Bar" });

      expect(spawnState.count).to.equal(1);
      expect(spawnState.command).to.equal("uilicious-cli");

      const accessKeyOptIndex = spawnState.params.indexOf("-k");
      expect(spawnState.params[accessKeyOptIndex + 1]).to.equal("Acc3sK3y");
    });

    it("should set the 'run' options if provided", async () => {
      const { spawnState, mockSpawn } = mockSpawnFactory();

      const subject = new CliWrapper("foo", mockSpawn);
      await subject.run({
        projectName: "Foo",
        testName: "Bar",
        browser: "firefox",
        dataset: "qa",
        dataObject: `{"deployment_url": "https://github.com/"}`
      });

      expect(spawnState.count).to.equal(1);
      expect(spawnState.command).to.equal("uilicious-cli");

      const browserOptIndex = spawnState.params.indexOf("--browser");
      const datasetOptIndex = spawnState.params.indexOf("--dataset");
      const dataObjectOptIndex = spawnState.params.indexOf("--dataObject");

      expect(spawnState.params[browserOptIndex + 1]).to.equal("firefox");
      expect(spawnState.params[datasetOptIndex + 1]).to.equal("qa");
      expect(spawnState.params[dataObjectOptIndex + 1]).to.equal(`{"deployment_url": "https://github.com/"}`);
    });

    it("should return stdout and stderr in streamed order", async () => {
      const { mockSpawn } = mockSpawnFactory();

      const subject = new CliWrapper("foo", mockSpawn);
      const output = await subject.run({
        projectName: "Foo",
        testName: "Bar",
      });

      expect(output).to.be.an.instanceOf(Array);
      expect(output).to.eql(["1. good", "2. bad", "3. good"]);
    });
  });

  describe("download", () => {
    it("should execute the CLI 'download' command", async () => {
      const { spawnState, mockSpawn } = mockSpawnFactory();

      const subject = new CliWrapper("Acc3sK3y", mockSpawn);
      await subject.download({ projectName: "Foo", destDir: "/tmp/" });

      expect(spawnState.count).to.equal(1);
      expect(spawnState.command).to.equal("uilicious-cli");
      expect(spawnState.params[0]).to.equal("download");
      expect(spawnState.params[1]).to.equal("'Foo'");
      expect(spawnState.params[2]).to.equal("'/tmp/'");
    });

    it("should set access key option", async () => {
      const { spawnState, mockSpawn } = mockSpawnFactory();

      const subject = new CliWrapper("Acc3sK3y", mockSpawn);
      await subject.download({ projectName: "Foo", destDir: "/tmp/" });

      const accessKeyOptIndex = spawnState.params.indexOf("-k");
      expect(spawnState.params[accessKeyOptIndex + 1]).to.equal("Acc3sK3y");
    });

    it("should return stdout and stderr output", async () => {
      const { mockSpawn } = mockSpawnFactory();

      const subject = new CliWrapper("Acc3sK3y", mockSpawn);
      const output = await subject.download({
        projectName: "Foo",
        destDir: "/tmp/",
      });
      expect(output).to.be.ok;
    });
  });
});
