import { isCallToolResult, type JSONRPCMessage, type JSONRPCRequest, type RequestId } from '@modelcontextprotocol/server';
import type { NodeStreamableHTTPServerTransport } from '@modelcontextprotocol/node';

import { isDev } from '../common/utils.js';

interface RequestLog {
  label: string;
  startedAt: number;
}

export function devLogging(transport: NodeStreamableHTTPServerTransport): void {
  if (!isDev) {
    return;
  }

  const requests = new Map<RequestId, RequestLog>();
  const handleMessage = transport.onmessage;
  const send = transport.send.bind(transport);

  transport.onmessage = (message, extra) => {
    if ('method' in message && 'id' in message && message.id !== undefined) {
      const label = getRequestLabel(message);

      requests.set(message.id, { label, startedAt: Date.now() });
      console.log(`[MCP] → ${label}`);
    }

    handleMessage?.(message, extra);
  };

  transport.send = async (message, options) => {
    if ('id' in message && message.id !== undefined) {
      const request = requests.get(message.id);

      if (request) {
        const duration = Date.now() - request.startedAt;
        const error = getResponseError(message);
        const summary = `${request.label} · ${duration}ms`;

        console.log(`[MCP] ← ${summary}${error ? ` · ${error}` : ''}`);
        requests.delete(message.id);
      }
    }

    await send(message, options);
  };
}

function getRequestLabel(message: JSONRPCRequest): string {
  if (message.method === 'tools/call' && message.params && typeof message.params.name === 'string') {
    return message.params.name;
  }

  if (message.method === 'tools/list') {
    return 'list tools';
  }

  return message.method;
}

function getResponseError(message: JSONRPCMessage): string | undefined {
  if ('error' in message) {
    return `${message.error.code}: ${message.error.message}`;
  }

  if ('result' in message && isCallToolResult(message.result) && message.result.isError) {
    return message.result.content.find((item) => item.type === 'text')?.text ?? 'Tool failed';
  }

  return undefined;
}
