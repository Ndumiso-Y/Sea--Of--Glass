/**
 * get-telegram-chats.ts
 *
 * Calls the Telegram Bot API getUpdates endpoint and lists all groups/chats
 * the bot is currently receiving messages from.
 *
 * Run: npx tsx scripts/get-telegram-chats.ts
 */

import dotenv from 'dotenv';
// Load .env.local first (Vite convention), fall back to .env
dotenv.config({ path: '.env.local' });
dotenv.config();

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

if (!BOT_TOKEN) {
  console.error('❌  TELEGRAM_BOT_TOKEN not found in environment. Add it to .env.local.');
  process.exit(1);
}

interface TelegramChat {
  id: number;
  title?: string;
  username?: string;
  type: string;
}

interface TelegramUpdate {
  update_id: number;
  message?: { chat: TelegramChat };
  channel_post?: { chat: TelegramChat };
  my_chat_member?: { chat: TelegramChat };
}

interface GetUpdatesResponse {
  ok: boolean;
  result: TelegramUpdate[];
  description?: string;
}

async function main() {
  console.log('🤖  Fetching Telegram bot updates…\n');

  const url = `https://api.telegram.org/bot${BOT_TOKEN}/getUpdates?limit=100`;
  const res = await fetch(url);
  const json: GetUpdatesResponse = await res.json();

  if (!json.ok) {
    console.error('❌  Telegram API error:', json.description);
    process.exit(1);
  }

  const updates: TelegramUpdate[] = json.result;
  console.log(`📥  Received ${updates.length} update(s) from Telegram.\n`);

  if (updates.length === 0) {
    console.log('⚠️   No updates found.');
    console.log('     To populate updates, add the bot to each Telegram group and send');
    console.log('     at least one message (e.g. /start or any text) in each group.\n');
    return;
  }

  // Collect unique chats
  const seen = new Map<number, TelegramChat>();

  for (const upd of updates) {
    const chat =
      upd.message?.chat ??
      upd.channel_post?.chat ??
      upd.my_chat_member?.chat;

    if (chat && !seen.has(chat.id)) {
      seen.set(chat.id, chat);
    }
  }

  const chats = [...seen.values()];

  if (chats.length === 0) {
    console.log('⚠️   Updates found but no group/channel chats detected.');
    console.log('     Make sure the bot has been added to groups and messages were sent.\n');
    return;
  }

  console.log('─'.repeat(60));
  console.log(`${'Chat ID'.padEnd(18)} ${'Type'.padEnd(14)} Title`);
  console.log('─'.repeat(60));

  for (const chat of chats) {
    const id   = String(chat.id).padEnd(18);
    const type = (chat.type ?? 'unknown').padEnd(14);
    const title = chat.title ?? chat.username ?? '(no title)';
    console.log(`${id} ${type} ${title}`);
  }

  console.log('─'.repeat(60));
  console.log(`\n✅  ${chats.length} unique chat(s) found.`);
  console.log('\nNext step: use these chat IDs in the Telegram Chat Mapping page');
  console.log('(Settings → Telegram Chats) to assign each group to a department/cell.\n');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
