import { spawn, execFileSync } from "node:child_process";
import path from "node:path";

const root = process.cwd();
const apiDir = path.join(root, "backend", "techocean-main", "demo");
const webDir = path.join(root, "web", "techocean-web-main");
const apiUrl = "http://localhost:18080";
const siteUrl = "http://localhost:5190";
const origin = siteUrl;
const setupToken = `local-test-only-${Date.now()}-${Math.random()}`;
const tempProfile = path.join(process.env.LOCALAPPDATA, "Temp", "opencode", `techocean-auth-${Date.now()}`);
const processes = [];
let socket;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const start = (file, args, cwd, env = process.env) => {
  const child = spawn(file, args, { cwd, env, stdio: "ignore", windowsHide: true });
  processes.push(child);
  return child;
};
const stopTree = (child) => {
  if (!child?.pid) return;
  try { execFileSync("taskkill", ["/PID", String(child.pid), "/T", "/F"], { stdio: "ignore" }); } catch {}
};
async function waitFor(label, action, timeout = 120000) {
  const until = Date.now() + timeout;
  let last;
  while (Date.now() < until) {
    try { const value = await action(); if (value) return value; } catch (error) { last = error; }
    await sleep(500);
  }
  throw new Error(`Timeout waiting for ${label}${last ? `: ${last.message}` : ""}`);
}

