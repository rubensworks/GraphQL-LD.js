import {parse} from "graphql";
import {Algebra} from "sparqlalgebrajs";
import Factory from "sparqlalgebrajs/lib/factory";
import {Client} from "../lib/Client";
import {IQueryEngine} from "../lib/IQueryEngine";
import {QueryEngineMock} from "../mocks/QueryEngineMock";

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
      { books_name: { type: 'literal', value: 'Book 1' }, books_author_name: { type: 'literal', value: 'Person 1' } },
      { books_name: { type: 'literal', value: 'Book 2' }, books_author_name: { type: 'literal', value: 'Person 2' } },
      { books_name: { type: 'literal', value: 'Book 3' }, books_author_name: { type: 'literal', value: 'Person 3' } },
    ]);
    jest.spyOn(queryEngine, 'query');
    client = new Client({ context, queryEngine });

    sparqlAlgebra = new Factory().createProject(null, []);
  });

  describe('query', () => {
    it('should query for a string query', async () => {
      expect(await client.query({ query: `{ books { name author { name } } }` })).toEqual({
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

    it('should query for a parsed query', async () => {
      expect(await client.query({ query: parse(`{ books { name author { name } } }`) })).toEqual({
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

    it('should query for sparql algebra', async () => {
      expect(await client.query({ sparqlAlgebra, singularizeVariables: {} })).toEqual({
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

    it('should propagate singularization data for a string query', async () => {
      expect(await client.query({ query: `query @single(scope: all) { books { name author { name } } }` })).toEqual({
        data: { books: { author: { name: 'Person 1' }, name: 'Book 1' } },
      });
    });

    it('should propagate singularization data for a parsed query', async () => {
      expect(await client.query({ query: parse(`query @single(scope: all) { books { name author { name } } }`) }))
        .toEqual({ data: { books: { author: { name: 'Person 1' }, name: 'Book 1' } } });
    });

    it('should propagate singularization data for sparql algebra', async () => {
      const singularizeVariables = {
        '': true, 'books': true, 'books_author': true, 'books_author_name': true, 'books_name': true };
      expect(await client.query({ sparqlAlgebra, singularizeVariables }))
        .toEqual({ data: { books: { author: { name: 'Person 1' }, name: 'Book 1' } } });
    });

    it('should propagate query engine options', async () => {
      const queryEngineOptions = {};
      const singularizeVariables = {};
      await client.query({ sparqlAlgebra, singularizeVariables, queryEngineOptions });
      expect(queryEngine.query).toHaveBeenCalledWith(sparqlAlgebra, queryEngineOptions);
    });
  });
});
