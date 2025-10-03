# Setup Exoscale CLI in GitHub Actions

[![GitHub release (latest SemVer)](https://img.shields.io/github/v/release/nhedger/setup-exoscale?label=latest&logo=github)](https://github.com/marketplace/actions/setup-exoscale)
[![Test](https://github.com/nhedger/setup-exoscale/actions/workflows/test.yaml/badge.svg)](https://github.com/nhedger/setup-exoscale/actions/workflows/test.yaml)
[![Integrate](https://github.com/nhedger/setup-exoscale/actions/workflows/integrate.yaml/badge.svg)](https://github.com/nhedger/setup-exoscale/actions/workflows/integrate.yaml)

**Setup Exoscale** is a GitHub action that provides a cross-platform interface
for setting up the [Exoscale CLI](https://github.com/exoscale/cli) in GitHub
Actions runners.

## Inputs

The following inputs are supported.

```yaml
- name: Setup Exoscale
  uses: nhedger/setup-exoscale@v4
  with:

    # The version of the Exoscale CLI to install.
    # This input is optional and defaults to "latest".
    # Example values: "1.67.0", "latest"
    version: "latest"

    # The default Exoscale zone to use when authenticating the CLI.
    # This input is optional and defaults to "ch-gva-2".
    # This input is required to authenticate the Exoscale CLI.
    # Example values: "ch-gva-2", "de-fra-1"
    zone: "<exoscale-zone>"

    # The Exoscale account to use when authenticating the CLI.
    # This input is optional.
    # This input is required to authenticate the Exoscale CLI.
    # Example value: "my-account"
    account: "<exoscale-account-name>"

    # The Exoscale API key to use when authenticating the CLI.
    # This input is optional.
    # This input is required to authenticate the Exoscale CLI.
    # Example value: "EXOb7e97b99f76e32d36351792f"
    key: "<exoscale-api-key>"

    # The Exoscale API secret to use when authenticating the CLI.
    # This input is optional.
    # This input is required to authenticate the Exoscale CLI.
    # Example value: "yftnYtkmylaguBIkTGslohShq5wKHLEtcTGQbGGBGxY"
    secret: "<exoscale-api-secret>"

    # The GitHub token to use to authenticate GitHub API requests.
    # This input is optional and defaults to the job's GitHub token.
    # Example value: ${{ secrets.GITHUB_TOKEN }}
    token: ${{ github.token }}
```

## Examples

### Basic example

Setup the latest version of the Exoscale CLI.

```yaml
- name: Setup Exoscale CLI
  uses: nhedger/setup-exoscale@v4

- name: Retrieve Exoscale status
  run: exo status
```

### Specific version

Install version `1.67.0` of the Exoscale CLI.

```yaml
- name: Setup Exoscale CLI
  uses: nhedger/setup-exoscale@v4
  with:
    version: 1.67.0

- name: Retrieve Exoscale status
  run: exo status
```

### With authentication

Install the latest version of the Exoscale CLI and authenticate it.

```yaml
- name: Setup Exoscale CLI
  uses: nhedger/setup-exoscale@v4
  with:
    account: my-account
    zone: ch-gva-2
    key: ${{ secrets.EXOSCALE_KEY }}
    secret: ${{ secrets.EXOSCALE_SECRET }}

- name: List Exoscale Compute instances
  run: exo vm list
```

## License

The scripts and documentation in this project are licensed under
the [MIT License](LICENSE.md).
