Package.describe({
  name: 'nicktomlin:braintree-example',
  summary: 'A sample integration with Braintree',
  version: '1.0.0',
  git: '/* todo */'
});

Package.onUse(function(api) {
  api.versionsFrom('1.0');
  api.addFiles('index.js', 'server');
  api.addFiles('.npm/package/node_modules/braintree-web/dist/braintree.js', 'client');
});

Npm.depends({'braintree-web': '2.7.1'});
