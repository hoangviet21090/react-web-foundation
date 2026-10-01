const message =
  'Use app/routing/routes.ts or an injected destination; do not hardcode browser routes.';
const contexts = [
  'JSXAttribute[name.name=/^(to|href)$/]',
  'CallExpression[callee.name=/^(navigate|redirect|replace)$/]',
  'CallExpression[callee.property.name=/^(navigate|assign|replace)$/]',
  'Property[key.name=/^(path|pathname|to)$/]',
];
export const navigationConventions = {
  rules: {
    'no-restricted-syntax': [
      'error',
      ...contexts.flatMap((context) => [
        { selector: context + ' Literal[value=/^[/]/]', message },
        { selector: context + ' TemplateElement[value.raw=/^[/]/]', message },
      ]),
    ],
  },
};
