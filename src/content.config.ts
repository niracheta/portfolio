import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: z.object({
    title: z.string(),
    summary: z.string().max(200),
    tags: z.array(z.string()).max(6),
    order: z.number(), // lower = shown first
    draft: z.boolean().default(false),
  }),
});

export const collections = { projects };
