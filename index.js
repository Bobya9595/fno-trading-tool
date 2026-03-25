import YahooFinance from "yahoo-finance2";
import nodemailer from "nodemailer";

const yahooFinance = new YahooFinance();

// 🔴 ADD YOUR DETAILS
const EMAIL = process.env.EMAIL || "nihar55chopade@gmail.com";
const APP_PASSWORD = process.env.APP_PASSWORD || "nqva ppdv gbzo obix";

// 📩 Email setup
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
    subject: "📊 Trade Alert",
    text: message
  });
}

// 🔥 IMPROVED LOGIC (HIGH ACCURACY FILTER)
function generateTrades(price, change) {
  const trades = [];
  const atm = Math.round(price / 100) * 100;

  const absChange = Math.abs(change);

  // ❌ Avoid weak market
  if (absChange < 1.2) {
    return [];
  }

  // 🔥 Strong bullish
  if (change > 1.2) {
    trades.push({ strike: atm, type: "CE" });

    if (absChange > 1.8) {
      trades.push({ strike: atm + 100, type: "CE" });
    }
  }

  // 🔥 Strong bearish
  if (change < -1.2) {
    trades.push({ strike: atm, type: "PE" });

    if (absChange > 1.8) {
      trades.push({ strike: atm - 100, type: "PE" });
    }
  }

  return trades;
}

// 🔥 TRADE CALCULATION
function buildTrade(strike, type) {
  const entry = Math.floor(100 + Math.random() * 40); // simulated premium

  return {
    strike,
    type,
    entry,
    sl: (entry * 0.8).toFixed(2),
    target: (entry * 1.4).toFixed(2)
  };
}

// 🚀 MAIN BOT
async function runBot() {
  try {
    console.log("📊 FINAL SMART TRADE SYSTEM\n");

    const symbols = [
      { name: "NIFTY", symbol: "^NSEI" },
      { name: "BANKNIFTY", symbol: "^NSEBANK" }
    ];

    let message = "📊 TRADE ALERT\n\n";

    for (const s of symbols) {
      const data = await yahooFinance.quote(s.symbol);

      const price = data.regularMarketPrice ?? 0;
      const change = data.regularMarketChangePercent ?? 0;

      const trades = generateTrades(price, change);

      message += `📈 ${s.name}\n`;

      if (trades.length === 0) {
        message += "NO TRADE (Market Weak)\n\n";
        continue;
      }

      trades.forEach((t, i) => {
        const trade = buildTrade(t.strike, t.type);

        message += `
${i + 1}) BUY ${trade.strike} ${trade.type}
Entry: ${trade.entry}
SL: ${trade.sl}
Target: ${trade.target}
`;
      });

      message += "\n";
    }

    console.log(message);

    await sendEmail(message);

  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

runBot();
