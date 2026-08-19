<p align="center">
  <img src="frontend/src/assets/logos/telegram-mcp.svg" width="72" alt="Telegram MCP logo" />
</p>

# Telegram MCP

Use Telegram from your AI assistant.

Telegram MCP connects your personal Telegram account to any AI client that supports the [Model Context Protocol](https://modelcontextprotocol.io/), such as Codex or Claude. Once connected, your assistant can search chats, read and send messages, work with files and media, and more.

## What it can do

- Browse chats, contacts, and message history
- Search, send, edit, and delete messages
- Send photos, files, and albums
- Download media
- Check Telegram Stars and gifts
- Call almost any Telegram API method directly — not just the built-in tools

## Connect your AI client

Add your server URL as a remote MCP server:

```text
https://telegram-mcp.hro.sh/mcp
```

The client will open a Telegram sign-in page. Enter your `api_id` and `api_hash`, then scan the QR code with the Telegram mobile app and finish the connection. If you use Codex, you can simply ask:

```text
Add this remote MCP server: https://telegram-mcp.hro.sh/mcp
```

## Run it locally

```bash
corepack enable
yarn install --immutable
cp .env.example .env
```

Add these values to `.env`:

```dotenv
TOKEN_SECRET=<a random base64url 32-byte key>
MCP_URL=http://127.0.0.1:3000/mcp
```

Then start the app:

```bash
yarn dev
```

The web app runs at `http://127.0.0.1:5173`; the MCP server runs at `http://127.0.0.1:3000/mcp`.

## Deploy

The project is ready for Vercel. Set these environment variables in Vercel, then deploy:

```text
TOKEN_SECRET=<a random base64url 32-byte key>
MCP_URL=https://your-domain.example/mcp
```

## Useful commands

```bash
yarn dev        # Start development servers
yarn build      # Build for production
yarn typecheck  # Check TypeScript
yarn lint       # Run ESLint
```

## Security

Use your own Telegram API credentials. Keep your `.env`, `TOKEN_SECRET`, API Hash, and OAuth links private.

To help keep your account safe, we do not allow the following methods:

- All `auth.*` methods
- `account.changePhone`
- `account.deleteAccount`
- `account.resetAuthorization`
- `account.resetWebAuthorization`
- `account.resetWebAuthorizations`
- `account.updatePasswordSettings`
