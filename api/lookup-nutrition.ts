import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const nutritionTool = {
  name: "return_nutrition",
  description: "Return the nutritional information for the given food",
  input_schema: {
    type: "object",
    properties: {
      calories: {
        type: "number",
        description: "Total calories in kcal",
      },
      protein: {
        type: "number",
        description: "Protein in grams",
      },
      carbs: {
        type: "number",
        description: "Carbohydrates in grams",
      },
      fat: {
        type: "number",
        description: "Total fat in grams",
      },
      serving: {
        type: "string",
        description: "Description of the serving size",
      },
    },
    required: [
      "calories",
      "protein",
      "carbs",
      "fat",
      "serving",
    ],
  },
};

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method Not Allowed",
    });
  }

  const { food } = req.body;

  if (!food) {
    return res.status(400).json({
      error: "Missing food parameter",
    });
  }

  try {
    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 300,
      system: `
You are a nutrition database.

Given a food name, estimate nutrition using standard nutrition references.

For Indian foods use Indian nutrition values.

Always call the return_nutrition tool.

Return nutrition for ONE serving.
`,
      messages: [
        {
          role: "user",
          content: food,
        },
      ],
      tools: [nutritionTool],
      tool_choice: {
        type: "any",
      },
    });

    const toolUse = message.content.find(
      (block: any) => block.type === "tool_use"
    );

    if (!toolUse) {
      return res.status(500).json({
        error: "No nutrition returned",
      });
    }

    return res.status(200).json(toolUse.input);
  } catch (err: any) {
    console.error(err);

    return res.status(500).json({
      error: err.message || "Internal Server Error",
    });
  }
}
