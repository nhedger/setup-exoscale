import { join } from 'path';
import { Octokit } from '@octokit/rest';
import { symlink, writeFile, stat } from 'fs/promises';
import { RequestError } from '@octokit/request-error';
import { addPath, exportVariable, setFailed } from '@actions/core';
import { downloadTool, extractTar, extractZip } from '@actions/tool-cache';

/**
 * Exoscale Setup Options
 */
export interface SetupOptions {
    /**
     * Version of the exoscale CLI to download
     */
    version: string;

    /**
     * Operating system to download the CLI for
     */
    platform: 'linux' | 'darwin' | 'win32';

    /**
     * Authentication options
     */
    authentication?: {
        /** Whether to authenticate the Exoscale CLI. */
        authenticate: boolean;

        /** Name of the Exoscale account to use. */
        account: string;

        /** Name of the default Exoscale zone to use. */
        zone: string;

        /** Exoscale API key. */
        key: string;

        /** Exoscale API secret. */
        secret: string;
    };

    /**
     * Octokit instance to use for API calls
     */
    octokit: Octokit;
}

const defaultOptions: SetupOptions = {
    version: 'latest',
    platform: process.platform as 'linux' | 'darwin' | 'win32',
    octokit: new Octokit(),
};

export const setup = async (config: Partial<SetupOptions>) => {
    const options: SetupOptions = { ...defaultOptions, ...config };

    try {
        // Download the Exoscale CLI
        const archivePath = await download(options);

        // Install the Exoscale CLI
        await install(archivePath, options);

        // Authenticate the Exoscale CLI
        if (options.authentication?.authenticate) {
            await authenticate(options);
        }
    } catch (error: any) {
        console.log(error);
        setFailed(error.message);
    }
};

/**
 * Downloads the Exoscale CLI
 */
const download = async (options: SetupOptions): Promise<string> => {
    try {
        const releaseId = await findRelease(options);
        const assetURL = await findAsset(releaseId, options);
        return await downloadTool(assetURL);
    } catch (error) {
        if (typeof error === RequestError) {
            const requestError = error as RequestError;
            if (
                requestError.status === 403 &&
                requestError.response?.headers['x-ratelimit-remaining'] === '0'
            ) {
                throw new Error(`
                    You have exceeded the GitHub API rate limit.
                    Please try again in ${requestError.response?.headers['x-ratelimit-reset']} seconds.
                    If you have not already done so, you can try authenticating calls to the GitHub API
                    by setting the \`GITHUB_TOKEN\` environment variable.
                `);
            }
        }
        throw error;
    }
};

/**
 * Finds the release for the given version
 */
const findRelease = async (options: SetupOptions) => {
    try {
        if (options.version === 'latest') {
            return (
                await options.octokit.repos.getLatestRelease({
                    owner: 'exoscale',
                    repo: 'cli',
                })
            ).data.id;
        }

        return (
            await options.octokit.repos.getReleaseByTag({
                owner: 'exoscale',
                repo: 'cli',
                tag: `v${options.version}`,
            })
        ).data.id;
    } catch (error) {
        if (typeof error === RequestError) {
            const requestError = error as RequestError;
            if (requestError.status === 404) {
                throw new Error(
                    `Version ${options.version} of the Exoscale CLI does not exist.`
                );
            }
            throw error;
        }
        throw error;
    }
};

/**
 * Finds the asset for the given release ID and options
 */
const findAsset = async (releaseId: number, options: SetupOptions) => {
    const assets = await options.octokit.repos.listReleaseAssets({
        owner: 'exoscale',
        repo: 'cli',
        release_id: releaseId,
    });

    const patterns: Map<string, string> = new Map([
        ['linux', 'linux_amd64.tar.gz'],
        ['darwin', 'darwin_all.tar.gz'],
        ['win32', 'windows_amd64.zip'],
    ]);

    const asset = assets.data.find((asset) =>
        asset.name.endsWith(
            patterns.get(options.platform) as SetupOptions['platform']
        )
    );

    if (!asset) {
        throw new Error(
            `Could not find an Exoscale CLI release for ${options.platform} for the given version.`
        );
    }

    return asset.browser_download_url;
};

/**
 * Installs the downloaded Exoscale CLI
 */
const install = async (archivePath: string, options: SetupOptions) => {
    const pathToCLI =
        options.platform === 'win32'
            ? await extractZip(archivePath)
            : await extractTar(archivePath);

    // The macOS binary is named "exoscale-cli" in some version instead of "exo" like on other
    // platforms, so we need to create a symlink to make it available as "exo" as well.
    if (options.platform === 'darwin' && !(await stat(join(pathToCLI, 'exo')).catch(() => false))) {
        await symlink(join(pathToCLI, 'exoscale-cli'), join(pathToCLI, 'exo'));
    }

    // Add the CLI binary to the PATH
    addPath(pathToCLI);
};

/**
 * Authenticates the Exoscale CLI.
 */
const authenticate = async (options: SetupOptions) => {
    if (Object.entries(options.authentication!).some(([, value]) => !value)) {
        throw new Error(`
            Cannot authenticate the Exoscale CLI without all authentication options.
            Please provide the following options: account, zone, key, secret.
        `);
    }

    const { account, zone, key, secret } = options.authentication!;

    const configFile =
        `defaultaccount = "${account}"\n` +
        '[[accounts]]\n' +
        `  account = "${account}"\n` +
        `  defaultZone = "${zone}"\n` +
        `  endpoint = "https://api.exoscale.com/v1"\n` +
        `  environment = ""\n` +
        `  key = "${key}"\n` +
        `  name = "${account}"\n` +
        `  secret = "${secret}"\n`;

    const configPath = join(
        process.env.RUNNER_TEMP || '/tmp',
        'exoscale-config.toml'
    );

    await writeFile(configPath, configFile);

    // Set the configuration file path and account name as environment variables
    // so that the Exoscale CLI can find them automatically.
    exportVariable('EXOSCALE_CONFIG', configPath);
    exportVariable('EXOSCALE_ACCOUNT', account);
};
