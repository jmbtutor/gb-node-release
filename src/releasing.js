const log        = require('./logger');
const fs         = require('fs');
const Promise    = require('bluebird');
const CONSTANTS  = require('./constants');

const isPreviousReleaseMessage = (message, newVersion) => message.match(CONSTANTS.RELEASE_MSG_REGEX) && message.indexOf(newVersion) === -1;
const isReleaseMessage = (message) => message.match(CONSTANTS.RELEASE_MSG_REGEX);

const releaser = (gitClient, githubClient, config, releaseType, newVersion) => {
  const targetPackage = JSON.parse(fs.readFileSync('./package.json'));
  const user          = targetPackage.repository.url.split(/\/+/g)[2];
  const repo          = targetPackage.repository.url.split(/\/+/g)[3].replace('.git', '');

  return getBranch(gitClient)
    .then((branch) => githubClient.repos.getCommits({
      user: user,
      repo: repo,
      sha:  branch
    }))
    .then((commits) => {
      const commitsSinceRelease = [];

      // log.info(JSON.stringify(commits, null, 2));

      const maxCommits = commits.length < CONSTANTS.MAX_COMMIT_MSGS ? commits.length : CONSTANTS.MAX_COMMIT_MSGS;

      for (let i = 0; i < maxCommits; i++) {
        if (isPreviousReleaseMessage(commits[i].commit.message, newVersion)) break;
        commitsSinceRelease.push(commits[i]);
      }

      if (commitsSinceRelease.length === 0) {
        log.error('No commits since last release, aborting release');
        return Promise.reject();
      } else {
        log.info(`Retrieved ${commitsSinceRelease.length} commit messages since last release`);
        return Promise.resolve(commitsSinceRelease);
      }
    })
    .then((commitsSinceRelease) => {
      let releaseMsg = 'Commits since last release:\n\n';
      releaseMsg += commitsSinceRelease.reduce((result, commit) => {
        if (!isReleaseMessage(commit.commit.message)) {
          result += `- ${commit.commit.message}\n`;
        }

        return result;
      }, '');

      if (commitsSinceRelease.length === CONSTANTS.MAX_COMMIT_MSGS) {
        releaseMsg += '\nAnd more commits not included here.';
      }

      return githubClient.repos.createRelease({
        user:     user,
        repo:     repo,
        name:     `Release v${newVersion}`,
        body:     releaseMsg,
        tag_name: `v${newVersion}`
      }).then(() => log.info(`Created release ${newVersion}`));
    });
};

const getBranch = (gitClient) => {
  return new Promise((resolve, reject) => {
    gitClient.status((err, status) => {
      if (err) {
        log.error(err);
        reject();
        return;
      }
      resolve(status.current);
    });
  });
};

module.exports = releaser;