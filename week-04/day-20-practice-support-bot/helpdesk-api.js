// A small client for the Helpdesk API from the MERN course
// (https://github.com/kirangautam45/Saptagandaki-MERN-Stack/tree/main/helpdesk-api).
// It knows nothing about AI: it just logs in and calls the REST endpoints.

const BASE_URL = process.env.HELPDESK_URL ?? "http://localhost:5002";
let token = null;

async function call(path, { method = "GET", body } = {}) {
  let res;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: body && JSON.stringify(body),
    });
  } catch {
    throw new Error(`Can't reach the Helpdesk API at ${BASE_URL}. Is it running?`);
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message ?? `Helpdesk API returned ${res.status}`);
  return data;
}

// Log in once with the test account from .env. The token is kept here, in our code,
// and is never shown to the model.
export async function login() {
  const { HELPDESK_EMAIL: email, HELPDESK_PASSWORD: password } = process.env;
  if (!email || !password) throw new Error("Add HELPDESK_EMAIL and HELPDESK_PASSWORD to your .env file.");
  const data = await call("/api/auth/login", { method: "POST", body: { email, password } });
  token = data.token;
  return data.user;
}

export const listTickets = () => call("/api/tickets");
export const getTicket = (id) => call(`/api/tickets/${id}`);
export const createTicket = ({ title, description }) =>
  call("/api/tickets", { method: "POST", body: { title, description } });
export const updateTicketStatus = (id, status) =>
  call(`/api/tickets/${id}`, { method: "PUT", body: { status } });
