# UI-licious GitHub Action

This action executes your [UI-licious](https://uilicious.com/) tests and reports the outcome. Use this as part of your GitHub Workflow CI/CD pipeline.

## Inputs

### `access-key`

**Required** Your UI-licious account API key. See instructions [here](https://github.com/uilicious/uilicious-cli).

### `project`

**Required** Your UI-licious project name. You should see this at the top-left corner when viewing the UI-licious editor.

### `tests`

**Required** One or more (comma-separated) tests to run. For advanced usage, see `pattern` input and [example usage](#example-usage).

### `browser`

**Optional** If provided, your tests will run in this browser. See the list of [supported browsers](https://docs.uilicious.com/scripting/config.html). Defaults to your project's settings.

### `dataset`

**Optional** If provided, your tests will run with the given [dataset](https://docs.uilicious.com/scripting/datasets.html#datasets) selected.

### `blow-up`

**Optional** If 'false', the action will not be marked as failed even if tests fail. Defaults to 'true'.

### `pattern`

**Optional** If 'true', the `tests` input will be treated as a [multi-match glob pattern](https://github.com/sindresorhus/multimatch). See [example usage](#example-usage). Defaults to 'false'.

### `verbose`

**Optional** If 'true', info logs will be printed including test run messages from UI-licious. Defaults to 'false'.

## Outputs

### `pass`

If all tests passed: 'true'. Else: 'false'.

### `total`

The number of tests that were ran.

### `total-failed`

The number of tests that reported a failed run.

### `total-outcomes`

A JSON string array containing outcomes for each test:
```json
'[...{ "testName": "string", "didPass": "true"|"false", "testRunUrl": "https://..." }]'
```


## Example usage

Ensure that your `access-key` is stored in GitHub secrets.

### Single test

```yml
uses: omairvaiyani/ghact-uilicious@v1
with:
  access-key: ${{ secrets.UILICIOUS_ACCESS_KEY }}
  project: my-project
  tests: login
```

### Multi-test

```yml
uses: omairvaiyani/ghact-uilicious@v1
with:
  access-key: ${{ secrets.UILICIOUS_ACCESS_KEY }}
  project: my-project
  tests: login, logout
```

### Tests in folders

```yml
uses: omairvaiyani/ghact-uilicious@v1
with:
  access-key: ${{ secrets.UILICIOUS_ACCESS_KEY }}
  project: my-project
  tests: "account/password-reset"
```

### Optional configuration

```yml
uses: omairvaiyani/ghact-uilicious@v1
with:
  access-key: ${{ secrets.UILICIOUS_ACCESS_KEY }}
  project: my-project
  tests: login
  browser: safari
  dataset: qa-sample-data
```

### Advanced usage with patterns

If you set the input `pattern` to "true", you can use [glob-patterns](https://github.com/sindresorhus/multimatch) to match tests rather than individually list one. This is particularly helpful if your test-suite is constantly changing. I recommend that you use strong naming conventions to aid the pattern matching usage here.

**Note** - you must use single quotes when using glob-patterns.

#### Run ALL tests

```yml
uses: omairvaiyani/ghact-uilicious@v1
with:
  access-key: ${{ secrets.UILICIOUS_ACCESS_KEY }}
  project: my-project
  tests: '**'
  pattern: true
```

#### Run a subset of tests

```yml
uses: omairvaiyani/ghact-uilicious@v1
with:
  access-key: ${{ secrets.UILICIOUS_ACCESS_KEY }}
  project: my-project
  tests: 'authentication/**, billing/**'
  pattern: true
```

#### Run ALL but some tests

```yml
uses: omairvaiyani/ghact-uilicious@v1
with:
  access-key: ${{ secrets.UILICIOUS_ACCESS_KEY }}
  project: my-project
  tests: '**, !helpers/**'
  pattern: true
```

## Limitations

Currently there is an issue with tests that contain spaces. This appears to be due to how UI-licious's CLI reads bash arguments - it cuts off the test name on space characters. Please wait for a future release where this is resolved or avoid spaces if you can.
