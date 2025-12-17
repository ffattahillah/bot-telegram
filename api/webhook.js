// ================== MEMORY MAP ==================
// Menyimpan: message_id (OWNER) -> chat_id (USER)
const messageMap = new Map();

export default async function handler(req, res) {
  // Telegram hanya kirim POST
  if (req.method !== "POST") {
    return res.status(200).send("OK");
  }

  const update = req.body;
  const msg = update.message;
  if (!msg) return res.status(200).send("OK");

  const chatId = msg.chat.id;
  const text = msg.text || "";

  const TOKEN = process.env.BOT_TOKEN;
  const OWNER = process.env.OWNER_CHAT_ID;
  const API = `https://api.telegram.org/bot${TOKEN}`;

  // ================== HELPER ==================
  async function sendMessage(chat_id, text) {
    const r = await fetch(`${API}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id, text })
    });
    return r.json();
  }

  // ================== USER → OWNER ==================
  // Jika pesan dari USER (bukan OWNER)
  if (String(chatId) !== String(OWNER)) {
    const sent = await sendMessage(
      OWNER,
      `📩 Pesan masuk\nDari user:\n${chatId}\n\n${text}`
    );

    // Simpan mapping agar bisa reply dengan stabil
    if (sent?.result?.message_id) {
      messageMap.set(sent.result.message_id, chatId);
    }

    return res.status(200).send("OK");
  }

  // ================== OWNER → USER (REPLY) ==================
  // OWNER HARUS reply pesan
  if (String(chatId) === String(OWNER) && msg.reply_to_message) {
    const repliedMsgId = msg.reply_to_message.message_id;
    const targetUser = messageMap.get(repliedMsgId);

    if (!targetUser) {
      await sendMessage(
        OWNER,
        "⚠️ Tidak bisa menemukan user tujuan.\nPesan terlalu lama atau bot baru restart."
      );
      return res.status(200).send("OK");
    }

    await sendMessage(targetUser, text);
    return res.status(200).send("OK");
  }

  // ================== OWNER TANPA REPLY ==================
  if (String(chatId) === String(OWNER) && !msg.reply_to_message) {
    await sendMessage(
      OWNER,
      "ℹ️ Balas pesan user dengan fitur Reply agar bot tahu tujuan."
    );
    return res.status(200).send("OK");
  }

  return res.status(200).send("OK");
}