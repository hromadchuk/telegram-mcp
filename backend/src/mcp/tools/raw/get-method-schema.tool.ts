import { Injectable } from '@nestjs/common';
import type { CallToolResult } from '@modelcontextprotocol/server';
import { z } from 'zod';

import { McpTool, type McpToolHandler } from '../../decorators/mcp-tool.decorator.js';
import { jsonResult } from '../../tool-result.js';
import { getBlockedMethodReason } from './blocked-methods.js';
import { type TlArgument, TlCatalogService, type TlConstructor } from './tl-catalog.service.js';
import { isPrimitiveTlType } from './tl.utils.js';

const inputSchema = z.object({
  method: z.string().trim().min(1).describe('Exact method name returned by search_methods.'),
});

@McpTool({
  name: 'get_method_schema',
  title: 'Get method schema',
  description:
    'Returns the parameters, supported TL constructors, return type, errors, and availability for one raw API method.',
  inputSchema,
  annotations: {
    readOnlyHint: true,
  },
})
@Injectable()
export class GetMethodSchemaTool implements McpToolHandler {
  public constructor(private readonly catalog: TlCatalogService) {}

  public execute(input: unknown): CallToolResult {
    const { method: methodName } = inputSchema.parse(input);
    const method = this.catalog.getMethod(methodName);
    const blockedReason = getBlockedMethodReason(method.name);

    return jsonResult({
      layer: this.catalog.layer,
      method: {
        name: method.name,
        description: method.comment ?? null,
        returnType: method.type,
        available: method.available ?? null,
        callable: !blockedReason && !method.generics?.length,
        blockedReason:
          blockedReason ?? (method.generics?.length ? 'Generic protocol wrapper methods are not supported.' : null),
        arguments: method.arguments
          .filter((argument) => argument.type !== '#')
          .map((argument) => this.describeArgument(argument)),
        errors: method.throws ?? [],
      },
    });
  }

  private describeArgument(argument: TlArgument): Record<string, unknown> {
    return {
      name: argument.name,
      type: argument.typeModifiers?.isVector ? `Vector<${argument.type}>` : argument.type,
      required: !argument.typeModifiers?.predicate,
      description: argument.comment ?? null,
      constructors: isPrimitiveTlType(argument.type)
        ? []
        : this.catalog.getConstructors(argument.type).map((constructor) => this.describeConstructor(constructor)),
    };
  }

  private describeConstructor(constructor: TlConstructor): Record<string, unknown> {
    return {
      name: constructor.name,
      description: constructor.comment ?? null,
      arguments: constructor.arguments
        .filter((argument) => argument.type !== '#')
        .map((argument) => ({
          name: argument.name,
          type: argument.typeModifiers?.isVector ? `Vector<${argument.type}>` : argument.type,
          required: !argument.typeModifiers?.predicate,
          description: argument.comment ?? null,
        })),
    };
  }
}
