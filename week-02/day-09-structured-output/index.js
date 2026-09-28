// Day 9 — Structured output (JSON you can trust)
// Run: npm run day9
// Extracts clean JSON from a messy job posting, guaranteed to match our schema.
import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { client, MODEL } from "../../lib/claude.js";

const posting = `🚀 WE'RE HIRING!!! Junior MERN Developer @ Himalayan Tech Pvt. Ltd (Kathmandu, hybrid)
Must know React + Node, MongoDB is a plus. Git is a must!!
0-2 yrs experience. Salary: NPR 40k–60k/month depending on skills.
Send CV to jobs@himalayantech.example before Asoj 30. Freshers welcome 🙌`;

// 1. Describe the shape we want with Zod. .describe() text is sent to the model as guidance.
const Job = z.object({
  title: z.string(),
  company: z.string(),
  location: z.string(),
  remote: z.enum(["onsite", "hybrid", "remote", "unknown"]),
  skills: z.array(z.string()).describe("Required and nice-to-have technical skills"),
  experience_years: z.object({ min: z.number(), max: z.number() }),
  salary: z
    .object({ min: z.number(), max: z.number(), currency: z.string(), period: z.string() })
    .nullable()
    .describe("null if no salary is mentioned"),
  apply_email: z.string().nullable(),
});

// 2. messages.parse() sends the schema and parses the answer into a JS object for us
const response = await client.messages.parse({
  model: MODEL,
  max_tokens: 2048,
  output_config: { format: zodOutputFormat(Job) },
  messages: [{ role: "user", content: `Extract the job details from this posting:\n\n${posting}` }],
});

// 3. parsed_output is a normal JavaScript object — no JSON.parse, no regex
const job = response.parsed_output;
if (!job) {
  console.error("The model's answer didn't match the schema. stop_reason:", response.stop_reason);
  process.exit(1);
}

console.log(job);
console.log(`\n${job.title} at ${job.company} needs: ${job.skills.join(", ")}`);
if (job.salary) {
  console.log(`Pays ${job.salary.currency} ${job.salary.min}–${job.salary.max} per ${job.salary.period}`);
}
