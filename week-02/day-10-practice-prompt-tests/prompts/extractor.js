// Pulls contact details out of a message as JSON.
import { z } from "zod";

export default {
  name: "extractor",
  version: 1,
  effort: "low",
  system: `Extract the sender's contact details from the message.
Use null for anything that isn't written in the message. Never guess a phone number or email.
Write Nepali mobile numbers as 10 digits with no spaces or dashes.`,
  schema: z.object({
    name: z.string().nullable(),
    phone: z.string().nullable(),
    email: z.string().nullable(),
  }),
  build: (input) => `<message>\n${input}\n</message>`,
  tests: [
    {
      input: "Hi, this is Ramesh Thapa, call me on 9841-234-567 about the admission form.",
      expect: { name: "Ramesh Thapa", phone: "9841234567", email: null },
    },
    {
      input: "Please reply to anita.k@example.com — Anita",
      expect: { name: "Anita", phone: null, email: "anita.k@example.com" },
    },
    {
      input: "Is the hostel still available for this semester?",
      expect: { name: null, phone: null, email: null },
    },
  ],
  // Compare every field of the parsed object
  check: (output, test) => {
    const wrong = Object.keys(test.expect).filter((key) => output[key] !== test.expect[key]);
    return wrong.length ? `wrong: ${wrong.map((k) => `${k}=${JSON.stringify(output[k])}`).join(", ")}` : true;
  },
};