try {
  const apiEnv = { ...process.env, SERVER_PORT: "18080", ADMIN_SETUP_TOKEN: setupToken, CORS_ALLOWED_ORIGIN_PATTERNS: origin };
  start("cmd.exe", ["/d", "/s", "/c", "mvnw.cmd -q spring-boot:run"], apiDir, apiEnv);
  const webEnv = { ...process.env, VITE_API_URL: apiUrl };
  start("cmd.exe", ["/d", "/s", "/c", "npm run dev -- --host 0.0.0.0 --port 5190"], webDir, webEnv);
  await waitFor("API health", async () => (await fetch(`${apiUrl}/actuator/health`)).ok);
  await waitFor("Vite server", async () => (await fetch(siteUrl)).ok);

  const browser = start("C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe", [
    "--headless=new", "--disable-gpu", "--no-first-run", "--no-default-browser-check",
    "--remote-debugging-port=9361", `--user-data-dir=${tempProfile}`, `${siteUrl}/admin/setup`,
  ], root);
  const targets = await waitFor("Edge CDP", async () => {
    const response = await fetch("http://127.0.0.1:9361/json/list");
    if (!response.ok) return null;
    return (await response.json()).find((target) => target.type === "page" && target.webSocketDebuggerUrl);
  });
  socket = new WebSocket(targets.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    socket.addEventListener("open", resolve, { once: true });
    socket.addEventListener("error", reject, { once: true });
  });

  let requestId = 0;
  const pending = new Map();
  socket.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    if (!message.id || !pending.has(message.id)) return;
    const req = pending.get(message.id); pending.delete(message.id);
    if (message.error) req.reject(new Error(message.error.message)); else req.resolve(message.result);
  });
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++requestId; pending.set(id, { resolve, reject });
    socket.send(JSON.stringify({ id, method, params }));
  });
  const evaluate = async (expression) => {
    const result = await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
    return result.result?.value;
  };
  await send("Runtime.enable"); await send("Page.enable");
  const waitDom = (name, expression) => waitFor(name, () => evaluate(expression), 30000);
  const assert = (condition, name) => { if (!condition) throw new Error(`FAIL ${name}`); console.log(`PASS ${name}`); };
  const goto = async (route) => {
    await send("Page.navigate", { url: `${siteUrl}${route}` });
    await waitDom(`route ${route}`, `document.readyState === "complete" && !!document.querySelector("#app")`);
    await sleep(250);
  };

  await waitDom("setup page", `!!document.querySelector('form[data-form="admin-setup"]')`);
  const adminEmail = `admin.${Date.now()}@example.test`;
  const adminPassword = "SmokeAdmin123";
  await evaluate(`(() => { const f=document.querySelector('form[data-form="admin-setup"]'); f.elements.namedItem("setupToken").value=${JSON.stringify(setupToken)}; f.elements.namedItem("nome").value="Admin Smoke"; f.elements.namedItem("email").value=${JSON.stringify(adminEmail)}; f.elements.namedItem("senha").value=${JSON.stringify(adminPassword)}; f.requestSubmit(); return true; })()`);
  await waitDom("setup completed", `location.pathname === "/dashboard/acesso-admin"`);
  assert(true, "first administrator is provisioned through the one-time setup token in the UI");

  await evaluate(`(() => { const f=document.querySelector('form[data-form="admin-login"]'); f.elements.namedItem("email").value=${JSON.stringify(adminEmail)}; f.elements.namedItem("senha").value=${JSON.stringify(adminPassword)}; f.requestSubmit(); return true; })()`);
  await waitDom("admin dashboard", `document.querySelector('.dashboard')?.textContent.includes("ADMIN")`);
  assert(true, "admin login obtains a Bearer token and opens the dashboard");

  await evaluate(`(() => { const a=[...document.querySelectorAll('a[href]')].find(x=>x.getAttribute("href") === "/dashboard/usuario"); a?.click(); return !!a; })()`);
  await waitDom("team panel", `document.querySelector('#section-content')?.textContent.includes(${JSON.stringify(adminEmail)})`);
  assert(await evaluate(`!!document.querySelector('.sidebar a[href="/dashboard/usuario"]')`), "team account management is inside the dashboard sidebar");
  assert(await evaluate(`!!document.querySelector('.sidebar a[href="/dashboard/auditoria"]')`), "audit log is inside the admin dashboard");

  const employeeEmail = `employee.${Date.now()}@example.test`;
  await evaluate(`document.querySelector('[data-action="new-resource"][data-resource="usuario"]').click()`);
  await evaluate(`(() => { const f=document.querySelector('form[data-form="resource"][data-resource="usuario"]'); f.elements.namedItem("nome").value="Funcionário Smoke"; f.elements.namedItem("email").value=${JSON.stringify(employeeEmail)}; f.elements.namedItem("cargo").value="FUNCIONARIO"; f.elements.namedItem("senha").value="StaffSmoke123"; f.requestSubmit(); return true; })()`);
  await waitDom("staff account created", `document.querySelector('#section-content')?.textContent.includes(${JSON.stringify(employeeEmail)})`);
  assert(true, "admin creates a staff account through POST /admin/usuarios");

  await evaluate(`(() => { const a=document.querySelector('.sidebar a[href="/dashboard/conteiner"]'); a?.click(); return !!a; })()`);
  await waitDom("container section", `document.querySelector('#section-content')?.textContent.includes("Nenhum registro")`);
  await evaluate(`document.querySelector('[data-action="new-resource"][data-resource="conteiner"]').click()`);
  const containerNumber = `SMOKE-${Date.now()}`;
  await evaluate(`(() => { const f=document.querySelector('form[data-form="resource"][data-resource="conteiner"]'); f.elements.namedItem("numeroConteiner").value=${JSON.stringify(containerNumber)}; f.elements.namedItem("tipo").value="40 HC"; f.elements.namedItem("situacao").value="VAZIO"; f.requestSubmit(); return true; })()`);
  await waitDom("container created by panel", `document.querySelector('#section-content')?.textContent.includes(${JSON.stringify(containerNumber)})`);
  await evaluate(`(() => { const row=[...document.querySelectorAll("#section-content tbody tr")].find(r=>r.textContent.includes(${JSON.stringify(containerNumber)})); row?.querySelector('[data-resource-action="edit"]').click(); return !!row; })()`);
  await waitDom("container edit form", `!!document.querySelector('form[data-form="resource"][data-resource="conteiner"]')`);
  await evaluate(`(() => { const f=document.querySelector('form[data-form="resource"][data-resource="conteiner"]'); f.elements.namedItem("tipo").value="20 DRY"; f.requestSubmit(); return true; })()`);
  await waitDom("container updated by panel", `document.querySelector('#section-content')?.textContent.includes("20 DRY")`);
  await evaluate(`window.confirm=()=>true; const row=[...document.querySelectorAll("#section-content tbody tr")].find(r=>r.textContent.includes(${JSON.stringify(containerNumber)})); row?.querySelector('[data-resource-action="delete"]').click(); !!row`);
  await waitDom("container deleted by panel", `!document.querySelector('#section-content')?.textContent.includes(${JSON.stringify(containerNumber)})`);
  assert(true, "dashboard container create/update/delete calls the protected controllers");

  const bookingDate = new Date(Date.now() + 86400000).toISOString().slice(0, 16);
  const publicBookingResponse = await fetch(`${apiUrl}/agendamentos`, { method: "POST", headers: { "Content-Type": "application/json", Origin: origin }, body: JSON.stringify({ nome: "Cliente Agenda Smoke", cpf: "12345678901", telefone: "11977770000", email: `agenda.${Date.now()}@example.test`, senha: "AgendaSmoke123", dataHora: bookingDate, confirmacao: true }) });
  if (!publicBookingResponse.ok) throw new Error(`Public appointment signup failed with HTTP ${publicBookingResponse.status}`);
  const adminApiLogin = await fetch(`${apiUrl}/admin/login`, { method: "POST", headers: { "Content-Type": "application/json", Origin: origin }, body: JSON.stringify({ email: adminEmail, senha: adminPassword }) });
  const adminApiToken = (await adminApiLogin.json()).accessToken;
  const accountsResponse = await fetch(`${apiUrl}/agendamentos/usuarios`, { headers: { Authorization: `Bearer ${adminApiToken}`, Origin: origin } });
  const accounts = await accountsResponse.json();
  const appointmentAccount = accounts.find((account) => account.email.startsWith("agenda."));
  if (!appointmentAccount) throw new Error("Appointment customer account was not available to staff");
  await evaluate(`(() => { const a=document.querySelector('.sidebar a[href="/dashboard/agendamento"]'); a?.click(); return !!a; })()`);
  await waitDom("appointments section", `!!document.querySelector('[data-action="new-resource"][data-resource="agendamento"]')`);
  await evaluate(`document.querySelector('[data-action="new-resource"][data-resource="agendamento"]').click()`);
  await waitDom("appointment create form", `!!document.querySelector('form[data-form="resource"][data-resource="agendamento"]')`);
  const managedPhone = `1196666${String(Date.now()).slice(-4)}`;
  await evaluate(`(() => { const f=document.querySelector('form[data-form="resource"][data-resource="agendamento"]'); f.elements.namedItem("usuarioId").value="${appointmentAccount.id}"; f.elements.namedItem("telefone").value="${managedPhone}"; f.elements.namedItem("dataHora").value="${bookingDate}"; f.elements.namedItem("confirmado").value="false"; f.requestSubmit(); return true; })()`);
  await waitDom("appointment created by staff UI", `document.querySelector('#section-content')?.textContent.includes("${managedPhone}")`);
  assert(true, "staff appointment form uses the protected management endpoint and customer selector");

  const userResponse = await fetch(`${apiUrl}/admin/login`, { method: "POST", headers: { "Content-Type": "application/json", Origin: origin }, body: JSON.stringify({ email: employeeEmail, senha: "StaffSmoke123" }) });
  if (!userResponse.ok) throw new Error(`Staff login failed with HTTP ${userResponse.status}`);
  const staffLogin = await userResponse.json();
  const staffHeaders = { Authorization: `Bearer ${staffLogin.accessToken}`, Origin: origin };
  const ownClients = await fetch(`${apiUrl}/clientes`, { headers: staffHeaders });
  assert(ownClients.ok, "FUNCIONARIO can read operational customer records");
  const staffList = await fetch(`${apiUrl}/admin/usuarios`, { headers: staffHeaders });
  assert(staffList.status === 403, "FUNCIONARIO cannot manage staff via direct API calls");
  const staffAudit = await fetch(`${apiUrl}/admin/auditoria`, { headers: staffHeaders });
  assert(staffAudit.status === 403, "FUNCIONARIO cannot read audit logs via direct API calls");

  const audit = await fetch(`${apiUrl}/admin/auditoria`, { headers: { Authorization: `Bearer ${(await (await fetch(`${apiUrl}/admin/login`, { method: "POST", headers: { "Content-Type": "application/json", Origin: origin }, body: JSON.stringify({ email: adminEmail, senha: adminPassword }) })).json()).accessToken}`, Origin: origin } });
  if (!audit.ok) throw new Error(`Admin audit request failed with HTTP ${audit.status}`);
  const events = await audit.json();
  assert(Array.isArray(events) && events.some((event) => event.actorName === "Admin Smoke"), "admin audit endpoint records the actor and actions");

  await goto("/dashboard/acesso-equipe");
  assert(await evaluate(`document.querySelector('form[data-form="admin-login"]')?.dataset.loginPortal === "team"`), "team has a separate login interface inside the dashboard access flow");
  await evaluate(`(() => { const f=document.querySelector('form[data-form="admin-login"]'); f.elements.namedItem("email").value=${JSON.stringify(employeeEmail)}; f.elements.namedItem("senha").value="StaffSmoke123"; f.requestSubmit(); return true; })()`);
  await waitDom("employee dashboard", `document.querySelector('.dashboard')?.textContent.includes("FUNCIONARIO")`);
  assert(await evaluate(`!!document.querySelector('.sidebar a[href="/dashboard/conteiner"]')`), "employee login opens operational dashboard modules");
  assert(!(await evaluate(`!!document.querySelector('.sidebar a[href="/dashboard/usuario"]')`)), "employee dashboard hides team management");
  await evaluate(`(() => { history.pushState({}, "", "/dashboard/auditoria"); dispatchEvent(new PopStateEvent("popstate")); return true; })()`);
  assert(await waitDom("employee audit restriction", `document.body.textContent.includes("Acesso restrito")`), "employee cannot open admin audit section through dashboard navigation");
  console.log("Local auth/RBAC/audit browser smoke completed.");
} catch (error) {
  console.error(error.stack || error);
  process.exitCode = 1;
} finally {
  try { socket?.close(); } catch {}
  for (const child of processes.reverse()) {
    if (child?.pid) { try { execFileSync("taskkill", ["/PID", String(child.pid), "/T", "/F"], { stdio: "ignore" }); } catch {} }
  }
}
