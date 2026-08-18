import apiSchema from '@mtcute/core/tl/api-schema.json' with { type: 'json' };
import { Injectable } from '@nestjs/common';

export interface TlArgument {
  name: string;
  type: string;
  comment?: string;
  typeModifiers?: {
    predicate?: string;
    isVector?: boolean;
  };
}

export interface TlMethod {
  kind: 'method';
  name: string;
  type: string;
  comment?: string;
  arguments: TlArgument[];
  throws?: Array<{ name: string; code: number; comment?: string }>;
  generics?: string[];
  available?: string;
}

export interface TlConstructor {
  kind: 'class';
  name: string;
  type: string;
  comment?: string;
  arguments: TlArgument[];
}

interface TlSchema {
  l: number;
  e: Array<TlMethod | TlConstructor>;
}

export interface TlMethodSummary {
  name: string;
  description: string | null;
  returnType: string;
}

const schema = apiSchema as unknown as TlSchema;

@Injectable()
export class TlCatalogService {
  private readonly methods = schema.e.filter((entry): entry is TlMethod => entry.kind === 'method');
  private readonly constructors = schema.e.filter((entry): entry is TlConstructor => entry.kind === 'class');
  private readonly methodsByName = new Map(this.methods.map((method) => [method.name, method]));
  private readonly constructorsByName = new Map(
    this.constructors.map((constructor) => [constructor.name, constructor]),
  );
  private readonly constructorsByType = this.constructors.reduce((index, constructor) => {
    const entries = index.get(constructor.type) ?? [];
    entries.push(constructor);
    index.set(constructor.type, entries);
    return index;
  }, new Map<string, TlConstructor[]>());

  public get layer(): number {
    return schema.l;
  }

  public getMethod(name: string): TlMethod {
    const method = this.methodsByName.get(name);

    if (!method) {
      throw new Error(`Unknown Telegram API method: ${name}`);
    }

    return method;
  }

  public getConstructor(name: string): TlConstructor {
    const constructor = this.constructorsByName.get(name);

    if (!constructor) {
      throw new Error(`Unknown Telegram API constructor: ${name}`);
    }

    return constructor;
  }

  public getConstructors(type: string): TlConstructor[] {
    return this.constructorsByType.get(type) ?? [];
  }

  public search(query: string): TlMethodSummary[] {
    const normalizedQuery = this.normalize(query);

    return this.methods
      .filter((method) => {
        return (
          this.normalize(method.name).includes(normalizedQuery) ||
          this.normalize(method.comment ?? '').includes(normalizedQuery)
        );
      })
      .sort((left, right) => this.score(left, normalizedQuery) - this.score(right, normalizedQuery))
      .map((method) => ({
        name: method.name,
        description: method.comment ?? null,
        returnType: method.type,
      }));
  }

  private score(method: TlMethod, query: string): number {
    const name = this.normalize(method.name);

    if (name === query) return 0;
    if (name.endsWith(query)) return 1;
    if (name.includes(query)) return 2;
    return 3;
  }

  private normalize(value: string): string {
    return value.toLowerCase().replace(/[^a-z0-9]+/g, '');
  }
}
