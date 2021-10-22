# PoppyHTML

[![NPM Version](https://img.shields.io/npm/v/poppyhtml?color=blue)](https://www.npmjs.com/package/poppyhtml)
[![NPM Minified Size](https://img.shields.io/bundlephobia/min/poppyhtml)](https://bundlephobia.com/package/poppyhtml@latest)
[![License: MIT](https://img.shields.io/badge/license-MIT-brightgreen)](./LICENSE)

_❗️ Warning: This is not production ready software and is in very active development. ❗️_

## What is PoppyHTML?

PoppyHTML is a small frontend compiler that enables developers to write vanilla HTML, CSS, and JavaScript with similar ergonomics and composability to a modern frontend framework.

The syntax and functionality of PoppyHTML is intentionally small and concise. It operates within the confines of standard HTML syntax and simply seeks to enable some of the hallmarks of modern frontend frameworks like a familiar component format, basic data passing via component props, an intuitive templating syntax, very basic component-scoped CSS and JavaScript, and a few more things.

PoppyHTML is best used for building small (mostly) static websites. You won't find any fancy diffing algorithms, virtual doms, reactive data, stateful components, or declarative syntax here––it's just plain old imperative vanilla HTML, CSS, and JavaScript that can be organized and structured in a way that is far more composable and easy to reason about.

## Getting Started

To quickly get up and running you can install the [project template](https://github.com/hawkticehurst/poppyhtml-template) to scaffold out a new project.

```
npx degit hawkticehurst/poppyhtml-template {your-project-name}
cd {your-project-name}
npm install
npm start
```

## Documentation

Read a [high level overview](./docs/overview.md) of the current syntax and functionality available in PoppyHTML.

## License

[MIT](LICENSE)
