import antfu from '@antfu/eslint-config'
import { FlatCompat } from '@eslint/eslintrc'
import perfectionist from 'eslint-config-perfectionist'

const compat = new FlatCompat()

export default antfu({
  rules: {
    'import/order': 'off',
    'tailwindcss/migration-from-tailwind-2': 'off',
    'tailwindcss/no-custom-classname': 'off',
  },
}, ...compat.config({
  extends: [
    'plugin:tailwindcss/recommended',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: [
    'src/components/ui/*',
    'src/lib/utils.ts',
    'tailwind.config.js',
  ],
}),
  // perfectionist
  {
    rules: {
      'import/order': 'off',
      ...perfectionist.configs['recommended-natural'].rules,
    },
  }, 
)
