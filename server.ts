import express from "express";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: "10mb" }));

const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
};

// API: Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", app: "FINORA", timestamp: new Date().toISOString() });
});

// API: User Feedback submission targeting creator email agilan4413@gmail.com
app.post("/api/feedback", (req, res) => {
  try {
    const { category, rating, comment, userName, userEmail } = req.body || {};
    if (!comment || typeof comment !== "string") {
      res.status(400).json({ error: "Feedback comment is required" });
      return;
    }

    const recipient = "agilan4413@gmail.com";
    console.log(`[FINORA FEEDBACK -> ${recipient}]`, {
      category,
      rating,
      from: userEmail || userName || "Anonymous",
      comment,
      receivedAt: new Date().toISOString(),
    });

    res.json({
      success: true,
      recipient,
      message: `Feedback logged for ${recipient}`,
    });
  } catch (error) {
    console.error("Feedback endpoint error:", error);
    res.status(500).json({ error: "Failed to process feedback" });
  }
});

// API: Smart Transaction Entry Parser
app.post("/api/ai/parse-transaction", async (req, res) => {
  try {
    const { input, accounts = [], categories = [] } = req.body;
    if (!input || typeof input !== "string") {
      res.status(400).json({ error: "Input text is required" });
      return;
    }

    const ai = getGeminiClient();
    if (ai) {
      try {
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: `You are FINORA's Smart Transaction Parser.
Parse this natural language financial text: "${input}"
Current accounts available: ${JSON.stringify(accounts.map((a: { name: string; id: string }) => a.name))}
Categories available: ${JSON.stringify(categories)}

Rules:
1. Determine if this is an "expense", "income", or "transfer".
2. Extract the numeric amount (absolute positive number).
3. Identify category (e.g., Food & Dining, Transportation, Groceries, Pocket Money, Salary, Hostel, Shopping, Bills & Recharge, Medical, etc.).
4. Identify payment method or source/destination account if mentioned (e.g. UPI, Cash, SBI, HDFC, Card, Wallet).
5. Clean description summarizing the transaction.
6. Return purely valid JSON in the specified format with no surrounding markdown or explanation.

Format:
{
  "type": "expense" | "income" | "transfer",
  "amount": number,
  "category": string,
  "description": string,
  "paymentMethod": string,
  "suggestedAccountId": string or null,
  "confidence": number
}`,
          config: {
            responseMimeType: "application/json",
            temperature: 0.1,
          },
        });

        const text = response.text?.trim();
        if (text) {
          const parsed = JSON.parse(text);
          res.json({ success: true, data: parsed, engine: "gemini-2.5-flash" });
          return;
        }
      } catch (geminiErr) {
        console.warn("Gemini parsing failed, falling back to rule-based parser:", geminiErr);
      }
    }

    // Rule-based fallback
    const lower = input.toLowerCase();
    const amountMatch = input.match(/(?:rs\.?|inr|₹|\$|€|£)?\s*(\d+(?:,\d+)*(?:\.\d+)?)/i);
    let amount = 0;
    if (amountMatch) {
      amount = parseFloat(amountMatch[1].replace(/,/g, ""));
    }

    let type: "income" | "expense" | "transfer" = "expense";
    if (lower.includes("received") || lower.includes("salary") || lower.includes("pocket money") || lower.includes("gift") || lower.includes("credit") || lower.includes("earned") || lower.includes("allowance")) {
      type = "income";
    } else if (lower.includes("transfer") || lower.includes("sent to my") || lower.includes("moved to")) {
      type = "transfer";
    }

    let category = "Other Expenses";
    if (type === "income") {
      if (lower.includes("pocket money") || lower.includes("allowance") || lower.includes("father") || lower.includes("mom") || lower.includes("parents")) category = "Pocket Money";
      else if (lower.includes("salary")) category = "Salary";
      else if (lower.includes("freelance")) category = "Freelance Income";
      else if (lower.includes("scholarship")) category = "Scholarship";
      else category = "Other Income";
    } else {
      if (lower.includes("lunch") || lower.includes("dinner") || lower.includes("breakfast") || lower.includes("coffee") || lower.includes("tea") || lower.includes("food") || lower.includes("canteen") || lower.includes("mess") || lower.includes("swiggy") || lower.includes("zomato")) category = "Food & Dining";
      else if (lower.includes("auto") || lower.includes("uber") || lower.includes("ola") || lower.includes("bus") || lower.includes("metro") || lower.includes("train") || lower.includes("fuel") || lower.includes("petrol") || lower.includes("cab")) category = "Transportation";
      else if (lower.includes("hostel") || lower.includes("rent") || lower.includes("laundry") || lower.includes("room")) category = "Hostel & Rent";
      else if (lower.includes("grocery") || lower.includes("groceries") || lower.includes("milk") || lower.includes("vegetables") || lower.includes("zepto") || lower.includes("blinkit")) category = "Groceries";
      else if (lower.includes("recharge") || lower.includes("bill") || lower.includes("wifi") || lower.includes("electricity")) category = "Bills & Recharge";
      else if (lower.includes("book") || lower.includes("print") || lower.includes("course") || lower.includes("exam") || lower.includes("college") || lower.includes("tuition")) category = "Education";
      else if (lower.includes("movie") || lower.includes("netflix") || lower.includes("spotify") || lower.includes("gaming")) category = "Entertainment";
      else if (lower.includes("medicine") || lower.includes("doctor") || lower.includes("clinic") || lower.includes("pharmacy")) category = "Medical";
    }

    let paymentMethod = "UPI";
    if (lower.includes("cash")) paymentMethod = "Cash";
    else if (lower.includes("card") || lower.includes("debit") || lower.includes("credit")) paymentMethod = "Debit Card";
    else if (lower.includes("netbanking") || lower.includes("neft") || lower.includes("imps")) paymentMethod = "Net Banking";

    let description = input
      .replace(/(?:rs\.?|inr|₹|\$|€|£)?\s*\d+(?:,\d+)*(?:\.\d+)?/gi, "")
      .replace(/\b(upi|cash|card|debit|credit|via)\b/gi, "")
      .trim();
    if (!description) description = `${category} payment`;

    res.json({
      success: true,
      data: {
        type,
        amount: amount || 100,
        category,
        description: description.charAt(0).toUpperCase() + description.slice(1),
        paymentMethod,
        suggestedAccountId: null,
        confidence: 0.9,
      },
      engine: "rule-engine",
    });
  } catch (error) {
    console.error("Parse transaction error:", error);
    res.status(500).json({ error: "Failed to parse transaction" });
  }
});

