import { Octokit } from "@octokit/rest";
import { addPath, exportVariable, getInput, info, setFailed } from "@actions/core";
import { stat, symlink, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { downloadTool, extractTar, extractZip } from "@actions/tool-cache";
import dedent from "dedent";

//#region node_modules/.pnpm/@octokit+auth-token@5.1.0/node_modules/@octokit/auth-token/dist-bundle/index.js
var REGEX_IS_INSTALLATION_LEGACY = /^v1\./;
var REGEX_IS_INSTALLATION = /^ghs_/;
var REGEX_IS_USER_TO_SERVER = /^ghu_/;
async function auth(token) {
	const isApp = token.split(/\./).length === 3;
	const isInstallation = REGEX_IS_INSTALLATION_LEGACY.test(token) || REGEX_IS_INSTALLATION.test(token);
	const isUserToServer = REGEX_IS_USER_TO_SERVER.test(token);
	return {
		type: "token",
		token,
		tokenType: isApp ? "app" : isInstallation ? "installation" : isUserToServer ? "user-to-server" : "oauth"
	};
}
function withAuthorizationPrefix(token) {
	if (token.split(/\./).length === 3) return `bearer ${token}`;
	return `token ${token}`;
}
async function hook(token, request, route, parameters) {
	const endpoint = request.endpoint.merge(route, parameters);
	endpoint.headers.authorization = withAuthorizationPrefix(token);
	return request(endpoint);
}
var createTokenAuth = function createTokenAuth2(token) {
	if (!token) throw new Error("[@octokit/auth-token] No token passed to createTokenAuth");
	if (typeof token !== "string") throw new Error("[@octokit/auth-token] Token passed to createTokenAuth is not a string");
	token = token.replace(/^(token|bearer) +/i, "");
	return Object.assign(auth.bind(null, token), { hook: hook.bind(null, token) });
};

//#endregion
//#region node_modules/.pnpm/@octokit+auth-action@5.1.1/node_modules/@octokit/auth-action/dist-src/index.js
const createActionAuth = function createActionAuth2() {
	if (!process.env.GITHUB_ACTION) throw new Error("[@octokit/auth-action] `GITHUB_ACTION` environment variable is not set. @octokit/auth-action is meant to be used in GitHub Actions only.");
	const definitions = [
		process.env.GITHUB_TOKEN,
		process.env.INPUT_GITHUB_TOKEN,
		process.env.INPUT_TOKEN
	].filter(Boolean);
	if (definitions.length === 0) throw new Error("[@octokit/auth-action] `GITHUB_TOKEN` variable is not set. It must be set on either `env:` or `with:`. See https://github.com/octokit/auth-action.js#createactionauth");
	if (definitions.length > 1) throw new Error("[@octokit/auth-action] The token variable is specified more than once. Use either `with.token`, `with.GITHUB_TOKEN`, or `env.GITHUB_TOKEN`. See https://github.com/octokit/auth-action.js#createactionauth");
	const token = definitions.pop();
	return createTokenAuth(token);
};

//#endregion
//#region src/helpers.ts
const getInput$1 = (name) => {
	return getInput(name) === "" ? void 0 : getInput(name);
};

//#endregion
//#region node_modules/.pnpm/@octokit+request-error@6.1.8/node_modules/@octokit/request-error/dist-src/index.js
var RequestError = class extends Error {
	name;
	/**
	* http status code
	*/
	status;
	/**
	* Request options that lead to the error.
	*/
	request;
	/**
	* Response object if a response was received
	*/
	response;
	constructor(message, statusCode, options) {
		super(message);
		this.name = "HttpError";
		this.status = Number.parseInt(statusCode);
		if (Number.isNaN(this.status)) this.status = 0;
		if ("response" in options) this.response = options.response;
		const requestCopy = Object.assign({}, options.request);
		if (options.request.headers.authorization) requestCopy.headers = Object.assign({}, options.request.headers, { authorization: options.request.headers.authorization.replace(/(?<! ) .*$/, " [REDACTED]") });
		requestCopy.url = requestCopy.url.replace(/\bclient_secret=\w+/g, "client_secret=[REDACTED]").replace(/\baccess_token=\w+/g, "access_token=[REDACTED]");
		this.request = requestCopy;
	}
};

//#endregion
//#region src/setup.ts
const defaultOptions = {
	version: "latest",
	platform: process.platform,
	octokit: new Octokit()
};
const setup = async (config) => {
	const options = {
		...defaultOptions,
		...config
	};
	try {
		const archivePath = await download(options);
		await install(archivePath, options);
		await authenticate(options);
	} catch (error) {
		if (error instanceof Error) {
			console.log(error.message);
			setFailed(error.message);
		}
	}
};
/**
* Downloads the Exoscale CLI
*/
const download = async (options) => {
	try {
		const releaseId = await findRelease(options);
		const assetURL = await findAsset(releaseId, options);
		return await downloadTool(assetURL);
	} catch (error) {
		if (error instanceof RequestError) {
			const requestError = error;
			if (requestError.status === 403 && requestError.response?.headers["x-ratelimit-remaining"] === "0") throw new Error(`
                    You have exceeded the GitHub API rate limit.
                    Please try again in ${requestError.response?.headers["x-ratelimit-reset"]} seconds.
                    If you have not already done so, you can try authenticating calls to the GitHub API
                    by setting the \`GITHUB_TOKEN\` environment variable.
                `);
		}
		throw error;
	}
};
/**
* Finds the release for the given version
*/
const findRelease = async (options) => {
	try {
		if (options.version === "latest") return (await options.octokit.repos.getLatestRelease({
			owner: "exoscale",
			repo: "cli"
		})).data.id;
		return (await options.octokit.repos.getReleaseByTag({
			owner: "exoscale",
			repo: "cli",
			tag: `v${options.version}`
		})).data.id;
	} catch (error) {
		if (error instanceof RequestError) {
			if (error.status === 404) throw new Error(`Version ${options.version} of the Exoscale CLI does not exist.`);
			throw error;
		}
		throw error;
	}
};
/**
* Finds the asset for the given release ID and options
*/
const findAsset = async (releaseId, options) => {
	const assets = await options.octokit.paginate("GET /repos/{owner}/{repo}/releases/{release_id}/assets", {
		owner: "exoscale",
		repo: "cli",
		release_id: releaseId
	});
	const patterns = new Map([
		["linux", "linux_amd64.tar.gz"],
		["darwin", "darwin_all.tar.gz"],
		["win32", "windows_amd64.zip"]
	]);
	const asset = assets.find((asset$1) => asset$1.name.endsWith(patterns.get(options.platform)));
	if (!asset) throw new Error(`Could not find an Exoscale CLI release for ${options.platform} for the given version.`);
	return asset.browser_download_url;
};
/**
* Installs the downloaded Exoscale CLI
*/
const install = async (archivePath, options) => {
	const pathToCLI = options.platform === "win32" ? await extractZip(archivePath) : await extractTar(archivePath);
	if (options.platform === "darwin" && !await stat(join(pathToCLI, "exo")).catch(() => false)) await symlink(join(pathToCLI, "exoscale-cli"), join(pathToCLI, "exo"));
	addPath(pathToCLI);
};
/**
* Authenticates the Exoscale CLI.
*/
const authenticate = async (options) => {
	if (!options.authentication || Object.entries(options.authentication ?? {}).some(([, value]) => !value)) {
		info("Not authenticating the Exoscale CLI as no authentication options were provided.");
		return;
	}
	const { account, zone, endpoint, key, secret } = options.authentication;
	info(`Authenticating the Exoscale CLI as ${account}.`);
	const configFile = dedent`
	defaultaccount = '${account}'

	[[accounts]]
	defaultZone = '${zone}'
	key = '${key}'
	name = '${account}'
	secret = '${secret}'
	endpoint = '${endpoint ?? `https://api-${zone}.exoscale.com/v2`}'
	environment = ''
	sosendpoint = 'https://sos-${zone}.exo.io'
	`;
	const configPath = join(process.env.RUNNER_TEMP || "/tmp", "exoscale-config.toml");
	await writeFile(configPath, configFile);
	exportVariable("EXOSCALE_CONFIG", configPath);
	exportVariable("EXOSCALE_ACCOUNT", account);
};

//#endregion
//#region src/index.ts
(async () => {
	await setup({
		version: getInput$1("version"),
		platform: process.platform,
		octokit: new Octokit({ auth: (await createActionAuth()()).token }),
		authentication: {
			account: getInput$1("account"),
			zone: getInput$1("zone"),
			key: getInput$1("key"),
			secret: getInput$1("secret")
		}
	});
})();

//#endregion
export {  };