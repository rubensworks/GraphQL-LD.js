import {Converter as GraphQlToSparqlConverter} from "graphql-to-sparql";
import {ISingularizeVariables} from "graphql-to-sparql/lib/IConvertContext";
import {ExecutionResult} from "graphql/execution/execute";
import {DocumentNode} from "graphql/language";
import {ContextParser, IJsonLdContextNormalized, JsonLdContext} from "jsonld-context-parser";
import * as RDF from "rdf-js";
import {Algebra} from "sparqlalgebrajs";
import {Converter as SparqlJsonToTreeConverter} from "sparqljson-to-tree";
import {IQueryEngine} from "./IQueryEngine";

/**
 * A GraphQL-LD client.
 *
 * Typical usage:
 * ```
 * const client = new Client({ context, queryEngine });
 * const { data } = await client.query({ query: `{ books { name author { name } } }` });
 * ```
 */
export class Client {

  private readonly context: Promise<IJsonLdContextNormalized>;
  private readonly queryEngine: IQueryEngine;
  private readonly graphqlToSparqlConverter: GraphQlToSparqlConverter;
  private readonly sparqlJsonToTreeConverter: SparqlJsonToTreeConverter;

  constructor(args: IClientArgs) {
    this.context = (args.contextParser || new ContextParser()).parse(args.context, { baseIri: args.baseIri });
    this.queryEngine = args.queryEngine;

    this.graphqlToSparqlConverter = args.graphqlToSparqlConverter ||
      new GraphQlToSparqlConverter({ dataFactory: args.dataFactory, requireContext: true });
    this.sparqlJsonToTreeConverter = args.sparqlJsonToTreeConverter ||
      new SparqlJsonToTreeConverter({ dataFactory: args.dataFactory, materializeRdfJsTerms: true });
  }

  /**
   * Execute a GraphQL-LD query.
   *
   * There are three ways of invoking this methods:
   * 1. with a GraphQL query string and optional variables:
   *    `client.query({ query: `{...}`, variables: { varName: 123 } })`
   * 2. with a parsed GraphQL query and optional variables:
   *    `client.query({ query: gql`{...}`, variables: { varName: 123 } })`
   * 3. with a SPARQL algebra object and a singularizeVariables object
   *    `client.query({ sparqlAlgebra, singularizeVariables })`
   *    This corresponds to the result of {@link Client#graphQlToSparql}.
   *
   * @param {QueryArgs} args Query+variables, or SPARQL algebra+singularize variables.
   * @return {Promise<ExecutionResult>} A promise resolving to a GraphQL result.
   */
  public async query(args: QueryArgs): Promise<ExecutionResult> {
    // Convert GraphQL to SPARQL
    const { sparqlAlgebra, singularizeVariables } = 'query' in args
      ? await this.graphQlToSparql({ query: args.query, variables: args.variables }) : args;

    // Execute SPARQL query
    const sparqlJsonResult = await this.queryEngine.query(sparqlAlgebra, args.queryEngineOptions);

    // Convert SPARQL response to GraphQL response
    const data = this.sparqlJsonToTreeConverter.sparqlJsonResultsToTree(sparqlJsonResult, { singularizeVariables });
    return { data };
  }

  /**
   * Convert a GraphQL query to SPARQL algebra and a singularize variables object.
   * @param {string | DocumentNode} query
   * @param {{[p: string]: any}} variables
   * @return {Promise<IGraphQlToSparqlResult>}
   */
  public async graphQlToSparql({ query, variables }: IQueryArgsRaw): Promise<IGraphQlToSparqlResult> {
    const singularizeVariables = {};
    const options = {
      singularizeVariables,
      variablesDict: {}, // TODO: convert variables values to ValueNode's
    };

    const sparqlAlgebra = await this.graphqlToSparqlConverter
      .graphqlToSparqlAlgebra(query, await this.context, options);
    return { sparqlAlgebra, singularizeVariables };
  }

}

export interface IClientArgs {
  /**
   * A JSON-LD context.
   * This may be an object, array, or a string (URL to remote context)
   */
  context: JsonLdContext;
  /**
   * A query engine that will be used to execute SPARQL queries.
   */
  queryEngine: IQueryEngine;

  /**
   * An optional base IRI.
   */
  baseIri?: string;
  /**
   * An optional data factory for RDF quads and terms.
   */
  dataFactory?: RDF.DataFactory;

  /**
   * An optional JSON-LD context parser.
   * Provide this to override the default context parser options.
   */
  contextParser?: ContextParser;
  /**
   * An optional GraphQL to SPARQL converter.
   * Provide this to override the default converter options.
   */
  graphqlToSparqlConverter?: GraphQlToSparqlConverter;
  /**
   * An optional SPARQL-JSON to GraphQL tree converter.
   * Provide this to override the default converter options.
   */
  sparqlJsonToTreeConverter?: SparqlJsonToTreeConverter;
}

export type QueryArgs = IQueryArgsRaw | IQueryArgsSparql;

export interface IQueryArgsRaw {
  query: string | DocumentNode;
  variables?: { [key: string]: any };
  queryEngineOptions?: any;
}

export interface IQueryArgsSparql extends IGraphQlToSparqlResult {
  queryEngineOptions?: any;
}

export interface IGraphQlToSparqlResult {
  sparqlAlgebra: Algebra.Operation;
  singularizeVariables: ISingularizeVariables;
}
