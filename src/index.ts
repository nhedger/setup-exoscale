import { setup } from './setup';
import { Octokit } from '@octokit/rest';
import { getInput as coreGetInput } from '@actions/core';
import { createActionAuth } from '@octokit/auth-action';
import { getInput } from "./helpers";

(async () => {
    await setup({
        version: getInput('version'),
        platform: process.platform as 'linux' | 'darwin' | 'win32',
        octokit: new Octokit({
            auth: (await createActionAuth()()).token,
        }),
        authentication: {
            account: getInput('account'),
            zone: getInput('zone'),
            key: getInput('key'),
            secret: getInput('secret'),
        },
    });
})();


