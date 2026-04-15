import type { Algebra } from 'sparqlalgebrajs';
import type { IQueryEngine } from '../lib/IQueryEngine';

export class QueryEngineMock implements IQueryEngine {
  private readonly bindings: any[];

  public constructor(bindings: any[]) {
    this.bindings = bindings;
  }

  public async query(query: Algebra.Operation, options?: unknown): Promise<unknown> {
    void query;
    void options;
    return { results: { bindings: this.bindings }};
  }
}
