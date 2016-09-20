module.exports = {
  RELEASE_MSG_REGEX: /\s*Bump(|s)\s+for\s+(major|minor|patch)\srelease(|\.)\s*/ig,
  RELEASE_LEVELS:    [
    'major',
    'minor',
    'patch'
  ],
  CONFIG_FILE_PATH: '.gb-release.yml',
  MAX_COMMIT_MSGS:  15
};