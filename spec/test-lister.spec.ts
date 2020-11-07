import { expect } from "chai";
import { CliWrapper } from "../src/cli-wrapper";
import { TestLister } from "../src/test-lister";

describe("TestLister", () => {
  const downloadFixture: string[] = require("./fixtures/download.json");

  /**
   * A list of test names that match the
   * expected output from `downloadFixture`
   */
  const allTests = () => [
    "authentication/logout",
    "authentication/login",
    "authentication/password-reset",
    "helpers/get-date",
    "helpers/set-object",
    "post-hook",
    "pre-hook",
    "marketing-website",
    "billing/cancel",
    "billing/invoice-history",
    "folder/foo-bar",
  ];

  const getCliWrapper = () => {
    const cliWrapper = new CliWrapper("foo");
    cliWrapper.download = async () => {
      return [...downloadFixture];
    };
    return cliWrapper;
  };

  describe("listAll", () => {
    it("should return all tests by default", async () => {
      const subject = new TestLister(getCliWrapper());
      const list = await subject.listAll({
        projectName: "Foo",
      });

      expect(list).to.be.an.instanceOf(Array);
      expect(list).to.have.length(allTests().length);
    });

    it("should remove file extension from test name", async () => {
      const subject = new TestLister(getCliWrapper());
      const list = await subject.listAll({
        projectName: "Foo",
      });

      const testName = list.find((t) => t.includes("post-hook"));

      expect(testName).to.equal("post-hook");
    });

    it("should handled tests in folders", async () => {
      const subject = new TestLister(getCliWrapper());
      const list = await subject.listAll({
        projectName: "Foo",
      });

      const testNameWithFolder = list.find((t) => t.includes("folder"));

      expect(testNameWithFolder).to.equal("folder/foo-bar");
    });
  });

  describe("filter", () => {
    it("should return all tests if pattern is '**'", () => {
      const subject = new TestLister(getCliWrapper());
      const list = allTests();
      const filteredList = subject.filter(list, ["**"]);
      expect(filteredList).to.be.an.instanceOf(Array);
      expect(filteredList).to.have.length(list.length);
    });

    it("should not duplicate tests if multiples patterns match", () => {
      const subject = new TestLister(getCliWrapper());
      const list = allTests();
      const filteredList = subject.filter(list, ["**", "**", "billing/**"]);
      expect(filteredList).to.be.an.instanceOf(Array);
      expect(filteredList).to.have.length(list.length);
    });

    it("should ignore unmatched patterns even matched patterns are given", () => {
      const subject = new TestLister(getCliWrapper());
      const list = allTests();
      const filteredList = subject.filter(list, [
        "billing/**",
        "unknown/path/**",
      ]);
      expect(filteredList).to.be.an.instanceOf(Array);
      expect(filteredList).to.have.members([
        "billing/cancel",
        "billing/invoice-history",
      ]);
    });

    it("should return all tests if no pattern is provided", () => {
      const subject = new TestLister(getCliWrapper());
      const list = allTests();
      const filteredList = subject.filter(list, []);
      expect(filteredList).to.be.an.instanceOf(Array);
      expect(filteredList).to.have.length(list.length);
    });

    it("should return exact match where pattern is not a glob", () => {
      const subject = new TestLister(getCliWrapper());
      const list = allTests();
      const filteredList = subject.filter(list, ["post-hook"]);
      expect(filteredList).to.be.an.instanceOf(Array);
      expect(filteredList).to.eql(["post-hook"]);
    });

    it("should return all matches where multiple patterns given", () => {
      const subject = new TestLister(getCliWrapper());
      const list = allTests();
      const filteredList = subject.filter(list, [
        "authentication/**",
        "billing/**",
      ]);
      expect(filteredList).to.be.an.instanceOf(Array);

      const expectedList = [
        "authentication/logout",
        "authentication/login",
        "authentication/password-reset",
        "billing/cancel",
        "billing/invoice-history",
      ];

      expect(filteredList).to.have.length(expectedList.length);
      expect(filteredList).to.contain.all.members(expectedList);
    });

    it("should exclude items in exclusion pattern", () => {
      const subject = new TestLister(getCliWrapper());
      const list = allTests();
      const filteredList = subject.filter(list, ["**", "!helpers/**"]);
      expect(filteredList).to.be.an.instanceOf(Array);

      const expectedList = [
        "authentication/logout",
        "authentication/login",
        "authentication/password-reset",
        "post-hook",
        "pre-hook",
        "marketing-website",
        "billing/cancel",
        "billing/invoice-history",
        "folder/foo-bar",
      ];

      expect(filteredList).to.have.length(expectedList.length);
      expect(filteredList).to.eql(expectedList);
    });

    it("should prioritise exclusion patterns over inclusion", () => {
      const subject = new TestLister(getCliWrapper());
      const list = allTests();
      const filteredList = subject.filter(list, [
        "**",
        "!helpers/**",
        "!*-hook",
      ]);
      expect(filteredList).to.be.an.instanceOf(Array);

      const expectedList = [
        "authentication/logout",
        "authentication/login",
        "authentication/password-reset",
        "marketing-website",
        "billing/cancel",
        "billing/invoice-history",
        "folder/foo-bar",
      ];

      expect(filteredList).to.have.length(expectedList.length);
      expect(filteredList).to.eql(expectedList);
    });

    it("should gracefully ignore invalid patterns", () => {
      const subject = new TestLister(getCliWrapper());
      const list = allTests();
      const filteredList = subject.filter(list, ["//", "..."]);
      expect(filteredList).to.be.an.instanceOf(Array);
      expect(filteredList).to.have.length(0);
    });
  });
});
