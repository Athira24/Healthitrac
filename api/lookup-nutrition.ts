import nutritionDB from "../nutritionDB.json";

export default async function handler(req: any, res: any) {
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

    const search = food.toLowerCase().trim();

    let item: any = null;

    for (const key in nutritionDB) {
      const current: any = (nutritionDB as any)[key];

      const aliasMatched = current.aliases.some((alias: string) => {
  const aliasLower = alias.toLowerCase();

  return (
    search === aliasLower ||
    search.includes(aliasLower) ||
    aliasLower.includes(search)
  );
});

const keyMatched =
  key.toLowerCase() === search ||
  search.includes(key.toLowerCase());

if (keyMatched || aliasMatched) {
  item = current;
  break;
}
      }
    }

    if (!item) {
      return res.status(404).json({
        error: "Food not found",
      });
    }

    let multiplier = quantity;

    // Foods measured per 100g or 100ml
    if (
      item.baseQuantity === 100 &&
      (item.unit === "g" || item.unit === "ml")
    ) {
      multiplier = quantity / 100;
    }

    const result = {
      calories: +(item.calories * multiplier).toFixed(1),
      protein: +(item.protein * multiplier).toFixed(1),
      carbs: +(item.carbs * multiplier).toFixed(1),
      fat: +(item.fat * multiplier).toFixed(1),
      serving: `${quantity} ${item.unit}`,
      food: food,
    };

    return res.status(200).json(result);

  } catch (err: any) {
    console.error(err);

    return res.status(500).json({
      error: err.message,
    });
  }
}
