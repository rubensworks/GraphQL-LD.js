import {Algebra} from "sparqlalgebrajs";
import {IQueryEngine} from "../lib/IQueryEngine";

export class QueryEngineMock implements IQueryEngine {

  private readonly bindings: any[];

  constructor(bindings: any[]) {
    this.bindings = bindings;
  }

  public async query(query: Algebra.Operation, options?: any): Promise<any> {
    return { results: { bindings: this.bindings } };
  }

}
