import axios from "axios";
import nodemailer from "nodemailer";

// 🔐 ENV VARIABLES (from GitHub secrets)
const EMAIL = process.env.EMAIL;
const APP_PASSWORD = process.env.APP_PASSWORD;
const ACCESS_TOKEN = process.env.UPSTOX_TOKEN;

// 📩 MAIL
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: EMAIL,
    pass: APP_PASSWORD
  }
});

async function sendEmail(message) {
  await transporter.sendMail({
    from: EMAIL,
    to: EMAIL,
    subject: "📊 REAL TRADE ALERT",
    text: message
  });
}

// 📊 GET OPTION CHAIN
async function getOptionChain(symbol) {
  try {
    const res = await axios.get(
      `https://api.upstox.com/v2/option/chain`,
      {
        headers: {
          Authorization: `Bearer ${ACCESS_TOKEN}`
        },
        params: {
          instrument_key: symbol,
          expiry_date: "nearest"
        }
      }
    );

    return res.data.data;
  } catch (err) {
    console.log("❌ Upstox API Error");
    return null;
  }
}

// 🧠 SMART LOGIC (OI BASED)
function pickBestTrades(chain) {
  if (!chain) return [];

  // sort by OI
  const sorted = chain.sort((a, b) =>
    (b.ce?.oi || 0) - (a.ce?.oi || 0)
  );

  const top = sorted.slice(0, 2);

  return top.map(item => ({
    strike: item.strike_price,
    ce: item.ce?.last_price,
    pe: item.pe?.last_price,
    oi: item.ce?.oi
  }));
}

// 📊 MAIN BOT
async function runBot() {
  try {
    console.log("📊 REAL UPSTOX BOT");

    let message = "📊 REAL TRADE ALERT\n\n";

    // 🔹 NIFTY
    const niftyChain = await getOptionChain("NSE_INDEX|Nifty 50");
    const niftyTrades = pickBestTrades(niftyChain);

    message += "📈 NIFTY\n\n";

    niftyTrades.forEach((t, i) => {
      message += `${i + 1}) BUY ${t.strike} CE\n`;
      message += `Premium: ${t.ce}\nOI: ${t.oi}\n\n`;
    });

    // 🔹 BANKNIFTY
    const bankChain = await getOptionChain("NSE_INDEX|Nifty Bank");
    const bankTrades = pickBestTrades(bankChain);

    message += "📈 BANKNIFTY\n\n";

    bankTrades.forEach((t, i) => {
      message += `${i + 1}) BUY ${t.strike} CE\n`;
      message += `Premium: ${t.ce}\nOI: ${t.oi}\n\n`;
    });

    console.log(message);
    await sendEmail(message);

  } catch (err) {
    console.error("❌ Error:", err.message);
  }
}

runBot();
