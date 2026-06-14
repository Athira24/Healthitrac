export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method Not Allowed",
    });
  }

  try {
    const { food } = req.body;

    if (!food || food.trim() === "") {
      return res.status(400).json({
        error: "Food parameter is required",
      });
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY || "",
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-3-5-haiku-latest",
        max_tokens: 300,
        system: `
You are a nutrition expert.

The user will give a food name and optionally quantity.

Return ONLY valid JSON.

Example:

{
  "calories": 174,
  "protein": 5.7,
  "carbs": 36,
  "fat": 0.9,
  "serving": "3 idli"
}

Do not return markdown.
Do not explain anything.
Return JSON only.
`,
        messages: [
          {
            role: "user",
            content: food
          }
        ]
      })
    });

    const result = await response.json();

    if (!response.ok) {
      console.error(result);

      return res.status(response.status).json({
        error: result
      });
    }

    if (
      !result.content ||
      !Array.isArray(result.content) ||
      result.content.length === 0
    ) {
      return res.status(500).json({
        error: "No response received from Anthropic"
      });
    }

    const text = result.content[0].text;

    let nutrition;

    try {
      nutrition = JSON.parse(text);
    } catch (e) {
      console.error(text);

      return res.status(500).json({
        error: "Claude returned invalid JSON",
        raw: text
      });
    }

    return res.status(200).json(nutrition);

  } catch (err: any) {
    console.error(err);

    return res.status(500).json({
      error: err.message || "Internal Server Error"
    });
  }
}
