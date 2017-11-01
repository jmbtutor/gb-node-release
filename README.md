[![Codacy Badge](https://api.codacy.com/project/badge/Grade/5841f98e584e48d2bd78cd22a412d43e)](https://www.codacy.com/app/GroupByInc/gb-node-release?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=groupby/gb-node-release&amp;utm_campaign=Badge_Grade)

# gb-node-release
Simple NPM package for creating github releases

```
npm install -g gb-node-release
```

Within the a given node project, run:
```
release minor
```

Requires that you set environment variables for github user, and API key:
```
export GITHUB_USER=<user>
export GITHUB_CODE=<api key>
```

It will increment the version in `package.json`, as well as any matching 
version numbers specified within files listed in `versionInFiles` in the 
optional configuration yaml `.gb-release.yml`.

```yaml
github:                             # Specify the env vars to find credentials
  usernameEnvVar: GITHUB_USER
  codeEnvVar: GITHUB_CODE
versionInFiles:
  - containingCurrentVersion.txt    # Replace version numbers in these files
npmPublish: false                   # Publish after release. Defaults to false
skipCi: false                       # Skip CI tests for the release commit. Defaults to false
```