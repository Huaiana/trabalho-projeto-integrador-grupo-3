import { spawn, execFileSync } from "node:child_process";
import path from "node:path";

const apiDir = path.join(process.cwd(), "backend", "techocean-main", "demo");
const port = 18080;
const baseUrl = `http://127.0.0.1:${port}`;
const setupToken = `local-controller-smoke-${Date.now()}-${Math.random()}`;
const child = spawn("cmd.exe", ["/d", "/s", "/c", "mvnw.cmd -q spring-boot:run"], {
  cwd: apiDir,
  env: { ...process.env, SERVER_PORT: String(port), ADMIN_SETUP_TOKEN: setupToken },
  stdio: "ignore",
  windowsHide: true,
});

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const assert = (condition, message) => {
  if (!condition) throw new Error(`FAIL ${message}`);
  console.log(`PASS ${message}`);
};

async function request(path, { method = "GET", body, token, params, headers = {} } = {}) {
  const url = `${baseUrl}${path}${params ? `?${new URLSearchParams(params)}` : ""}`;
  const requestHeaders = { Origin: "http://localhost:5173", ...headers };
  if (body !== undefined) requestHeaders["Content-Type"] = "application/json";
  if (token) requestHeaders.Authorization = `Bearer ${token}`;
  const response = await fetch(url, {
    method,
    headers: requestHeaders,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await response.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  return { response, data };
}

try {
  let apiReady = false;
  for (let attempt = 0; attempt < 100; attempt++) {
    try {
      if ((await fetch(`${baseUrl}/actuator/health`)).ok) { apiReady = true; break; }
    } catch {}
    await wait(500);
  }
  if (!apiReady) throw new Error("The isolated Spring API did not start on port 18080.");

  let result = await request("/admin/setup", {
    method: "POST",
    headers: { "X-Admin-Setup-Token": setupToken },
    body: { nome: "Admin Controller Smoke", email: "admin-controller-smoke@example.test", senha: "SmokePass123" },
  });
  assert(result.response.status === 201, "one-time admin bootstrap returns 201");
  const bootstrapReplay = await request("/admin/setup", {
    method: "POST",
    headers: { "X-Admin-Setup-Token": setupToken },
    body: { nome: "Replay", email: "replay@example.test", senha: "SmokePass123" },
  });
  assert(bootstrapReplay.response.status === 403, "bootstrap token cannot be replayed after first admin");

  result = await request("/admin/login", {
    method: "POST",
    body: { email: "admin-controller-smoke@example.test", senha: "SmokePass123" },
  });
  assert(result.response.ok && result.data?.accessToken, "admin login returns a signed bearer token");
  const adminToken = result.data.accessToken;

  const employee = await request("/admin/usuarios", {
    method: "POST", token: adminToken,
    body: { nome: "Funcionário Smoke", email: "employee-controller-smoke@example.test", senha: "StaffPass123", cargo: "FUNCIONARIO" },
  });
  assert(employee.response.status === 201 && employee.data.cargo === "FUNCIONARIO", "admin can create an employee role");
  const employeeLogin = await request("/admin/login", {
    method: "POST", body: { email: "employee-controller-smoke@example.test", senha: "StaffPass123" },
  });
  assert(employeeLogin.response.ok, "employee can log in");
  const employeeToken = employeeLogin.data.accessToken;
  assert((await request("/clientes", { token: employeeToken })).response.ok, "employee can read operational clients");
  assert((await request("/admin/usuarios", { token: employeeToken })).response.status === 403, "employee cannot manage staff");
  assert((await request("/admin/auditoria", { token: employeeToken })).response.status === 403, "employee cannot read audit log");

  const client = await request("/clientes", {
    method: "POST",
    body: { nome: "Cliente Smoke", cpf: "12345678901", telefone: "11999990000", email: "client-controller-smoke@example.test", senha: "ClientPass123" },
  });
  assert(client.response.status === 201, "public client registration still works");
  const clientId = client.data.id;
  const clientUpdated = await request(`/clientes/${clientId}`, {
    method: "PUT", token: employeeToken,
    body: { nome: "Cliente atualizado", cpf: "12345678901", telefone: "11988880000", email: "client-controller-smoke@example.test", senha: "" },
  });
  assert(clientUpdated.response.ok && clientUpdated.data.nome === "Cliente atualizado", "client profile update saves the CPF field correctly");

  const container = await request("/conteineres", {
    method: "POST", token: employeeToken,
    body: { numeroConteiner: `CTR-${Date.now()}`, tipo: "40 HC", situacao: "VAZIO" },
  });
  assert(container.response.status === 201, "employee can create a container");
  const containerId = container.data.id;
  const containerUpdated = await request(`/conteineres/${containerId}`, {
    method: "PUT", token: employeeToken,
    body: { numeroConteiner: container.data.numeroConteiner, tipo: "20 DRY", situacao: "CHEIO" },
  });
  assert(containerUpdated.response.ok && containerUpdated.data.tipo === "20 DRY", "employee can update a container");
  assert((await request(`/conteineres/${containerId}`, { method: "DELETE", token: employeeToken })).response.status === 403, "employee cannot delete a container");

  const supervisor = await request("/admin/usuarios", {
    method: "POST", token: adminToken,
    body: { nome: "Supervisor Smoke", email: "supervisor-controller-smoke@example.test", senha: "Supervisor123", cargo: "SUPERVISOR" },
  });
  assert(supervisor.response.status === 201, "admin can create a supervisor role");
  const supervisorLogin = await request("/admin/login", {
    method: "POST", body: { email: "supervisor-controller-smoke@example.test", senha: "Supervisor123" },
  });
  assert(supervisorLogin.response.ok, "supervisor can log in");
  const supervisorToken = supervisorLogin.data.accessToken;
  const deletedContainer = await request(`/conteineres/${containerId}`, { method: "DELETE", token: supervisorToken });
  assert(deletedContainer.response.status === 204, "supervisor can delete an operational container");

  const publicAppointment = await request("/agendamentos", {
    method: "POST",
    body: { nome: "Cliente Agendamento", cpf: "10987654321", telefone: "11977770000", email: "appointment-controller-smoke@example.test", senha: "Appointment123", dataHora: new Date(Date.now() + 86400000).toISOString().slice(0, 16), confirmacao: true },
  });
  assert(publicAppointment.response.status === 201, "public appointment registration remains available");
  const accounts = await request("/agendamentos/usuarios", { token: supervisorToken });
  const account = accounts.data.find((item) => item.email === "appointment-controller-smoke@example.test");
  assert(!!account, "staff can select an existing appointment customer");
  const managedAppointment = await request("/agendamentos/gerenciamento", {
    method: "POST", token: supervisorToken,
    body: { usuarioId: account.id, telefone: "11966660000", dataHora: new Date(Date.now() + 172800000).toISOString().slice(0, 16), confirmado: false },
  });
  assert(managedAppointment.response.status === 201, "team can create a managed appointment without knowing customer password");
  const appointmentId = managedAppointment.data.id;
  const appointmentUpdated = await request(`/agendamentos/${appointmentId}`, {
    method: "PUT", token: supervisorToken,
    body: { usuarioId: account.id, telefone: "11955550000", dataHora: new Date(Date.now() + 259200000).toISOString().slice(0, 16), confirmado: true },
  });
  assert(appointmentUpdated.response.ok && appointmentUpdated.data.telefone === "11955550000", "team can update an appointment");
  assert((await request(`/agendamentos/${appointmentId}`, { method: "DELETE", token: supervisorToken })).response.status === 204, "supervisor can delete an appointment");

  const audit = await request("/admin/auditoria", { token: adminToken });
  assert(audit.response.ok && audit.data.some((event) => event.actorName === "Admin Controller Smoke"), "admin can view audit events identifying the actor");
  const sessions = await request("/admin/sessoes", { token: adminToken });
  assert(sessions.response.ok && sessions.data.some((session) => session.actorName === "Supervisor Smoke" && typeof session.durationSeconds === "number"), "admin can view session duration");
  console.log("Backend controller integration smoke passed.");
} catch (error) {
  console.error(error.stack || error);
  process.exitCode = 1;
} finally {
  try { execFileSync("taskkill", ["/PID", String(child.pid), "/T", "/F"], { stdio: "ignore" }); } catch {}
}
