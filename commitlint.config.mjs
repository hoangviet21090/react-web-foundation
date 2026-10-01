export default {
  parserPreset: {
    parserOpts: {
      headerPattern:
        /^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)(?:\(([a-z0-9-]+)\))?(!)?: (.+)$/,
      headerCorrespondence: ['type', 'scope', 'breaking', 'subject'],
    },
  },
  plugins: [
    {
      rules: {
        'conventional-header': ({ type, subject }) => [
          Boolean(type && subject),
          'Use type(scope): description, for example feat(projects): add search',
        ],
      },
    },
  ],
  rules: {
    'conventional-header': [2, 'always'],
    'header-max-length': [2, 'always', 100],
    'subject-empty': [2, 'never'],
  },
};
