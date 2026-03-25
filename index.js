import YahooFinance from "yahoo-finance2";
import nodemailer from "nodemailer";

const yahooFinance = new YahooFinance({
  suppressNotices: ['yahooSurvey']
});

// ENV VARIABLES
const EMAIL = process.env.EMAIL;
const APP_PASSWORD = process.env.APP_PASSWORD;

// MAIL SETUP
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
    subject: "📊 Smart Trade Alert",
    text: message
  });
}

// CORE LOGIC
function getSignal(change) {
  if (change > 1) return "CE";
  if (change < -1) return "PE";
  return null;
}

function getATM(price) {
  return Math.round(price / 100) * 100;
}

// BETTER ENTRY TIMING (9:15 logic)
function getEntryTiming() {
  const now = new Date();
  const hour = now.getHours();
  const min = now.getMinutes();

  if (hour === 9 && min <= 20) return "OPEN BREAKOUT";
  if (hour === 9 && min > 20) return "WAIT FOR RETEST";

  return "MARKET CLOSED / LATE ENTRY";
}

// TRADE CALCULATION
function buildTrade(strike, type) {
  const premium = 100 + Math.floor(Math.random() * 40); // still approx

  return {
    strike,
    type,
    entry: premium,
    sl: (premium * 0.8).toFixed(2),
    target: (premium * 1.4).toFixed(2)
  };
}

// MAIN BOT
async function runBot() {
  try {
    console.log("📊 PRO TRADE SYSTEM STARTED");

    const nifty = await yahooFinance.quote("^NSEI");
    const banknifty = await yahooFinance.quote("^NSEBANK");

    let message = "📊 TRADE ALERT\n\n";

    // ========= NIFTY =========
    const niftySignal = getSignal(nifty.regularMarketChangePercent);

    if (niftySignal) {
      const atm = getATM(nifty.regularMarketPrice);

      const t1 = buildTrade(atm, niftySignal);
      const t2 = buildTrade(atm + 100, niftySignal);

      message += `📈 NIFTY\n\n`;
      message += `1) BUY ${t1.strike} ${t1.type}\nEntry: ${t1.entry}\nSL: ${t1.sl}\nTarget: ${t1.target}\n\n`;
      message += `2) BUY ${t2.strike} ${t2.type}\nEntry: ${t2.entry}\nSL: ${t2.sl}\nTarget: ${t2.target}\n\n`;
    }

    // ========= BANKNIFTY =========
    const bankSignal = getSignal(banknifty.regularMarketChangePercent);

    if (bankSignal) {
      const atm = getATM(banknifty.regularMarketPrice);

      const t1 = buildTrade(atm, bankSignal);
      const t2 = buildTrade(atm + 100, bankSignal);

      message += `📈 BANKNIFTY\n\n`;
      message += `1) BUY ${t1.strike} ${t1.type}\nEntry: ${t1.entry}\nSL: ${t1.sl}\nTarget: ${t1.target}\n\n`;
      message += `2) BUY ${t2.strike} ${t2.type}\nEntry: ${t2.entry}\nSL: ${t2.sl}\nTarget: ${t2.target}\n\n`;
    }

    message += `⏱ Entry Type: ${getEntryTiming()}\n`;

    console.log(message);
    await sendEmail(message);

  } catch (err) {
    console.error("❌ Error:", err.message);
  }
}

runBot();
