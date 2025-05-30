module.exports = {
  extends: [
    'react-app',
    'react-app/jest'
  ],
  rules: {
    // Relax console warnings in development, but allow in production builds
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-unused-vars': 'warn',
    'react-hooks/exhaustive-deps': 'warn'
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