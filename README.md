![Banner](.github/banner.svg)

[![GitHub release (latest SemVer)](https://img.shields.io/github/v/release/nhedger/setup-exoscale?label=latest&logo=github)](https://github.com/marketplace/actions/setup-exoscale)
[![Test](https://github.com/nhedger/setup-exoscale/actions/workflows/test.yaml/badge.svg)](https://github.com/nhedger/setup-exoscale/actions/workflows/test.yaml)
[![Integrate](https://github.com/nhedger/setup-exoscale/actions/workflows/integrate.yaml/badge.svg)](https://github.com/nhedger/setup-exoscale/actions/workflows/integrate.yaml)

# Setup Exoscale CLI in GitHub Actions

**Setup Exoscale** is a GitHub action that provides a cross-platform interface
for setting up the [Exoscale CLI](https://github.com/exoscale/cli) in GitHub
Actions runners.

## Inputs

The following inputs are supported.

```yaml
- name: Setup Exoscale
  uses: nhedger/setup-exoscale@v1
  with:

    # The version of the Exoscale CLI to install.
    # This input is optional and defaults to "latest".
    # Example values: "1.67.0", "latest"
    version: "latest"

    # Whether to authenticate the Exoscale CLI.
    # This input is optional and defaults to "false".
    # Example values: "true", "false"
    authenticate: false

    # The default Exoscale zone to use when authenticating the CLI.
    # This input is optional and defaults to "ch-gva-2".
    # This input is required if "authenticate" is set to "true".
    # Example values: "ch-gva-2", "de-fra-1"
    zone: "<exoscale-zone>"

    # The Exoscale account to use when authenticating the CLI.
    # This input is optional.
    # This input is required if "authenticate" is set to "true".
    # Example value: "my-account"
    account: "<exoscale-account-name>"

    # The Exoscale API key to use when authenticating the CLI.
    # This input is optional.
    # This input is required if "authenticate" is set to "true".
    # Example value: "EXOb7e97b99f76e32d36351792f"
    key: "<exoscale-api-key>"

    # The Exoscale API secret to use when authenticating the CLI.
    # This input is optional.
    # This input is required if "authenticate" is set to "true".
    # Example value: "yftnYtkmylaguBIkTGslohShq5wKHLEtcTGQbGGBGxY"
    secret: "<exoscale-api-secret>"
```

> Be sure to provide values for the `zone`, `account`, `key` and `secret`
> inputs when setting `authenticate` to `true`.

## Examples

### Basic example

Setup the latest version of the Exoscale CLI.

```yaml
- name: Setup Exoscale CLI
  uses: nhedger/setup-exoscale@v1

- name: Retrieve Exoscale status
  run: exo status
```

### Specific version

Install version `1.67.0` of the Exoscale CLI.

```yaml
- name: Setup Exoscale CLI
  uses: nhedger/setup-exoscale@v1
  with:
    version: 1.67.0

- name: Retrieve Exoscale status
  run: exo status
```

### With authentication

Install the latest version of the Exoscale CLI and authenticate it.

```yaml
- name: Setup Exoscale CLI
  uses: nhedger/setup-exoscale@v1
  with:
    authenticate: true
    account: my-account
    zone: ch-gva-2
    key: ${{ secrets.EXOSCALE_KEY }}
    secret: ${{ secrets.EXOSCALE_SECRET }}

- name: List Exoscale Compute instances
  run: exo vm list
```

## Caveats

This action makes HTTP requests to the GitHub REST API to determine the URL of
the assets to download. By default, these requests are made anonymously,
which means that they are subject to harsher rate limits.

> GitHub-hosted **macOS** runners are typically subject to this issue, because
> most of them share a common IP address, which increases the likelihood of
> hitting the rate limit.

If you encounter rate limiting issues, you can set the `GITHUB_TOKEN`
environment variable to authenticate the requests and increase the
[rate limit][rate-limit].

[rate-limit]: https://docs.github.com/en/actions/learn-github-actions/usage-limits-billing-and-administration#usage-limits

```yaml
- name: Setup Exoscale CLI
  uses: nhedger/setup-exoscale@v1
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

## License

The scripts and documentation in this project are licensed under
the [MIT License](LICENSE.md).
