import { setup } from './setup';
import { Octokit } from '@octokit/rest';
import { getInput } from '@actions/core';
import { createActionAuth } from '@octokit/auth-action';

(async () => {
    await setup({
        version: getInput('version'),
        platform: process.platform as 'linux' | 'darwin' | 'win32',
        octokit: new Octokit({
            auth: (await createActionAuth()()).token,
        }),
        authentication: {
            authenticate: getInput('authenticate') === 'true',
            account: getInput('account'),
            zone: getInput('zone'),
            key: getInput('key'),
            secret: getInput('secret'),
        },
    });
})();
