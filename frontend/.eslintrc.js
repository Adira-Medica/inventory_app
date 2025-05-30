module.exports = {
  extends: [
    'react-app',
    'react-app/jest'
  ],
  rules: {
    'no-unused-vars': 'warn',
    'no-console': 'warn'
  },
  overrides: [
    {
      files: ['**/*.test.js', '**/*.test.jsx'],
      rules: {
        'no-console': 'off'
      }
    }
  ]
};