type AdminUser = {
  id: string;
  name: string;
  email: string;
  roleId: number;
  createdAt: string;
};

type AdminGithubConfig = {
  id: number;
  userId: string;
  name: string;
  owner: string;
  repo: string;
  token: string;
  isDefault: boolean;
  updatedAt: string;
};

type AdminOpenAiConfig = {
  id: number;
  userId: string;
  name: string;
  apiKey: string;
  model: string;
  isDefault: boolean;
  updatedAt: string;
};

type AdminRun = {
  id: number;
  userId: string;
  jobDescription: string;
  outputUrl?: string | null;
  overleafUrl?: string | null;
  status: string;
  createdAt: string;
};

async function handleJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Request failed.");
  }
  return response.json() as Promise<T>;
}

export async function fetchAdminUsers() {
  return handleJson<{ data: AdminUser[] }>(await fetch("/api/admin/users", { cache: "no-store" }));
}

export async function createAdminUser(payload: {
  name: string;
  email: string;
  password: string;
  roleId: number;
}) {
  return handleJson<{ data: AdminUser }>(
    await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
  );
}

export async function updateAdminUser(id: string, payload: {
  name: string;
  email: string;
  password?: string;
  roleId?: number;
}) {
  return handleJson<{ data: AdminUser }>(
    await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
  );
}

export async function deleteAdminUser(id: string) {
  return handleJson<{ data: AdminUser }>(
    await fetch(`/api/admin/users/${id}`, { method: "DELETE" })
  );
}

export async function fetchAdminGithubConfigs(userId: string) {
  return handleJson<{ data: AdminGithubConfig[] }>(
    await fetch(`/api/admin/users/${userId}/github-configs`, { cache: "no-store" })
  );
}

export async function createAdminGithubConfig(
  userId: string,
  payload: { name: string; owner: string; repo: string; token: string; isDefault?: boolean }
) {
  return handleJson<{ data: AdminGithubConfig }>(
    await fetch(`/api/admin/users/${userId}/github-configs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
  );
}

export async function updateAdminGithubConfig(
  id: number,
  payload: { name: string; owner: string; repo: string; token?: string }
) {
  return handleJson<{ data: AdminGithubConfig }>(
    await fetch(`/api/admin/github-configs/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
  );
}

export async function deleteAdminGithubConfig(id: number) {
  return handleJson<{ data: AdminGithubConfig }>(
    await fetch(`/api/admin/github-configs/${id}`, { method: "DELETE" })
  );
}

export async function fetchAdminOpenAiConfigs(userId: string) {
  return handleJson<{ data: AdminOpenAiConfig[] }>(
    await fetch(`/api/admin/users/${userId}/openai-configs`, { cache: "no-store" })
  );
}

export async function createAdminOpenAiConfig(
  userId: string,
  payload: { name: string; apiKey: string; model: string; isDefault?: boolean }
) {
  return handleJson<{ data: AdminOpenAiConfig }>(
    await fetch(`/api/admin/users/${userId}/openai-configs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
  );
}

export async function updateAdminOpenAiConfig(
  id: number,
  payload: { name: string; apiKey?: string; model: string }
) {
  return handleJson<{ data: AdminOpenAiConfig }>(
    await fetch(`/api/admin/openai-configs/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
  );
}

export async function deleteAdminOpenAiConfig(id: number) {
  return handleJson<{ data: AdminOpenAiConfig }>(
    await fetch(`/api/admin/openai-configs/${id}`, { method: "DELETE" })
  );
}

export async function fetchAdminRuns(userId: string) {
  return handleJson<{ data: AdminRun[] }>(
    await fetch(`/api/admin/users/${userId}/runs`, { cache: "no-store" })
  );
}

export async function deleteAdminRun(id: number) {
  return handleJson<{ data: AdminRun }>(
    await fetch(`/api/admin/runs/${id}`, { method: "DELETE" })
  );
}

export type {
  AdminUser,
  AdminGithubConfig,
  AdminOpenAiConfig,
  AdminRun,
};
