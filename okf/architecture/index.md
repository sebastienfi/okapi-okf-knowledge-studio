# Package

* [@okapi/core](core.md) - The pure OKF parser: walks a bundle, parses frontmatter and links, and assembles the document graph. No HTTP, no side effects.
* [okapi-okf CLI](cli.md) - The published npm package: a Hono server holding the parsed bundle in memory, plus the `okapi` and `okapi lint` commands.
* [Web app](web.md) - The React + Vite SPA: graph canvas, detail panel, editor, insights, and Ask. Built assets ship inside the CLI package.
