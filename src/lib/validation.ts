import { z } from 'zod'

export const ExpenseSchema = z.object({
  id: z.string().min(1),
  amountCents: z.number().int().positive().finite(),
  category: z.enum(['food', 'transport', 'housing', 'bills', 'health', 'shopping', 'fun', 'data', 'other']),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
})

export const ExpensesSchema = z.array(ExpenseSchema)
