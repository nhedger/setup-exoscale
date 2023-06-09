import { getInput } from "./helpers";
import { setup } from "./setup";
import { getInput as coreGetInput } from "@actions/core";
import { createActionAuth } from "@octokit/auth-action";
import { Octokit } from "@octokit/rest";

(async () => {
	await setup({
		version: getInput("version"),
		platform: process.platform as "linux" | "darwin" | "win32",
		octokit: new Octokit({
			auth: (await createActionAuth()()).token,
		}),
		authentication: {
			account: getInput("account"),
			zone: getInput("zone"),
			key: getInput("key"),
			secret: getInput("secret"),
		},
	});
})();
