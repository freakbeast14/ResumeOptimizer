"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, PenLine, Trash2, Bug } from "lucide-react";

import {
  createOpenAiConfig,
  deleteOpenAiConfig,
  fetchOpenAiConfigs,
  setDefaultOpenAiConfig,
  updateOpenAiConfig,
  OpenAiConfigRecord,
} from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function SettingsOpenAI() {
  const [configs, setConfigs] = useState<OpenAiConfigRecord[]>([]);
  const [name, setName] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("");
  const [isDefault, setIsDefault] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [originalName, setOriginalName] = useState("");
  const [originalModel, setOriginalModel] = useState("");
  const [originalDefault, setOriginalDefault] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasKey, setHasKey] = useState(false);
  const { push } = useToast();

  const loadConfigs = async () => {
    try {
      const response = await fetchOpenAiConfigs();
      setConfigs(response.data);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load configs.";
      setError(message);
      push({ title: message, variant: "error" });
    }
  };

  useEffect(() => {
    loadConfigs();
  }, []);

  const handleSave = async () => {
    setError(null);
    if (!name.trim() || !model.trim()) {
      setError("Name and model are required.");
      return;
    }
    if (!apiKey.trim() && !hasKey) {
      setError("API key is required.");
      return;
    }
    setIsBusy(true);
    try {
      if (editingId) {
        await updateOpenAiConfig(editingId, {
          name: name.trim(),
          apiKey: apiKey.trim(),
          model: model.trim(),
        });
        push({ title: "OpenAI profile updated.", variant: "success" });
      } else {
        await createOpenAiConfig({
          name: name.trim(),
          apiKey: apiKey.trim(),
          model: model.trim(),
          isDefault,
        });
        push({ title: "OpenAI profile created.", variant: "success" });
      }
      setName("");
      setApiKey("");
      setModel("");
      setIsDefault(false);
      setEditingId(null);
      setHasKey(false);
      await loadConfigs();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save config.";
      setError(message);
      push({ title: message, variant: "error" });
    } finally {
      setIsBusy(false);
    }
  };

  const handleEdit = (config: OpenAiConfigRecord) => {
    setEditingId(config.id);
    setName(config.name);
    setApiKey("");
    setHasKey(true);
    setModel(config.model);
    setIsDefault(config.isDefault);
    setOriginalName(config.name);
    setOriginalModel(config.model);
    setOriginalDefault(config.isDefault);
  };

  const handleCancel = () => {
    setEditingId(null);
    setName("");
    setApiKey("");
    setHasKey(false);
    setModel("");
    setIsDefault(false);
    setOriginalName("");
    setOriginalModel("");
    setOriginalDefault(false);
    setError(null);
  };

  const handleDelete = async (id: number) => {
    setError(null);
    const target = configs.find((item) => item.id === id);
    if (target?.isDefault && configs.length > 1) {
      const message = "Set another default before deleting this profile.";
      setError(message);
      push({ title: message, variant: "error" });
      return;
    }
    setIsBusy(true);
    try {
      await deleteOpenAiConfig(id);
      if (editingId === id) {
        handleCancel();
      }
      await loadConfigs();
      push({ title: "OpenAI profile deleted.", variant: "success" });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to delete config.";
      setError(message);
      push({ title: message, variant: "error" });
    } finally {
      setIsBusy(false);
    }
  };

  const handleSetDefault = async (id: number) => {
    setError(null);
    setIsBusy(true);
    try {
      await setDefaultOpenAiConfig(id);
      await loadConfigs();
      push({ title: "Default OpenAI profile updated.", variant: "success" });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to set default.";
      setError(message);
      push({ title: message, variant: "error" });
    } finally {
      setIsBusy(false);
    }
  };

  const handleTest = async (config?: OpenAiConfigRecord) => {
    setError(null);
    if (!config) {
      if (!name.trim() || !model.trim() || !apiKey.trim()) {
        const message = "Fill name, model, and API key before testing.";
        setError(message);
        push({ title: message, variant: "error" });
        return;
      }
    }

    setIsBusy(true);
    try {
      const response = await fetch("/api/openai/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          config
            ? { configId: config.id }
            : {
                apiKey: apiKey.trim(),
              }
        ),
      });
      const json = (await response.json()) as { ok?: boolean; error?: string };

      if (!response.ok) {
        const message = json.error || "Connection failed.";
        push({ title: message, variant: "error" });
        return;
      }

      push({ title: "OpenAI connection successful.", variant: "success" });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Connection failed.";
      push({ title: message, variant: "error" });
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div className="grid w-full gap-6 lg:grid-cols-[0.85fr_1.15fr]">
      <Card className="border-[#2a2f55] bg-[#111325]/80">
        <CardHeader>
          <CardTitle>OpenAI profiles</CardTitle>
          <CardDescription>
            Store multiple OpenAI keys and models with a default profile.
          </CardDescription>
        </CardHeader>
        <CardContent className="max-h-[520px] space-y-4 overflow-y-auto pr-2">
          {configs.map((config) => (
            <div
              key={config.id}
              className="flex items-center justify-between rounded-2xl border border-[#2a2f55] bg-[#0f1228] px-4 py-3"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">{config.name}</span>
                </div>
                <span className="text-xs text-slate-400">{config.model}</span>
              </div>
              <div className="flex items-center gap-1">
                {config.isDefault ? (
                  <Badge variant="success" className="mr-2">Default</Badge>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSetDefault(config.id)}
                    aria-label="Set as default"
                    title="Set as default"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEdit(config)}
                  aria-label="Edit config"
                  title="Edit"
                >
                  <PenLine className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setConfirmDeleteId(config.id)}
                  aria-label="Delete config"
                  title="Delete"
                  disabled={isBusy}
                  className="text-rose-300 hover:text-rose-200"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleTest(config)}
                  aria-label="Test connection"
                  title="Test connection"
                  disabled={isBusy}
                >
                  <Bug className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
          {configs.length === 0 && (
            <p className="text-sm text-slate-400">No OpenAI profiles saved.</p>
          )}
        </CardContent>
      </Card>
      <Card className="border-[#2a2f55] bg-[#111325]/80">
        <CardHeader className="space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <CardTitle>
                {editingId ? "Edit OpenAI profile" : "Add OpenAI profile"}
              </CardTitle>
              <CardDescription>
                Save API key and default model for this profile.
              </CardDescription>
            </div>
            <label className="flex items-center gap-3 text-sm text-slate-300">
              <span>Set as default</span>
              <span className="relative inline-flex items-center">
                <input
                  type="checkbox"
                  className="peer sr-only"
                  checked={isDefault}
                  onChange={(event) => setIsDefault(event.target.checked)}
                  disabled={Boolean(editingId && isDefault)}
                />
                <span className="h-6 w-11 rounded-full border border-[#2a2f55] bg-[#0f1228] transition peer-checked:bg-indigo-500/70 peer-disabled:opacity-50" />
                <span className="absolute left-1 top-1 h-4 w-4 rounded-full bg-white transition peer-checked:translate-x-5 peer-disabled:opacity-60" />
              </span>
            </label>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Profile name"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
          <Input
            type="password"
            placeholder="API key"
            value={apiKey || (hasKey ? "********" : "")}
            onFocus={() => {
              if (!apiKey && hasKey) {
                setApiKey("");
              }
            }}
            onChange={(event) => setApiKey(event.target.value)}
          />
          <Input
            placeholder="Model (e.g., gpt-4o-mini)"
            value={model}
            onChange={(event) => setModel(event.target.value)}
          />
          {error && <p className="text-sm text-rose-400">{error}</p>}
          <div className="flex flex-wrap justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                if (editingId) {
                  const existing = configs.find((item) => item.id === editingId);
                  if (existing) {
                    handleTest(existing);
                  } else {
                    push({
                      title: "Select a saved profile to test.",
                      variant: "error",
                    });
                  }
                } else {
                  handleTest();
                }
              }}
              disabled={
                isBusy ||
                (!editingId &&
                  (!name.trim() || !model.trim() || !apiKey.trim()))
              }
            >
              Test connection
            </Button>
            <Button
              onClick={handleSave}
              disabled={
                isBusy ||
                !name.trim() ||
                !model.trim() ||
                (!apiKey.trim() && !hasKey) ||
                (editingId
                  ? name.trim() === originalName.trim() &&
                    model.trim() === originalModel.trim() &&
                    !apiKey.trim() &&
                    isDefault === originalDefault
                  : false)
              }
            >
              {editingId ? "Update" : "Save"}
            </Button>
            {editingId ? (
              <Button variant="secondary" onClick={handleCancel} disabled={isBusy}>
                Cancel
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>
      <ConfirmDialog
        open={confirmDeleteId !== null}
        title="Delete this OpenAI profile?"
        description="This action cannot be undone."
        confirmLabel="Delete"
        onCancel={() => setConfirmDeleteId(null)}
        onConfirm={() => {
          if (confirmDeleteId !== null) {
            handleDelete(confirmDeleteId);
          }
          setConfirmDeleteId(null);
        }}
      />
    </div>
  );
}
