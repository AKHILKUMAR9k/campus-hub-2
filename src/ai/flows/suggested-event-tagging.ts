'use server';

/**
 * @fileOverview An AI agent that suggests relevant tags for an event based on its description.
 *
 * - suggestEventTags - A function that handles the tag suggestion process.
 * - SuggestEventTagsInput - The input type for the suggestEventTags function.
 * - SuggestEventTagsOutput - The return type for the suggestEventTags function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestEventTagsInputSchema = z.object({
  description: z
    .string()
    .describe('The description of the event for which tags are to be suggested.'),
});
export type SuggestEventTagsInput = z.infer<typeof SuggestEventTagsInputSchema>;

const SuggestEventTagsOutputSchema = z.object({
  tags: z
    .array(z.string())
    .describe('An array of suggested tags for the event description.'),
});
export type SuggestEventTagsOutput = z.infer<typeof SuggestEventTagsOutputSchema>;

export async function suggestEventTags(input: SuggestEventTagsInput): Promise<SuggestEventTagsOutput> {
  return suggestEventTagsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestEventTagsPrompt',
  model: 'googleai/gemini-1.5-flash',
  input: {schema: SuggestEventTagsInputSchema},
  output: {schema: SuggestEventTagsOutputSchema},
  prompt: `You are an event tag suggestion expert. Given an event description, you will suggest relevant tags for the event.

Description: {{{description}}}

Suggest at least 5 tags. The tags should be short and descriptive.  The tags should be suitable for filtering and searching events. Return a JSON array of strings.`,
});

const suggestEventTagsFlow = ai.defineFlow(
  {
    name: 'suggestEventTagsFlow',
    inputSchema: SuggestEventTagsInputSchema,
    outputSchema: SuggestEventTagsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
