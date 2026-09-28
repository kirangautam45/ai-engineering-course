// Day 7 — Few-shot examples and XML tags
// Run: npm run day7
// Turns messy customer emails into clean, consistent support tickets.
import { client, MODEL, textOf } from "../../lib/claude.js";
import { emails } from "./emails.js";

// The system prompt holds the instructions AND the examples. XML tags keep each part separate.
// The examples are deliberately different from each other so the model learns the pattern,
// not the exact wording.
const SYSTEM = `You turn customer emails for an internet provider into support tickets.

<instructions>
- Output only the ticket, in the exact format shown in the examples.
- Category must be one of: Outage, Slow speed, Billing, Plan change, Other.
- Priority is High when the customer can't use the service at all, Medium when it's degraded
  or money is involved, and Low for questions.
- If a detail isn't in the email, write "unknown". Never guess an account number.
</instructions>

<example>
<email>my bill shows 2 months late fee but i paid on time, receipt attached. acc 10293</email>
<ticket>
Category: Billing
Priority: Medium
Account: 10293
Location: unknown
Summary: Customer was charged late fees despite paying on time; has a receipt.
</ticket>
</example>

<example>
<email>NO INTERNET AT ALL in our office in Lalitpur since 9am, 20 people can't work!!!</email>
<ticket>
Category: Outage
Priority: High
Account: unknown
Location: Lalitpur
Summary: Complete outage at an office since 9am, affecting 20 staff.
</ticket>
</example>`;

for (const email of emails) {
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    system: SYSTEM,
    messages: [{ role: "user", content: `<email>${email}</email>` }],
  });

  console.log("\n📧 " + email);
  console.log(textOf(response));
}
