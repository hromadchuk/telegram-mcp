import { Module } from '@nestjs/common';
import { DiscoveryModule } from '@nestjs/core';

import { AuthModule } from '../auth/auth.module.js';
import { McpController } from './mcp.controller.js';
import { McpService } from './mcp.service.js';
import { McpToolRegistry } from './mcp-tool.registry.js';
import { GetMeTool } from './tools/account/get-me.tool.js';
import { GetContactsTool } from './tools/contacts/get-contacts.tool.js';
import { ServerInfoTool } from './tools/system/server-info.tool.js';

@Module({
  imports: [AuthModule, DiscoveryModule],
  controllers: [McpController],
  providers: [McpService, McpToolRegistry, GetMeTool, GetContactsTool, ServerInfoTool],
})
export class McpModule {}
