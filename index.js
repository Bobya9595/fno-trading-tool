import yahooFinance from "yahoo-finance2";

const symbols = ["^NSEI", "^NSEBANK"];

async function getData() {
  try {
    console.log("📊 Fetching Market Data...\n");

    for (let symbol of symbols) {
      const data = await yahooFinance.quote(symbol);

      console.log(`📈 ${symbol}`);
      console.log("Price:", data.regularMarketPrice);
      console.log("Change %:", data.regularMarketChangePercent);
      console.log("Volume:", data.regularMarketVolume);
      console.log("--------------------------");
    }

  } catch (error) {
    console.error("Error:", error);
  }
}

getData();
