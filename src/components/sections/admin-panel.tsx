"use client";

import { useEffect, useMemo, useState } from "react";
import {
  PenLine,
  Trash2,
  UserRound,
  Eye,
  EyeOff,
} from "lucide-react";

import {
  AdminGithubConfig,
  AdminOpenAiConfig,
  AdminRun,
  AdminUser,
  createAdminGithubConfig,
  createAdminOpenAiConfig,
  createAdminUser,
  deleteAdminGithubConfig,
  deleteAdminOpenAiConfig,
  deleteAdminRun,
  deleteAdminUser,
  fetchAdminGithubConfigs,
  fetchAdminOpenAiConfigs,
  fetchAdminRuns,
  fetchAdminUsers,
  updateAdminGithubConfig,
  updateAdminOpenAiConfig,
  updateAdminUser,
} from "@/lib/admin-api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";

type AdminTab = "users" | "github" | "openai" | "runs";

export function AdminPanel() {
  const { push } = useToast();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<AdminTab>("users");
  const [search, setSearch] = useState("");
  const [isBusy, setIsBusy] = useState(false);

  const [userForm, setUserForm] = useState({
    id: "",
    name: "",
    email: "",
    password: "",
    roleId: "1",
  });

  const [githubConfigs, setGithubConfigs] = useState<AdminGithubConfig[]>([]);
  const [openaiConfigs, setOpenaiConfigs] = useState<AdminOpenAiConfig[]>([]);
  const [runs, setRuns] = useState<AdminRun[]>([]);

  const [githubForm, setGithubForm] = useState({
    id: 0,
    name: "",
    owner: "",
    repo: "",
    token: "",
    isDefault: false,
  });
  const [openaiForm, setOpenaiForm] = useState({
    id: 0,
    name: "",
    apiKey: "",
    model: "",
    isDefault: false,
  });

  const [showGithubToken, setShowGithubToken] = useState(false);
  const [showOpenAiKey, setShowOpenAiKey] = useState(false);
  const [confirmDeleteUserId, setConfirmDeleteUserId] = useState<string | null>(null);
  const [confirmDeleteConfigId, setConfirmDeleteConfigId] = useState<number | null>(null);
  const [confirmDeleteOpenAiId, setConfirmDeleteOpenAiId] = useState<number | null>(null);
  const [confirmDeleteRunId, setConfirmDeleteRunId] = useState<number | null>(null);

  const selectedUser = users.find((user) => user.id === selectedUserId) || null;

  const filteredUsers = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return users;
    return users.filter((user) =>
      [user.name, user.email].some((value) =>
        value?.toLowerCase().includes(term)
      )
    );
  }, [search, users]);

  const loadUsers = async () => {
    try {
      const response = await fetchAdminUsers();
      setUsers(response.data);
      if (!selectedUserId && response.data.length) {
        setSelectedUserId(response.data[0].id);
      }
    } catch (error) {
      push({
        title: error instanceof Error ? error.message : "Failed to load users.",
        variant: "error",
      });
    }
  };

  const loadUserData = async (userId: string) => {
    try {
      const [githubResponse, openaiResponse, runsResponse] = await Promise.all([
        fetchAdminGithubConfigs(userId),
        fetchAdminOpenAiConfigs(userId),
        fetchAdminRuns(userId),
      ]);
      setGithubConfigs(githubResponse.data);
      setOpenaiConfigs(openaiResponse.data);
      setRuns(runsResponse.data);
    } catch (error) {
      push({
        title:
          error instanceof Error
            ? error.message
            : "Failed to load user data.",
        variant: "error",
      });
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    if (!selectedUserId) return;
    loadUserData(selectedUserId);
    const user = users.find((item) => item.id === selectedUserId);
    if (user) {
      setUserForm({
        id: user.id,
        name: user.name,
        email: user.email,
        password: "",
        roleId: String(user.roleId ?? 1),
      });
    }
    setGithubForm({ id: 0, name: "", owner: "", repo: "", token: "", isDefault: false });
    setOpenaiForm({ id: 0, name: "", apiKey: "", model: "", isDefault: false });
  }, [selectedUserId, users]);

  const handleUserSave = async () => {
    if (!userForm.name.trim() || !userForm.email.trim()) {
      push({ title: "Name and email are required.", variant: "error" });
      return;
    }
    setIsBusy(true);
    try {
      if (userForm.id) {
        await updateAdminUser(userForm.id, {
          name: userForm.name.trim(),
          email: userForm.email.trim(),
          roleId: Number(userForm.roleId),
          ...(userForm.password ? { password: userForm.password } : {}),
        });
        push({ title: "User updated.", variant: "success" });
      } else {
        if (!userForm.password) {
          push({ title: "Password is required for new users.", variant: "error" });
          return;
        }
        await createAdminUser({
          name: userForm.name.trim(),
          email: userForm.email.trim(),
          password: userForm.password,
          roleId: Number(userForm.roleId),
        });
        push({ title: "User created.", variant: "success" });
      }
      setUserForm({ id: "", name: "", email: "", password: "", roleId: "1" });
      await loadUsers();
    } catch (error) {
      push({
        title: error instanceof Error ? error.message : "Failed to save user.",
        variant: "error",
      });
    } finally {
      setIsBusy(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    setIsBusy(true);
    try {
      await deleteAdminUser(userId);
      push({ title: "User deleted.", variant: "success" });
      setSelectedUserId((prev) => (prev === userId ? null : prev));
      await loadUsers();
    } catch (error) {
      push({
        title: error instanceof Error ? error.message : "Failed to delete user.",
        variant: "error",
      });
    } finally {
      setIsBusy(false);
    }
  };

  const handleGithubSave = async () => {
    if (!selectedUserId) return;
    if (!githubForm.name.trim() || !githubForm.owner.trim() || !githubForm.repo.trim()) {
      push({ title: "Name, owner, and repo are required.", variant: "error" });
      return;
    }
    if (!githubForm.token.trim() && !githubForm.id) {
      push({ title: "Token is required.", variant: "error" });
      return;
    }
    setIsBusy(true);
    try {
      if (githubForm.id) {
        await updateAdminGithubConfig(githubForm.id, {
          name: githubForm.name.trim(),
          owner: githubForm.owner.trim(),
          repo: githubForm.repo.trim(),
          token: githubForm.token.trim() || undefined,
        });
        push({ title: "GitHub config updated.", variant: "success" });
      } else {
        await createAdminGithubConfig(selectedUserId, {
          name: githubForm.name.trim(),
          owner: githubForm.owner.trim(),
          repo: githubForm.repo.trim(),
          token: githubForm.token.trim(),
          isDefault: githubForm.isDefault,
        });
        push({ title: "GitHub config created.", variant: "success" });
      }
      setGithubForm({ id: 0, name: "", owner: "", repo: "", token: "", isDefault: false });
      await loadUserData(selectedUserId);
    } catch (error) {
      push({
        title:
          error instanceof Error ? error.message : "Failed to save GitHub config.",
        variant: "error",
      });
    } finally {
      setIsBusy(false);
    }
  };

  const handleOpenAiSave = async () => {
    if (!selectedUserId) return;
    if (!openaiForm.name.trim() || !openaiForm.model.trim()) {
      push({ title: "Name and model are required.", variant: "error" });
      return;
    }
    if (!openaiForm.apiKey.trim() && !openaiForm.id) {
      push({ title: "API key is required.", variant: "error" });
      return;
    }
    setIsBusy(true);
    try {
      if (openaiForm.id) {
        await updateAdminOpenAiConfig(openaiForm.id, {
          name: openaiForm.name.trim(),
          model: openaiForm.model.trim(),
          apiKey: openaiForm.apiKey.trim() || undefined,
        });
        push({ title: "OpenAI config updated.", variant: "success" });
      } else {
        await createAdminOpenAiConfig(selectedUserId, {
          name: openaiForm.name.trim(),
          apiKey: openaiForm.apiKey.trim(),
          model: openaiForm.model.trim(),
          isDefault: openaiForm.isDefault,
        });
        push({ title: "OpenAI config created.", variant: "success" });
      }
      setOpenaiForm({ id: 0, name: "", apiKey: "", model: "", isDefault: false });
      await loadUserData(selectedUserId);
    } catch (error) {
      push({
        title:
          error instanceof Error ? error.message : "Failed to save OpenAI config.",
        variant: "error",
      });
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[0.9fr_1.6fr]">
      <Card className="border-[#2a2f55] bg-[#111325]/80">
        <CardHeader>
          <CardTitle>User directory</CardTitle>
          <CardDescription>Search and manage all registered users.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Search by name or email"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <div className="max-h-[520px] space-y-2 overflow-y-auto pr-2">
            {filteredUsers.map((user) => (
              <button
                key={user.id}
                type="button"
                onClick={() => setSelectedUserId(user.id)}
                className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition ${
                  user.id === selectedUserId
                    ? "border-violet-500/60 bg-violet-500/10"
                    : "border-[#2a2f55] bg-[#0f1228] hover:border-violet-500/40"
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">{user.name}</span>
                    {user.roleId === 2 && (
                      <Badge variant="success">Admin</Badge>
                    )}
                  </div>
                  <span className="text-xs text-slate-400">{user.email}</span>
                </div>
                <UserRound className="h-4 w-4 text-slate-400" />
              </button>
            ))}
            {filteredUsers.length === 0 && (
              <p className="text-sm text-slate-400">No users found.</p>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <Card className="border-[#2a2f55] bg-[#111325]/80">
          <CardHeader>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <CardTitle>{userForm.id ? "Edit user" : "Add user"}</CardTitle>
                <CardDescription>Update user profile or create a new one.</CardDescription>
              </div>
              {userForm.id && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-rose-300 hover:text-rose-200"
                  onClick={() => setConfirmDeleteUserId(userForm.id)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete user
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <Input
                placeholder="Full name"
                value={userForm.name}
                onChange={(event) =>
                  setUserForm((prev) => ({ ...prev, name: event.target.value }))
                }
              />
              <Input
                placeholder="Email"
                value={userForm.email}
                onChange={(event) =>
                  setUserForm((prev) => ({ ...prev, email: event.target.value }))
                }
              />
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <Input
                placeholder={userForm.id ? "New password (optional)" : "Password"}
                type="password"
                value={userForm.password}
                onChange={(event) =>
                  setUserForm((prev) => ({ ...prev, password: event.target.value }))
                }
              />
              <select
                className="h-10 rounded-xl border border-[#2a2f55] bg-[#111633] px-3 text-sm text-slate-100"
                value={userForm.roleId}
                onChange={(event) =>
                  setUserForm((prev) => ({ ...prev, roleId: event.target.value }))
                }
              >
                <option value="1">User</option>
                <option value="2">Admin</option>
              </select>
            </div>
            <div className="flex flex-wrap justify-end gap-2">
              <Button
                variant="secondary"
                onClick={() => {
                  setUserForm({ id: "", name: "", email: "", password: "", roleId: "1" });
                  setSelectedUserId(null);
                }}
              >
                Clear
              </Button>
              <Button onClick={handleUserSave} disabled={isBusy}>
                {userForm.id ? "Update user" : "Create user"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#2a2f55] bg-[#111325]/80">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <CardTitle>User resources</CardTitle>
              <div className="flex flex-wrap items-center gap-2">
                {(["github", "openai", "runs"] as AdminTab[]).map((tab) => (
                  <Button
                    key={tab}
                    variant={activeTab === tab ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setActiveTab(tab)}
                  >
                    {tab === "github" ? "GitHub" : tab === "openai" ? "OpenAI" : "Runs"}
                  </Button>
                ))}
              </div>
            </div>
            <CardDescription>
              Manage saved credentials and history for the selected user.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {!selectedUser && (
              <p className="text-sm text-slate-400">Select a user to manage resources.</p>
            )}

            {selectedUser && activeTab === "github" && (
              <div className="space-y-4">
                <div className="grid gap-3 md:grid-cols-2">
                  <Input
                    placeholder="Profile name"
                    value={githubForm.name}
                    onChange={(event) =>
                      setGithubForm((prev) => ({ ...prev, name: event.target.value }))
                    }
                  />
                  <Input
                    placeholder="Owner"
                    value={githubForm.owner}
                    onChange={(event) =>
                      setGithubForm((prev) => ({ ...prev, owner: event.target.value }))
                    }
                  />
                  <Input
                    placeholder="Repo"
                    value={githubForm.repo}
                    onChange={(event) =>
                      setGithubForm((prev) => ({ ...prev, repo: event.target.value }))
                    }
                  />
                  <div className="relative">
                    <Input
                      type={showGithubToken ? "text" : "password"}
                      placeholder="Token"
                      value={githubForm.token}
                      onChange={(event) =>
                        setGithubForm((prev) => ({ ...prev, token: event.target.value }))
                      }
                    />
                    <button
                      type="button"
                      onClick={() => setShowGithubToken((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-200"
                    >
                      {showGithubToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="flex flex-wrap justify-end gap-2">
                  <Button
                    variant="secondary"
                    onClick={() =>
                      setGithubForm({ id: 0, name: "", owner: "", repo: "", token: "", isDefault: false })
                    }
                  >
                    Clear
                  </Button>
                  <Button onClick={handleGithubSave} disabled={isBusy}>
                    {githubForm.id ? "Update config" : "Add config"}
                  </Button>
                </div>
                <div className="space-y-2">
                  {githubConfigs.map((config) => (
                    <div
                      key={config.id}
                      className="flex items-center justify-between rounded-2xl border border-[#2a2f55] bg-[#0f1228] px-4 py-3"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold">{config.name}</span>
                          {config.isDefault && <Badge variant="success">Default</Badge>}
                        </div>
                        <span className="text-xs text-slate-400">
                          {config.owner}/{config.repo}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setGithubForm({
                              id: config.id,
                              name: config.name,
                              owner: config.owner,
                              repo: config.repo,
                              token: config.token,
                              isDefault: config.isDefault,
                            })
                          }
                        >
                          <PenLine className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-rose-300 hover:text-rose-200"
                          onClick={() => setConfirmDeleteConfigId(config.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {githubConfigs.length === 0 && (
                    <p className="text-sm text-slate-400">No GitHub configs.</p>
                  )}
                </div>
              </div>
            )}

            {selectedUser && activeTab === "openai" && (
              <div className="space-y-4">
                <div className="grid gap-3 md:grid-cols-2">
                  <Input
                    placeholder="Profile name"
                    value={openaiForm.name}
                    onChange={(event) =>
                      setOpenaiForm((prev) => ({ ...prev, name: event.target.value }))
                    }
                  />
                  <Input
                    placeholder="Model"
                    value={openaiForm.model}
                    onChange={(event) =>
                      setOpenaiForm((prev) => ({ ...prev, model: event.target.value }))
                    }
                  />
                  <div className="relative md:col-span-2">
                    <Input
                      type={showOpenAiKey ? "text" : "password"}
                      placeholder="API key"
                      value={openaiForm.apiKey}
                      onChange={(event) =>
                        setOpenaiForm((prev) => ({ ...prev, apiKey: event.target.value }))
                      }
                    />
                    <button
                      type="button"
                      onClick={() => setShowOpenAiKey((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-200"
                    >
                      {showOpenAiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="flex flex-wrap justify-end gap-2">
                  <Button
                    variant="secondary"
                    onClick={() =>
                      setOpenaiForm({ id: 0, name: "", apiKey: "", model: "", isDefault: false })
                    }
                  >
                    Clear
                  </Button>
                  <Button onClick={handleOpenAiSave} disabled={isBusy}>
                    {openaiForm.id ? "Update config" : "Add config"}
                  </Button>
                </div>
                <div className="space-y-2">
                  {openaiConfigs.map((config) => (
                    <div
                      key={config.id}
                      className="flex items-center justify-between rounded-2xl border border-[#2a2f55] bg-[#0f1228] px-4 py-3"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold">{config.name}</span>
                          {config.isDefault && <Badge variant="success">Default</Badge>}
                        </div>
                        <span className="text-xs text-slate-400">{config.model}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setOpenaiForm({
                              id: config.id,
                              name: config.name,
                              apiKey: config.apiKey,
                              model: config.model,
                              isDefault: config.isDefault,
                            })
                          }
                        >
                          <PenLine className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-rose-300 hover:text-rose-200"
                          onClick={() => setConfirmDeleteOpenAiId(config.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {openaiConfigs.length === 0 && (
                    <p className="text-sm text-slate-400">No OpenAI configs.</p>
                  )}
                </div>
              </div>
            )}

            {selectedUser && activeTab === "runs" && (
              <div className="space-y-3">
                {runs.map((run) => (
                  <div
                    key={run.id}
                    className="flex items-center justify-between rounded-2xl border border-[#2a2f55] bg-[#0f1228] px-4 py-3"
                  >
                    <div>
                      <div className="text-sm font-semibold text-slate-100">
                        {run.jobDescription.slice(0, 50)}...
                      </div>
                      <div className="text-xs text-slate-400">
                        {new Date(run.createdAt).toLocaleString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={run.status === "ready" ? "success" : "warning"}>
                        {run.status}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-rose-300 hover:text-rose-200"
                        onClick={() => setConfirmDeleteRunId(run.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {runs.length === 0 && (
                  <p className="text-sm text-slate-400">No runs found.</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <ConfirmDialog
        open={confirmDeleteUserId !== null}
        title="Delete this user?"
        description="This removes their templates, prompts, configs, and history."
        confirmLabel="Delete"
        onCancel={() => setConfirmDeleteUserId(null)}
        onConfirm={() => {
          if (confirmDeleteUserId) {
            handleDeleteUser(confirmDeleteUserId);
          }
          setConfirmDeleteUserId(null);
        }}
      />
      <ConfirmDialog
        open={confirmDeleteConfigId !== null}
        title="Delete this GitHub config?"
        description="This action cannot be undone."
        confirmLabel="Delete"
        onCancel={() => setConfirmDeleteConfigId(null)}
        onConfirm={async () => {
          if (confirmDeleteConfigId) {
            await deleteAdminGithubConfig(confirmDeleteConfigId);
            if (selectedUserId) {
              await loadUserData(selectedUserId);
            }
            push({ title: "GitHub config deleted.", variant: "success" });
          }
          setConfirmDeleteConfigId(null);
        }}
      />
      <ConfirmDialog
        open={confirmDeleteOpenAiId !== null}
        title="Delete this OpenAI config?"
        description="This action cannot be undone."
        confirmLabel="Delete"
        onCancel={() => setConfirmDeleteOpenAiId(null)}
        onConfirm={async () => {
          if (confirmDeleteOpenAiId) {
            await deleteAdminOpenAiConfig(confirmDeleteOpenAiId);
            if (selectedUserId) {
              await loadUserData(selectedUserId);
            }
            push({ title: "OpenAI config deleted.", variant: "success" });
          }
          setConfirmDeleteOpenAiId(null);
        }}
      />
      <ConfirmDialog
        open={confirmDeleteRunId !== null}
        title="Delete this run?"
        description="This action cannot be undone."
        confirmLabel="Delete"
        onCancel={() => setConfirmDeleteRunId(null)}
        onConfirm={async () => {
          if (confirmDeleteRunId) {
            await deleteAdminRun(confirmDeleteRunId);
            if (selectedUserId) {
              await loadUserData(selectedUserId);
            }
            push({ title: "Run deleted.", variant: "success" });
          }
          setConfirmDeleteRunId(null);
        }}
      />
    </div>
  );
}
