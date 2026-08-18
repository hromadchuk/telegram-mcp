import { Module } from '@nestjs/common';
import { DiscoveryModule } from '@nestjs/core';

import { AuthModule } from '../auth/auth.module.js';
import { McpController } from './mcp.controller.js';
import { McpService } from './mcp.service.js';
import { McpToolRegistry } from './mcp-tool.registry.js';
import { GetMeTool } from './tools/account/get-me.tool.js';
import { GetChatTool } from './tools/chats/get-chat.tool.js';
import { GetContactsTool } from './tools/contacts/get-contacts.tool.js';
import { GetDialogsTool } from './tools/dialogs/get-dialogs.tool.js';
import { SearchChatsTool } from './tools/dialogs/search-chats.tool.js';
import { DownloadMediaTool } from './tools/media/download-media.tool.js';
import { SendAlbumTool } from './tools/media/send-album.tool.js';
import { SendFileTool } from './tools/media/send-file.tool.js';
import { SendPhotoTool } from './tools/media/send-photo.tool.js';
import { DeleteMessagesTool } from './tools/messages/delete-messages.tool.js';
import { EditMessageTool } from './tools/messages/edit-message.tool.js';
import { GetHistoryTool } from './tools/messages/get-history.tool.js';
import { GetMessagesTool } from './tools/messages/get-messages.tool.js';
import { MarkAsReadTool } from './tools/messages/mark-as-read.tool.js';
import { SearchMessagesTool } from './tools/messages/search-messages.tool.js';
import { SendMessageTool } from './tools/messages/send-message.tool.js';
import { CallMethodTool } from './tools/raw/call-method.tool.js';
import { GetMethodSchemaTool } from './tools/raw/get-method-schema.tool.js';
import { SearchMethodsTool } from './tools/raw/search-methods.tool.js';
import { TlCatalogService } from './tools/raw/tl-catalog.service.js';
import { ServerInfoTool } from './tools/system/server-info.tool.js';

@Module({
  imports: [AuthModule, DiscoveryModule],
  controllers: [McpController],
  providers: [
    McpService,
    McpToolRegistry,
    TlCatalogService,
    GetMeTool,
    GetChatTool,
    GetContactsTool,
    GetDialogsTool,
    SearchChatsTool,
    DownloadMediaTool,
    SendAlbumTool,
    SendFileTool,
    SendPhotoTool,
    DeleteMessagesTool,
    EditMessageTool,
    GetHistoryTool,
    GetMessagesTool,
    MarkAsReadTool,
    SearchMessagesTool,
    SendMessageTool,
    CallMethodTool,
    GetMethodSchemaTool,
    SearchMethodsTool,
    ServerInfoTool,
  ],
})
export class McpModule {}
