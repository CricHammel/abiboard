import { z } from 'zod';

export const steckbriefUpdateSchema = z.object({
  quote: z.string().max(500, 'Das Zitat darf maximal 500 Zeichen lang sein.').optional(),
  plansAfter: z.string().max(1000, 'Die Pläne dürfen maximal 1000 Zeichen lang sein.').optional(),
  memory: z.string().max(1000, 'Die Erinnerung darf maximal 1000 Zeichen lang sein.').optional(),
  // Files are validated separately in the API route
});

export type SteckbriefUpdateInput = z.infer<typeof steckbriefUpdateSchema>;
