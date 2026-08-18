import { Long, type tl } from '@mtcute/core';
import { INVALID_PARAMS, ProtocolError } from '@modelcontextprotocol/server';

import type { TlArgument, TlCatalogService, TlMethod } from './tl-catalog.service.js';

type JsonObject = Record<string, unknown>;

const primitiveTypes = new Set([
  '#',
  'Bool',
  'bytes',
  'double',
  'int',
  'int53',
  'int128',
  'int256',
  'long',
  'string',
  'true',
]);

export function createTlRequest(catalog: TlCatalogService, method: TlMethod, params: JsonObject): tl.RpcMethod {
  if (method.generics?.length) {
    throw new ProtocolError(INVALID_PARAMS, `Generic method ${method.name} cannot be called through call_method.`);
  }

  return decodeObject(catalog, method.name, method.arguments, params) as unknown as tl.RpcMethod;
}

export function serializeTlValue(value: unknown): unknown {
  if (value === null || typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'bigint' || Long.isLong(value)) {
    return value.toString();
  }

  if (value instanceof Uint8Array) {
    return Buffer.from(value).toString('base64');
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (Array.isArray(value)) {
    return value.map(serializeTlValue);
  }

  if (typeof value === 'object' && value) {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, entry]) => entry !== undefined)
        .map(([key, entry]) => [key, serializeTlValue(entry)]),
    );
  }

  return String(value);
}

function decodeObject(
  catalog: TlCatalogService,
  constructorName: string,
  argumentsSchema: TlArgument[],
  input: JsonObject,
): JsonObject {
  const values = { ...input };

  delete values._;

  const allowedNames = new Set(
    argumentsSchema.filter((argument) => argument.type !== '#').map((argument) => argument.name),
  );
  const unknownNames = Object.keys(values).filter((name) => !allowedNames.has(name));

  if (unknownNames.length) {
    throw new ProtocolError(INVALID_PARAMS, `Unknown parameter(s) for ${constructorName}: ${unknownNames.join(', ')}`);
  }

  const result: JsonObject = { _: constructorName };

  for (const argument of argumentsSchema) {
    if (argument.type === '#') {
      continue;
    }

    const value = values[argument.name];

    if (value === undefined) {
      if (!argument.typeModifiers?.predicate) {
        throw new ProtocolError(INVALID_PARAMS, `Missing required parameter ${constructorName}.${argument.name}`);
      }
      continue;
    }

    result[toCamelCase(argument.name)] = decodeArgument(
      catalog,
      argument,
      value,
      `${constructorName}.${argument.name}`,
    );
  }

  return result;
}

function decodeArgument(catalog: TlCatalogService, argument: TlArgument, value: unknown, path: string): unknown {
  if (argument.typeModifiers?.isVector) {
    if (!Array.isArray(value)) {
      throw new ProtocolError(INVALID_PARAMS, `${path} must be an array.`);
    }

    return value.map((entry, index) => decodeValue(catalog, argument.type, entry, `${path}[${index}]`));
  }

  return decodeValue(catalog, argument.type, value, path);
}

function decodeValue(catalog: TlCatalogService, type: string, value: unknown, path: string): unknown {
  switch (type) {
    case 'int':
      return requireInteger(value, path, -2_147_483_648, 2_147_483_647);
    case 'int53':
      return requireInteger(value, path, Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER);
    case 'long':
      return decodeLong(value, path);
    case 'double':
      if (typeof value !== 'number' || !Number.isFinite(value)) {
        throw new ProtocolError(INVALID_PARAMS, `${path} must be a finite number.`);
      }

      return value;
    case 'string':
      if (typeof value !== 'string') {
        throw new ProtocolError(INVALID_PARAMS, `${path} must be a string.`);
      }

      return value;
    case 'Bool':
      if (typeof value !== 'boolean') {
        throw new ProtocolError(INVALID_PARAMS, `${path} must be a boolean.`);
      }

      return value;
    case 'true':
      if (value !== true) {
        throw new ProtocolError(INVALID_PARAMS, `${path} can only be true when provided.`);
      }

      return true;
    case 'bytes':
      return decodeBytes(value, path);
    case 'int128':
      return decodeBytes(value, path, 16);
    case 'int256':
      return decodeBytes(value, path, 32);
  }

  if (type.startsWith('!')) {
    throw new ProtocolError(INVALID_PARAMS, `${path} uses unsupported generic type ${type}.`);
  }

  if (!isObject(value) || typeof value._ !== 'string') {
    const options = catalog.getConstructors(type).map((constructor) => constructor.name);
    const suffix = options.length ? ` Available constructors: ${options.join(', ')}.` : '';

    throw new ProtocolError(INVALID_PARAMS, `${path} must be a TL object with a "_" constructor.${suffix}`);
  }

  const constructor = catalog.getConstructor(value._);

  if (constructor.type !== type) {
    throw new ProtocolError(
      INVALID_PARAMS,
      `${path} expects ${type}, but ${constructor.name} creates ${constructor.type}.`,
    );
  }

  return decodeObject(catalog, constructor.name, constructor.arguments, value);
}

function requireInteger(value: unknown, path: string, minimum: number, maximum: number): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < minimum || value > maximum) {
    throw new ProtocolError(INVALID_PARAMS, `${path} must be an integer from ${minimum} to ${maximum}.`);
  }

  return value;
}

function decodeLong(value: unknown, path: string): Long {
  if (typeof value === 'number') {
    if (!Number.isSafeInteger(value)) {
      throw new ProtocolError(
        INVALID_PARAMS,
        `${path} must be a decimal string when it exceeds JavaScript's safe integer range.`,
      );
    }

    return Long.fromNumber(value);
  }

  if (typeof value !== 'string' || !/^-?\d+$/.test(value)) {
    throw new ProtocolError(INVALID_PARAMS, `${path} must be a decimal string or a safe integer.`);
  }

  return Long.fromString(value);
}

function decodeBytes(value: unknown, path: string, requiredLength?: number): Uint8Array {
  if (typeof value !== 'string' || !isBase64(value)) {
    throw new ProtocolError(INVALID_PARAMS, `${path} must be a base64 string.`);
  }

  const bytes = Buffer.from(value, 'base64');

  if (requiredLength && bytes.length !== requiredLength) {
    throw new ProtocolError(INVALID_PARAMS, `${path} must contain exactly ${requiredLength} bytes.`);
  }

  return bytes;
}

function isBase64(value: string): boolean {
  return value.length % 4 === 0 && /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(value);
}

function isObject(value: unknown): value is JsonObject & { _: unknown } {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function toCamelCase(value: string): string {
  return value.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase());
}

export function isPrimitiveTlType(type: string): boolean {
  return primitiveTypes.has(type);
}
