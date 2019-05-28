import {Algebra} from "sparqlalgebrajs";

/**
 * A query engine that takes SPARQL algebra, and outputs SPARQL JSON.
 */
export interface IQueryEngine {
  /**
   * Execute SPARQL algebra against a query engine.
   * @param {Operation} query A SPARQL query in SPARQL algebra.
   * @param options Optional options for the query engine.
   * @return {Promise<any>} Promise resolving to SPARQL JSON.
   */
  query(query: Algebra.Operation, options?: any): Promise<any>;
}
