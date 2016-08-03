const _          = require('lodash');
const GithubAPI  = require('github');
const Promise    = require('bluebird');
const fileExists = require('file-exists');
const YAML       = require('yamljs');
const log        = require('./src/logger');
const releaser = require('./src/releaser');

const CONFIG_FILE_PATH = '.gb-release.yml';

const defaultConfig = {
  github: {
    usernameEnvVar: 'DOCKER_GITHUB_USER',
    codeEnvVar:     'DOCKER_GITHUB_CODE'
  },
  versionInFiles: []
};

let config = {};

if (!fileExists('package.json')) {
  log.error();
}

if (!fileExists(CONFIG_FILE_PATH)) {
  log.warn('No .gb-release.yml found. Using default');
} else {
  config = _.defaultsDeep(YAML.load(CONFIG_FILE_PATH), defaultConfig);
}

log.info(`Performing release with config: ${JSON.stringify(config, null, 2)}`);

const getEnvVar = (name) => {
  if (!_.isString(process.env[name]) || process.env[name].length == 0) {
    throw new Error(`Environment variable ${name} not found`);
  }
  return process.env[name];
};

const githubClient = new GithubAPI({
  debug:   true,
  Promise: Promise
});

githubClient.authenticate({
  type:     "basic",
  username: getEnvVar(config.github.usernameEnvVar),
  password: getEnvVar(config.github.codeEnvVar)
});

releaser(config, githubClient, 'minor');