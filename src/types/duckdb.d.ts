declare module "duckdb" {
  export class Database {
    constructor(path?: string);

    all(sql: string, callback: (err: Error | null, rows: any[]) => void): void;
    all(
      sql: string,
      params: any[],
      callback: (err: Error | null, rows: any[]) => void
    ): void;

    get(sql: string, callback: (err: Error | null, row: any) => void): void;
    get(
      sql: string,
      params: any[],
      callback: (err: Error | null, row: any) => void
    ): void;

    run(sql: string, callback: (err: Error | null) => void): void;
    run(
      sql: string,
      params: any[],
      callback: (err: Error | null) => void
    ): void;

    close(): void;
  }
}
