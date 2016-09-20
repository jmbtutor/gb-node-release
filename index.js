/*eslint no-process-env: "off" */
const _          = require('lodash');
const GithubAPI  = require('github');
const Promise    = require('bluebird');
const fileExists = require('file-exists');
const YAML       = require('yamljs');
const log        = require('./src/logger');
const releasing  = require('./src/releasing');
const versioning = require('./src/versioning');
const fs         = require('fs');
const git        = require('simple-git');
const CONSTANTS  = require('./src/constants');
const npm        = require('npm');

const args = process.argv.slice(2);

const releaseLevel = args[0] && args[0].toLowerCase();

if (!_.includes(CONSTANTS.RELEASE_LEVELS, releaseLevel)) {
  log.error(`Release level '${releaseLevel}' must be one of: ${CONSTANTS.RELEASE_LEVELS.join(', ')}`);
  process.exit(1);
}

const defaultConfig = {
  github: {
    usernameEnvVar: 'GITHUB_USER',
    codeEnvVar:     'GITHUB_CODE'
  },
  versionInFiles: [],
  npmPublish:     false
};

let config = defaultConfig;

let abort       = false;
let packageJson = null;

// Check for config file
if (!fileExists(CONSTANTS.CONFIG_FILE_PATH)) {
  log.warn('No .gb-release.yml found. Using default');
} else {
  config = _.defaultsDeep(YAML.load(CONSTANTS.CONFIG_FILE_PATH), defaultConfig);
}

// Ensure that package json is present
if (!fileExists('./package.json')) {
  log.error('no package.json found in current directory');
  abort = true;
} else {
  packageJson = JSON.parse(fs.readFileSync('./package.json'));

  if (!packageJson.repository) {
    log.error('repository must be defined in package.json');
    abort = true;
  }
}

// Ensure that any files we are going to edit exist
config.versionInFiles.forEach((file) => {
  if (!fileExists(file)) {
    log.error(`cannot find file to version: ${file}`);
    abort = true;
  }
});

if (abort) {
  log.error('Aborting');
  process.exit(1);
}

const getEnvVar = (name) => {
  if (!_.isString(process.env[name]) || process.env[name].length == 0) {
    log.error(`Environment variable ${name} not found`);
    process.exit(1);
  }
  return process.env[name];
};

const githubClient = new GithubAPI({
  Promise: Promise
});

githubClient.authenticate({
  type:     'basic',
  username: getEnvVar(config.github.usernameEnvVar),
  password: getEnvVar(config.github.codeEnvVar)
});

versioning(git(), config, releaseLevel)
  .delay(1000) // Want to make sure the commits are registered by github before attempting a release
  .then((targetVersion) => releasing(git(), githubClient, config, releaseLevel, targetVersion))
  .then(() => {
    if (config.npmPublish) {
      return new Promise((resolve, reject) => {
        npm.load(packageJson, (err) => {
          if (err) {
            return reject(err);
          }

          npm.commands.publish([], (inner_err) => {
            return inner_err ? reject(inner_err) : resolve();
          });
        });
      });
    }
  })
  .catch((error) => {
    log.error(`error during release ${error || ''}`);
    process.exit(1);
  });