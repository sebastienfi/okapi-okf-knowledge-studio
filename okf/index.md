okf_version: "0.1"

# Overview

* [Okapi - an OKF Knowledge Studio](overview.md) - What Okapi is, the three packages it is built from, and how a bundle flows from disk to an interactive graph.

# Subdirectories

* [architecture](architecture/index.md) - The three packages: the pure parser core, the CLI + server, and the web app.
* [pipeline](pipeline/index.md) - The six parsing stages that turn a directory of markdown into the document graph.
* [api](api/index.md) - The HTTP surface: the endpoint table, the conflict-safe save protocol, and the live-reload event stream.
* [web](web/index.md) - The five web features: graph canvas, detail panel, editor, insights, and Ask.
* [playbooks](playbooks/index.md) - How to run the dev loop, lint a bundle, and cut a release.
* [decisions](decisions/index.md) - The design decisions that shape the parser and the graph.
