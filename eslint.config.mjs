import withNuxt from './.nuxt/eslint.config.mjs'
export default withNuxt({
  rules: {
    'vue/multi-word-component-names': 'off',
    'vue/max-attributes-per-line': 'off',
    'vue/html-self-closing': 'off',
    'vue/singleline-html-element-content-newline': 'off',
    'vue/html-indent': 'off',
    'vue/html-closing-bracket-newline': 'off',
    'vue/first-attribute-linebreak': 'off'
  },
  ignores: ['.output/**', 'node_modules/**', '.nuxt/**', 'test-results/**']
})
