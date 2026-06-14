import type { Context } from '@netlify/functions'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic()

const nutritionTool: Anthropic.Tool = {
  name: 'return_nutrition',
  description: 'Return the nutritional information for the given food',
  input_schema: {
    type: 'object' as const,
    properties: {
      calories: { type: 'number', description: 'Total calories in kcal' },
      protein: { type: 'number', description: 'Protein in grams' },
      carbs: { type: 'number', description: 'Carbohydrates in grams' },
      fat: { type: 'number', description: 'Total fat in grams' },
      serving: { type: 'string', description: 'Description of the assumed serving size' },
    },
    required: ['calories', 'protein', 'carbs', 'fat', 'serving'],
  },
}

export default async (req: Request, context: Context) => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 })
  }

  let food: string
  try {
    const body = await req.json()
    food = body.food?.trim()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid request body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  if (!food) {
    return new Response(JSON.stringify({ error: 'Missing food parameter' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 300,
    system:
      'You are a nutrition database. Given a food name or description, call the return_nutrition tool with accurate standard nutritional values. For Indian foods, use Indian standard values.',
    messages: [{ role: 'user', content: food }],
    tools: [nutritionTool],
    tool_choice: { type: 'any' },
  })

  const toolUseBlock = message.content.find(
    (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use',
  )

  if (!toolUseBlock) {
    return new Response(JSON.stringify({ error: 'No nutrition data returned' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  return Response.json(toolUseBlock.input)
}

export const config = {
  path: '/api/lookup-nutrition',
}
