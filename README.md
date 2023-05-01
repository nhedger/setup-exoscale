![Banner](.github/banner.svg)

[![Test](https://github.com/nhedger/setup-exoscale/actions/workflows/test.yaml/badge.svg)](https://github.com/nhedger/setup-exoscale/actions/workflows/test.yaml)
[![Integrate](https://github.com/nhedger/setup-exoscale/actions/workflows/integrate.yaml/badge.svg)](https://github.com/nhedger/setup-exoscale/actions/workflows/integrate.yaml)

# Setup Exoscale CLI in GitHub Actions

This action provides a **cross-platform** interface for setting up
the [Exoscale CLI](https://github.com/exoscale/cli) in GitHub Actions.

## Inputs

The following inputs are supported.

### `version`

The `version` input is used to specify the version of the CLI to install. If
unspecified, the latest version will be installed.

Example values: `1.67.0`, `latest`

### `authenticate`

The `authenticate` input is used to specify whether to authenticate the CLI.
Unless explicitly set to `true`, the CLI will not be authenticated.

Example values: `true`, `false`

### `zone`

The `zone` input is used to specify the default Exoscale zone to use when
authenticating the CLI. This input is only used if `authenticate` is set to
`true`. By default, the `ch-gva-2` zone is used.

Example values: `ch-gva-2`, `de-fra-1`

### `account`

The `account` input is used to specify the Exoscale account name to use when
authenticating the CLI. This input is only used if `authenticate` is set to
`true`.

Example values: `my-account`

### `key`

The `key` input is used to specify the Exoscale API key to use when
authenticating the CLI. This input is only used if `authenticate` is set to
`true`.

Example value: `EXOb7e97b99f76e32d36351792f`

### `secret`

The `secret` input is used to specify the Exoscale API secret to use when
authenticating the CLI. This input is only used if `authenticate` is set to
`true`.

Example value: `yftnYtkmylaguBIkTGslohShq5wKHLEtcTGQbGGBGxY`

## Examples

### Basic example

Setup the latest version of the Exoscale CLI.

```yaml
-   name: Setup Exoscale CLI
    uses: nhedger/setup-exoscale@v1
```

### Specific version

Install version `1.67.0` of the Exoscale CLI.

```yaml
-   name: Setup Exoscale CLI
    uses: nhedger/setup-exoscale@v1
    with:
        version: 1.67.0
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
```

## License

The scripts and documentation in this project are licensed under
the [MIT License](LICENSE.md).
