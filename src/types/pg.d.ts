declare module 'pg' {
  export class Client {
    constructor(opts?: any);
    connect(): Promise<void>;
    query(sql: string, params?: any[]): Promise<any>;
    end(): Promise<void>;
  }
}
