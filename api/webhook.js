import fetch from "node-fetch";

const TOKEN = process.env.BOT_TOKEN;
const OWNER = process.env.OWNER_CHAT_ID;
const API = `https://api.telegram.org/bot${TOKEN}`;

async function sendMessage(chatId, text) {
  await fetch(`${API}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text
    })
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(200).send("OK");

  const msg = req.body.message;
  if (!msg || !msg.text) return res.status(200).send("OK");

  const chatId = msg.chat.id;
  const text = msg.text;

  // ================= USER → OWNER =================
  if (String(chatId) !== OWNER) {
    await sendMessage(
      OWNER,
      `📩 Pesan masuk\n🆔 ID: ${chatId}\n\n💬 ${text}`
    );
    return res.status(200).send("OK");
  }

  // ================= OWNER → USER (REPLY) =================
  if (msg.reply_to_message) {
    const replied = msg.reply_to_message.text || "";
    const match = replied.match(/ID: (\d+)/);

    if (match) {
      const userId = match[1];
      await sendMessage(userId, text);
    }
  }

  return res.status(200).send("OK");
}