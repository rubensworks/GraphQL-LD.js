# GraphQL-LD

[![Build Status](https://travis-ci.org/rubensworks/graphql-ld.js.svg?branch=master)](https://travis-ci.org/rubensworks/graphql-ld.js)
[![Coverage Status](https://coveralls.io/repos/github/rubensworks/graphql-ld.js/badge.svg?branch=master)](https://coveralls.io/github/rubensworks/graphql-ld.js?branch=master)
[![npm version](https://badge.fury.io/js/graphql-ld.svg)](https://www.npmjs.com/package/graphql-ld) [![Greenkeeper badge](https://badges.greenkeeper.io/rubensworks/graphql-ld.js.svg)](https://greenkeeper.io/)

GraphQL-LD allows _Linked Data_ to be queried via _[GraphQL](https://graphql.org/)_ queries and a _[JSON-LD](https://json-ld.org/) context_.

It is a developer-friendly way to query Linked Data and use the results in a straightforward way.

For example, assuming the following SPARQL query:

```sparql
SELECT ?id ?starring WHERE {
  OPTIONAL {
    ?id <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http://dbpedia.org/ontology/Film>;
      <http://dbpedia.org/ontology/starring> ?starring.
    ?starring <http://www.w3.org/2000/01/rdf-schema#label> "Brad Pitt"@en.
  }
}
```

This could be written in a more compact way in GraphQL:

```graphql
{
  id
  ... on Film {
    starring(label: "Brad Pitt")
  }
}
```

And this can be based on the following JSON-LD context:

```json
{
  "@context": {
    "Film": "http://dbpedia.org/ontology/Film",
    "label": { "@id": "http://www.w3.org/2000/01/rdf-schema#label", "@language": "en" },
    "starring": "http://dbpedia.org/ontology/starring"
  }
}
```

## Approach

This library takes a GraphQL-LD query and a JSON-LD context as input,
[converts it to a SPARQL query](https://github.com/rubensworks/graphql-to-sparql.js),
sends the SPARQL query to a SPARQL query engine for execution ([local](https://github.com/rubensworks/graphql-ld-comunica.js) or [endpoint](https://github.com/rubensworks/graphql-ld-sparqlendpoint.js)),
and [converts the SPARQL query results into a tree-based structure](https://github.com/rubensworks/sparqljson-to-tree.js) corresponding to the original GraphQL query.

More information about this approach can be found in our [GraphQL-LD article](https://comunica.github.io/Article-ISWC2018-Demo-GraphQlLD/).

## Install

```bash
$ yarn add graphql-ld
```

This package also works out-of-the-box in browsers via tools such as [webpack](https://webpack.js.org/) and [browserify](http://browserify.org/).

## Require

```javascript
import {Client} from "graphql-ld";
```

_or_

```javascript
var Client = require("graphql-ld").Client;
```

## Usage

### With a client-side query engine

_This requires you to install [graphql-ld-comunica](https://github.com/rubensworks/graphql-ld-comunica.js): `yarn add graphql-ld-comunica`._

_If you want to use this for Solid apps, have a look at [graphql-ld-comunica-solid](https://github.com/rubensworks/GraphQL-LD-Comunica-Solid.js) instead._

```javascript
import {Client} from "graphql-ld";
import {QueryEngineComunica} from "graphql-ld-comunica";

// Define a JSON-LD context
const context = {
  "@context": {
    "label": { "@id": "http://www.w3.org/2000/01/rdf-schema#label" }
  }
};

// Create a GraphQL-LD client based on a client-side Comunica engine over 3 sources
const comunicaConfig = {
  sources: [
    { type: "sparql", value: "http://dbpedia.org/sparql" },
    { type: "file", value: "https://ruben.verborgh.org/profile/" },
    { type: "hypermedia", value: "https://fragments.linkedsoftwaredependencies.org/npm" },
  ],
};
const client = new Client({ context, queryEngine: new QueryEngineComunica(comunicaConfig) });

// Define a query
const query = `
  query @single {
    label
  }`;

// Execute the query
const { data } = await client.query({ query });
```

### With a remote SPARQL endpoint

_This requires you to install [graphql-ld-sparqlendpoint](https://github.com/rubensworks/graphql-ld-sparqlendpoint.js): `yarn add graphql-ld-sparqlendpoint`._

```javascript
import {Client} from "graphql-ld";
import {QueryEngineSparqlEndpoint} from "graphql-ld-sparqlendpoint";

// Define a JSON-LD context
const context = {
  "@context": {
    "label": { "@id": "http://www.w3.org/2000/01/rdf-schema#label" }
  }
};

// Create a GraphQL-LD client based on a SPARQL endpoint
const endpoint = 'http://dbpedia.org/sparql';
const client = new Client({ context, queryEngine: new QueryEngineSparqlEndpoint(endpoint) });

// Define a query
const query = `
  query @single {
    label
  }`;

// Execute the query
const { data } = await client.query({ query });
```

## Examples

Below, you can find a couple examples of GraphQL-LD queries.

If you want more details on what kind of queries you can write,
have a look at the [README of the GraphQL-to-SPARQL repository](https://github.com/rubensworks/graphql-to-sparql.js).

### Finding all available labels

Query:
```graphql
query @single {
  label
}
```

Context:
```json
{
  "@context": {
    "label": { "@id": "http://www.w3.org/2000/01/rdf-schema#label" }
  }
}
```

Output:
```
{
  "data": {
    "label": [
      "amateur victory",
      "amateur year",
      "ambasadóir",
      "ambasciatore",
      "ambassadeur",
      "ambassadeur",
      "ambassador",
      ...
    ]
  }
}
```

### Finding all movies Brad Pitt stars in

Query:
```graphql
{
  id @single
  ... on Film {
    starring(label: "Brad Pitt") @single
  }
}
```

Context:
```json
{
  "@context": {
    "Film": "http://dbpedia.org/ontology/Film",
    "label": { "@id": "http://www.w3.org/2000/01/rdf-schema#label", "@language": "en" },
    "starring": "http://dbpedia.org/ontology/starring"
  }
}
```

Output:
```
{
  "data": [
    {
      "id": "http://dbpedia.org/resource/Ocean's_Eleven",
      "starring": "http://dbpedia.org/resource/Brad_Pitt"
    },
    {
      "id": "http://dbpedia.org/resource/The_Favor",
      "starring": "http://dbpedia.org/resource/Brad_Pitt"
    },
    {
      "id": "http://dbpedia.org/resource/The_Assassination_of_Jesse_James_by_the_Coward_Robert_Ford",
      "starring": "http://dbpedia.org/resource/Brad_Pitt"
    },
    {
      "id": "http://dbpedia.org/resource/True_Romance",
      "starring": "http://dbpedia.org/resource/Brad_Pitt"
    },
    ...
  ]
}
```

### Finding all Belgian software developers

Query:
```graphql
{
  softwareName: label @single
  developer @single(scope: all) {
    label
    country(label_en: "Belgium")
  }
}
```

Context:
```json
{
  "@context": {
    "label": { "@id": "http://www.w3.org/2000/01/rdf-schema#label" },
    "label_en": { "@id": "http://www.w3.org/2000/01/rdf-schema#label", "@language": "en" },
    "developer": { "@id": "http://dbpedia.org/ontology/developer" },
    "country": { "@id": "http://dbpedia.org/ontology/locationCountry" }
  }
}
```

Output:
```
{
  "data": [
    {
      "softwareName": "Divinity: Original Sin II",
      "developer": {
        "label": "Larian Studios",
        "country": "http://dbpedia.org/resource/Belgium"
      }
    },
    {
      "softwareName": "Divinity: Original Sin II",
      "developer": {
        "label": "Larian Studios",
        "country": "http://dbpedia.org/resource/Belgium"
      }
    },
    {
      "softwareName": "BioNumerics",
      "developer": {
        "label": "Applied Maths",
        "country": "http://dbpedia.org/resource/Belgium"
      }
    },
    ...
  ]
}
```

## License
This software is written by [Ruben Taelman](http://rubensworks.net/).

This code is released under the [MIT license](http://opensource.org/licenses/MIT).
