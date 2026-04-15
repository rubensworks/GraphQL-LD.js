import { parse } from 'graphql';
import { Converter as GraphQlToSparqlConverter } from 'graphql-to-sparql';
import { ContextParser } from 'jsonld-context-parser';
import type { Algebra } from 'sparqlalgebrajs';
import Factory from 'sparqlalgebrajs/lib/factory';
import { Converter as SparqlJsonToTreeConverter } from 'sparqljson-to-tree';
import { Client } from '../lib/Client';
import type { IQueryEngine } from '../lib/IQueryEngine';
import { QueryEngineMock } from '../mocks/QueryEngineMock';

describe('Client', () => {
  let client: Client;
  let sparqlAlgebra: Algebra.Operation;
  let queryEngine: IQueryEngine;

  beforeEach(() => {
    const context = {
      '@context': {
        author: 'ex:author',
        books: 'ex:books',
        ex: 'http://example.org/',
        name: 'ex:name',
      },
    };
    queryEngine = new QueryEngineMock([
      { books_name: { type: 'literal', value: 'Book 1' }, books_author_name: { type: 'literal', value: 'Person 1' }},
      { books_name: { type: 'literal', value: 'Book 2' }, books_author_name: { type: 'literal', value: 'Person 2' }},
      { books_name: { type: 'literal', value: 'Book 3' }, books_author_name: { type: 'literal', value: 'Person 3' }},
    ]);
    jest.spyOn(queryEngine, 'query');
    client = new Client({ context, queryEngine });

    sparqlAlgebra = new Factory().createProject(<any> null, []);
  });

  describe('query', () => {
    it('should query for a string query', async() => {
      await expect(client.query({ query: `{ books { name author { name } } }` })).resolves.toEqual({
        data: [
          {
            books: [
              {
                author: [
                  {
                    name: [
                      'Person 1',
                      'Person 2',
                      'Person 3',
                    ],
                  },
                ],
                name: [
                  'Book 1',
                  'Book 2',
                  'Book 3',
                ],
              },
            ],
          },
        ],
      });
    });

    it('should query for a parsed query', async() => {
      await expect(client.query({ query: parse(`{ books { name author { name } } }`) })).resolves.toEqual({
        data: [
          {
            books: [
              {
                author: [
                  {
                    name: [
                      'Person 1',
                      'Person 2',
                      'Person 3',
                    ],
                  },
                ],
                name: [
                  'Book 1',
                  'Book 2',
                  'Book 3',
                ],
              },
            ],
          },
        ],
      });
    });

    it('should query for sparql algebra', async() => {
      await expect(client.query({ sparqlAlgebra, singularizeVariables: {}})).resolves.toEqual({
        data: [
          {
            books: [
              {
                author: [
                  {
                    name: [
                      'Person 1',
                      'Person 2',
                      'Person 3',
                    ],
                  },
                ],
                name: [
                  'Book 1',
                  'Book 2',
                  'Book 3',
                ],
              },
            ],
          },
        ],
      });
      expect(queryEngine.query).toHaveBeenCalledWith(sparqlAlgebra, undefined);
    });

    it('should propagate singularization data for a string query', async() => {
      await expect(client.query({ query: `query @single(scope: all) { books { name author { name } } }` })).resolves.toEqual({
        data: { books: { author: { name: 'Person 1' }, name: 'Book 1' }},
      });
    });

    it('should propagate singularization data for a parsed query', async() => {
      await expect(client.query({ query: parse(`query @single(scope: all) { books { name author { name } } }`) })).resolves
        .toEqual({ data: { books: { author: { name: 'Person 1' }, name: 'Book 1' }}});
    });

    it('should propagate singularization data for sparql algebra', async() => {
      const singularizeVariables = {
        '': true,
        books: true,
        books_author: true,
        books_author_name: true,
        books_name: true,
      };
      await expect(client.query({ sparqlAlgebra, singularizeVariables })).resolves
        .toEqual({ data: { books: { author: { name: 'Person 1' }, name: 'Book 1' }}});
    });

    it('should propagate query engine options', async() => {
      const queryEngineOptions = {};
      const singularizeVariables = {};
      await client.query({ sparqlAlgebra, singularizeVariables, queryEngineOptions });
      expect(queryEngine.query).toHaveBeenCalledWith(sparqlAlgebra, queryEngineOptions);
    });

    it('should accept a custom contextParser', async() => {
      const contextParser = new ContextParser();
      const customClient = new Client({ context: { '@context': { author: 'ex:author', ex: 'http://example.org/' }}, queryEngine, contextParser });
      await expect(customClient.query({ query: `{ author }` })).resolves.toBeDefined();
    });

    it('should accept a custom graphqlToSparqlConverter', async() => {
      const graphqlToSparqlConverter = new GraphQlToSparqlConverter({ requireContext: true });
      const customClient = new Client({ context: { '@context': { author: 'ex:author', ex: 'http://example.org/' }}, queryEngine, graphqlToSparqlConverter });
      await expect(customClient.query({ query: `{ author }` })).resolves.toBeDefined();
    });

    it('should accept a custom sparqlJsonToTreeConverter', async() => {
      const sparqlJsonToTreeConverter = new SparqlJsonToTreeConverter({ materializeRdfJsTerms: true });
      const customClient = new Client({ context: { '@context': { author: 'ex:author', ex: 'http://example.org/' }}, queryEngine, sparqlJsonToTreeConverter });
      await expect(customClient.query({ query: `{ author }` })).resolves.toBeDefined();
    });
  });
});