// API: AI Financial Assistant
app.post("/api/ai/assistant", async (req, res) => {
  try {
    const { query, financialContext } = req.body;
    if (!query) {
      res.status(400).json({ error: "Query is required" });
      return;
    }

    const ai = getGeminiClient();
    if (ai) {
      try {
        const prompt = `You are FINORA's intelligent AI Financial Assistant.
Brand Tagline: "Your Money. Your Control."
The user is asking a financial query. You must answer clearly, accurately, empathetically, and constructively.
Never give guaranteed investment advice; provide personalized financial observations and budgeting clarity.

USER FINANCIAL SNAPSHOT:
${JSON.stringify(financialContext, null, 2)}

USER QUESTION:
"${query}"

Instructions:
- Keep the response well-structured with concise bullet points where appropriate.
- Refer to their real numbers (income, expenses, tracked balances, budgets, loans, savings) from the context.
- If asking "Can I afford X?", calculate remaining disposable income after upcoming bills/liabilities and give a clear practical verdict.
- Be encouraging, modern, and fintech-savvy. Format important amounts with the user's currency symbol.`;

        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt,
          config: {
            temperature: 0.3,
          },
        });

        const answer = response.text?.trim();
        if (answer) {
          res.json({ success: true, answer, engine: "gemini-2.5-flash" });
          return;
        }
      } catch (geminiErr) {
        console.warn("Gemini assistant error, falling back:", geminiErr);
      }
    }

    // Fallback response
    const { totalBalance = 0, monthlyIncome = 0, monthlyExpenses = 0, totalToPay = 0, totalToReceive = 0, currency = "₹" } = financialContext || {};
    const savings = monthlyIncome - monthlyExpenses;
    const lower = query.toLowerCase();

    let answer = "";
    if (lower.includes("where did i spend") || lower.includes("highest expense") || lower.includes("most")) {
      answer = `Based on your recent records, your primary expense categories are Food & Dining and Transportation. You have spent ${currency}${monthlyExpenses.toLocaleString()} in total this month across your tracked accounts.`;
    } else if (lower.includes("afford") || lower.includes("buy") || lower.includes("purchase")) {
      const remainingSafe = totalBalance - totalToPay;
      answer = `Here is your affordability breakdown:\n• Current Tracked Balance: ${currency}${totalBalance.toLocaleString()}\n• Outstanding Liabilities to Pay: ${currency}${totalToPay.toLocaleString()}\n• Net Unencumbered Liquidity: ${currency}${remainingSafe.toLocaleString()}\n\nTip: If the purchase is within ${currency}${Math.round(remainingSafe * 0.4).toLocaleString()}, you can comfortably afford it without straining your monthly commitments!`;
    } else if (lower.includes("save") || lower.includes("savings")) {
      answer = `This month you have saved ${currency}${savings > 0 ? savings.toLocaleString() : 0} (${monthlyIncome > 0 ? Math.round((savings / monthlyIncome) * 100) : 0}% savings rate). You also have ${currency}${totalToReceive.toLocaleString()} in pending receivables from friends that will boost your liquidity once settled.`;
    } else {
      answer = `Here is your current FINORA financial snapshot:\n• Total Tracked Balance: ${currency}${totalBalance.toLocaleString()}\n• Monthly Income: ${currency}${monthlyIncome.toLocaleString()}\n• Monthly Expenses: ${currency}${monthlyExpenses.toLocaleString()}\n• Outstanding to Collect: ${currency}${totalToReceive.toLocaleString()}\n• Outstanding to Repay: ${currency}${totalToPay.toLocaleString()}\n\nYou are in a solid position. Keep an eye on non-essential food and delivery spending to maintain healthy goal progress!`;
    }

    res.json({ success: true, answer, engine: "local-finora-engine" });
  } catch (error) {
    console.error("AI assistant error:", error);
    res.status(500).json({ error: "Failed to generate financial assistance" });
  }
});

// Global error handler (active in both local and Vercel environments)
app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("Unhandled server error:", err);
  if (!res.headersSent) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Setup Vite or static serving for local development
async function startServer() {
  const isProduction =
    process.env.NODE_ENV === "production" &&
    fs.existsSync(path.resolve("dist", "index.html"));

  if (!isProduction) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "custom",
    });
    app.use(vite.middlewares);

    app.use("*", async (req, res, next) => {
      const url = req.originalUrl;
      if (url.startsWith("/api")) {
        return next();
      }
      try {
        const indexPath = path.resolve("index.html");
        let template = fs.readFileSync(indexPath, "utf-8");
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ "Content-Type": "text/html" }).end(template);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
  } else {
    app.use(express.static(path.resolve("dist")));
    app.get("*", (_req, res) => {
      res.sendFile(path.resolve("dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`FINORA Server running on http://0.0.0.0:${PORT}`);
  });
}

if (!process.env.VERCEL) {
  startServer();
}

export default app;