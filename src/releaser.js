const _          = require('lodash');
const path       = require('path');
const fileExists = require('file-exists');
const log        = require('./logger');

const RELEASE_TYPES = [
  'major',
  'minor',
  'patch'
];

const RELEASE_MSG_REGEX = /^\s*Bump(|s)\s+for\s+(major|minor|patch)\srelease(|\.)\s*$/ig;

const isReleaseMessage = (message) => message.match(RELEASE_MSG_REGEX);

const releaser = (config, githubClient, releaseType, nextVersion) => {
  return githubClient.repos.getCommits({
    user: 'groupby',
    repo: 'searchandiser-ui'
  }).then((commits) => {
    let i                     = 0;
    const commitsSinceRelease = [];

    while (isReleaseMessage(commits[i].commit.message)) {
      commitsSinceRelease.push(commits[i]);
      i++;
    }

    if (commitsSinceRelease.length === 0) {
      return Promise.reject('No commits since last release, aborting release');
    } else {
      return Promise.resolve(commitsSinceRelease);
    }
  });

  const bumpVersions = () => {
    return config.versionInFiles.forEach((file) => {
      if (!fileExists(file)) {
        log.warn(`file: ${file} does not exist`);
        return;
      }


    });
  };

  const doRelease = (commitsSinceRelease) => {
    let releaseMsg = 'Commits since last release:\n\n';
    releaseMsg += commitsSinceRelease.reduce((result, commit) => {
      result += `- ${commit.commit.message}\n`;
      return result;
    }, '');
  };
};

module.exports = releaser;