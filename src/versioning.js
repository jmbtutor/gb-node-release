const Promise    = require('bluebird');
const fileExists = require('file-exists');
const log        = require('./logger');
const fs         = require('fs');
const semver     = require('semver');
const CONSTANTS  = require('./constants');

const versioning = (gitClient, config, release) => {
  log.info('Performing git fetch to ensure we have the latest');
  let targetVersion = null;

  return new Promise((resolve, reject) => {
    gitClient.fetch()
      .status((err, status) => {
        if (status.behind !== 0) {
          log.error('repo is behind origin, do a git pull before running');
          return reject();
        } else if (status.ahead !== 0) {
          log.error('unpushed commits files, push commit before running');
          return reject();
        } else if (status.not_added.length > 0 || status.deleted.length > 0 || status.modified.length > 0 || status.created.length > 0 || status.conflicted.length > 0) {
          log.error('uncommitted changes, create and push a commit before running');
          return reject();
        } else {
          log.info('repo up to date');
        }

        gitClient.log({}, (__, commitLog) => {
          if (commitLog.latest.message.match(CONSTANTS.RELEASE_MSG_REGEX)) {
            log.error('no new commits since last release');
            return reject();
          }

          return bumpVersion(config, release)
            .then((version) => targetVersion = version)
            .then(() => {
              gitClient.add('./*')
                .commit(`Bumps for ${release} release of v${targetVersion}`)
                .push((inner_err) => {
                  if (inner_err) {
                    return reject(inner_err);
                  }

                  resolve(targetVersion);
                });
            })
            .catch(reject);
        });
      });
  });
};

const bumpVersion = (config, release) => {
  log.info('Reading package json');
  const targetPackage = JSON.parse(fs.readFileSync('./package.json'));
  const targetVersion = semver.inc(targetPackage.version, release);

  log.info('Performing release:');
  log.info(` - on package:       ${targetPackage.name}`);
  log.info(` - at version:       ${targetPackage.version}`);
  log.info(` - going to version: ${targetVersion}`);

  for (let i = 0; i < config.versionInFiles.length; i++) {
    const file = config.versionInFiles[i];

    if (!fileExists(file)) {
      log.error(`cannot find file to version: ${file}`);
      return Promise.reject();
    }

    const fileString = fs.readFileSync(file, 'utf8');

    if (!fileString) {
      log.error(`could not read file at: ${file}`);
      return Promise.reject();
    }

    log.info(`Updating file: ${file}`);
    const regex = new RegExp(`${targetPackage.version.replace(/\./g, '\\.')}`, 'g');
    fs.writeFileSync(file, fileString.replace(regex, targetVersion), 'utf8');
  }

  targetPackage.version = targetVersion;
  fs.writeFileSync('./package.json', JSON.stringify(targetPackage, null, 2), 'utf8');
  return Promise.resolve(targetVersion);
};

module.exports = versioning;