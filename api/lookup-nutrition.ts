import nutritionDB from "../nutritionDB.json";

export default async function handler(req: any, res: any) {
  // Allow only POST
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method Not Allowed",
    });
  }

  try {
    const { food, quantity = 1 } = req.body;

    if (!food) {
      return res.status(400).json({
        error: "Food is required",
      });
    }

    const search = String(food).toLowerCase().trim();

    console.log("Searching for:", search);

    const db = nutritionDB as Record<string, any>;

    let item: any = null;

    // Search through all foods
    for (const [key, value] of Object.entries(db)) {

      const aliases: string[] = value.aliases || [];

      const matched =
        key.toLowerCase() === search ||
        search.includes(key.toLowerCase()) ||
        aliases.some(alias => {
          const a = alias.toLowerCase();
          return (
            a === search ||
            search.includes(a) ||
            a.includes(search)
          );
        });

      if (matched) {
        item = value;
        console.log("Matched:", key);
        break;
      }
    }

    if (!item) {
      console.log("Food not found:", search);

      return res.status(404).json({
        error: `Food '${food}' not found`
      });
    }

    let multiplier = Number(quantity);

    // Calculate multiplier for 100g / 100ml foods
    if (
      item.baseQuantity === 100 &&
      (item.unit === "g" || item.unit === "ml")
    ) {
      multiplier = Number(quantity) / 100;
    }

    const result = {
      food,
      serving: `${quantity} ${item.unit}`,
      calories: Number((item.calories * multiplier).toFixed(1)),
      protein: Number((item.protein * multiplier).toFixed(1)),
      carbs: Number((item.carbs * multiplier).toFixed(1)),
      fat: Number((item.fat * multiplier).toFixed(1))
    };

    console.log(result);

    return res.status(200).json(result);

  } catch (err: any) {
    console.error(err);

    return res.status(500).json({
      error: err.message || "Internal Server Error"
    });
  }
}
