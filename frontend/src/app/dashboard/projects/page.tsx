"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Layers,
  Plus,
  Copy,
  Check,
  FolderCheck,
  Terminal,
  Code2,
  Globe,
  Key,
  HelpCircle,
  AlertCircle,
  Pencil,
  Trash2,
  X,
  AlertTriangle,
  Loader2,
  Sparkles,
  SlidersHorizontal,
  RotateCw,
  Shield,
  Lock,
  Server,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";

interface ProjectData {
  id: string;
  name: string;
  writeKey: string;
  allowedOrigins: string[];
  isActive: boolean;
  createdAt?: string;
}

interface ProjectApiKey {
  id: string;
  project_id: string;
  key_prefix: string;
  name: string;
  scopes: string;
  is_active: number | boolean;
  created_at: string;
  last_used_at?: string | null;
}

interface FrameworkSnippet {
  id: string;
  name: string;
  fileTarget: string;
  getCode: (projectId: string, writeKey: string, isAutoCapture: boolean) => string;
  note?: string;
}

const FRAMEWORK_SNIPPETS: FrameworkSnippet[] = [
  {
    id: "vite",
    name: "React (Vite)",
    fileTarget: "index.html (di dalam tag <head>)",
    getCode: (pid, key, auto) => `<script
  defer
  data-project-id="${pid}"
  data-write-key="${key}"
  data-auto-capture="${auto ? 'true' : 'false'}"
  src="https://firenalytics.vercel.app/tracker.js">
</script>`,
    note: "Sisipkan di dalam tag <head> pada index.html. Otomatis mendukung localhost:5173.",
  },
  {
    id: "next-app",
    name: "Next.js (App Router)",
    fileTarget: "app/layout.tsx atau src/app/layout.tsx",
    getCode: (pid, key, auto) => `import Script from 'next/script';

<Script
  defer
  data-project-id="${pid}"
  data-write-key="${key}"
  data-auto-capture="${auto ? 'true' : 'false'}"
  src="https://firenalytics.vercel.app/tracker.js"
  strategy="afterInteractive"
/>`,
    note: 'Sisipkan di dalam RootLayout. strategy="afterInteractive" menjaga kecepatan First Contentful Paint.',
  },
  {
    id: "html",
    name: "HTML / PHP / WordPress",
    fileTarget: "index.html / header.php / footer.php",
    getCode: (pid, key, auto) => `<script
  defer
  data-project-id="${pid}"
  data-write-key="${key}"
  data-auto-capture="${auto ? 'true' : 'false'}"
  src="https://firenalytics.vercel.app/tracker.js">
</script>`,
    note: "Sisipkan sebelum </head> atau sebelum </body> (mendukung WordPress, Webflow, Shopify, Laravel).",
  },
  {
    id: "vue",
    name: "Vue / Nuxt 3",
    fileTarget: "index.html (Vue) atau nuxt.config.ts (Nuxt)",
    getCode: (pid, key, auto) => `<script
  defer
  data-project-id="${pid}"
  data-write-key="${key}"
  data-auto-capture="${auto ? 'true' : 'false'}"
  src="https://firenalytics.vercel.app/tracker.js">
</script>`,
    note: "Untuk Nuxt 3, sisipkan konfigurasi script di properti app.head.script pada nuxt.config.ts.",
  },
  {
    id: "astro",
    name: "Astro",
    fileTarget: "src/layouts/Layout.astro (di dalam <head>)",
    getCode: (pid, key, auto) => `<script
  defer
  data-project-id="${pid}"
  data-write-key="${key}"
  data-auto-capture="${auto ? 'true' : 'false'}"
  src="https://firenalytics.vercel.app/tracker.js"
></script>`,
    note: "Sisipkan di dalam tag <head> pada berkas Layout.astro utama Anda.",
  },
];

export default function ProjectsPage() {
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [selectedProject, setSelectedProject] = useState<ProjectData | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [selectedFramework, setSelectedFramework] = useState(
    FRAMEWORK_SNIPPETS[0].id,
  );
  const [trackingMode, setTrackingMode] = useState<"smart" | "manual">("smart");

  // Form State untuk Tambah Project Baru
  const [projectName, setProjectName] = useState("");
  const [projectDomain, setProjectDomain] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Fetch daftar project milik user langsung dari D1
  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/track/projects", {
        credentials: "include",
        cache: "no-store",
      });
      if (res.ok) {
        const json = await res.json();
        const list: ProjectData[] = json.data || [];
        setProjects(list);
        if (list.length > 0 && !selectedProject) {
          setSelectedProject(list[0]);
        }
      }
    } catch (err) {
      console.warn("[ProjectsPage] Failed to fetch projects:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedProject]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // Handle pembuatan project baru
  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName.trim() || !projectDomain.trim()) {
      setMessage({
        type: "error",
        text: "Nama project dan domain wajib diisi!",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      setMessage(null);

      const res = await fetch("/api/track/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: projectName.trim(),
          domain: projectDomain.trim(),
        }),
      });

      const json = await res.json();

      if (res.ok && json.success) {
        setMessage({
          type: "success",
          text: `Project "${projectName}" berhasil didaftarkan!`,
        });
        setProjectName("");
        setProjectDomain("");
        const newProj = json.data;
        setProjects((prev) => [newProj, ...prev]);
        setSelectedProject(newProj);
      } else {
        setMessage({
          type: "error",
          text: json.error || "Gagal membuat project",
        });
      }
    } catch (err: any) {
      setMessage({
        type: "error",
        text: err.message || "Terjadi kesalahan jaringan",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Edit State & Handlers
  const [editingProject, setEditingProject] = useState<ProjectData | null>(null);
  const [editName, setEditName] = useState("");
  const [editDomain, setEditDomain] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  // Delete State & Handlers
  const [deletingProject, setDeletingProject] = useState<ProjectData | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleStartEdit = (proj: ProjectData) => {
    setEditingProject(proj);
    setEditName(proj.name);
    setEditDomain(proj.allowedOrigins.join(", "));
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProject) return;

    try {
      setIsUpdating(true);
      const res = await fetch(`/api/track/projects/${editingProject.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: editName.trim(),
          domain: editDomain.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setMessage({
          type: "success",
          text: `Project "${editName}" berhasil diperbarui!`,
        });
        setEditingProject(null);
        await fetchProjects();
      } else {
        setMessage({
          type: "error",
          text: data.error || "Gagal memperbarui project",
        });
      }
    } catch (err: any) {
      setMessage({
        type: "error",
        text: err.message || "Gagal menghubungi server",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingProject) return;

    try {
      setIsDeleting(true);
      const res = await fetch(`/api/track/projects/${deletingProject.id}`, {
        method: "DELETE",
        credentials: "include",
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setMessage({
          type: "success",
          text: `Project "${deletingProject.name}" berhasil dihapus.`,
        });
        if (selectedProject?.id === deletingProject.id) {
          setSelectedProject(null);
        }
        setDeletingProject(null);
        await fetchProjects();
      } else {
        setMessage({
          type: "error",
          text: data.error || "Gagal menghapus project",
        });
      }
    } catch (err: any) {
      setMessage({
        type: "error",
        text: err.message || "Gagal menghubungi server",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // State & Handlers: Secret API Keys (Headless API Access)
  const [apiKeys, setApiKeys] = useState<ProjectApiKey[]>([]);
  const [loadingKeys, setLoadingKeys] = useState(false);
  const [isCreatingKey, setIsCreatingKey] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [showCreateKeyModal, setShowCreateKeyModal] = useState(false);
  const [createdKeyData, setCreatedKeyData] = useState<{ id: string; name: string; rawKey: string; keyPrefix: string } | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [deletingKeyId, setDeletingKeyId] = useState<string | null>(null);

  const fetchApiKeys = useCallback(async (projId: string) => {
    try {
      setLoadingKeys(true);
      const res = await fetch(`/api/track/projects/${projId}/keys`, {
        credentials: "include",
        cache: "no-store",
      });
      if (res.ok) {
        const json = await res.json();
        setApiKeys(json.data || []);
      } else {
        setApiKeys([]);
      }
    } catch {
      setApiKeys([]);
    } finally {
      setLoadingKeys(false);
    }
  }, []);

  useEffect(() => {
    if (selectedProject?.id) {
      fetchApiKeys(selectedProject.id);
    } else {
      setApiKeys([]);
    }
  }, [selectedProject?.id, fetchApiKeys]);

  const handleCreateApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject) return;
    try {
      setIsCreatingKey(true);
      const res = await fetch(`/api/track/projects/${selectedProject.id}/keys`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: newKeyName.trim() || "Secret Key" }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setCreatedKeyData(json.key);
        setShowCreateKeyModal(false);
        setNewKeyName("");
        await fetchApiKeys(selectedProject.id);
      } else {
        setMessage({ type: "error", text: json.error || "Gagal membuat Secret Key" });
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Gagal menghubungi server" });
    } finally {
      setIsCreatingKey(false);
    }
  };

  const handleDeleteApiKey = async (keyId: string) => {
    if (!selectedProject) return;
    try {
      setDeletingKeyId(keyId);
      const res = await fetch(`/api/track/projects/${selectedProject.id}/keys/${keyId}`, {
        method: "DELETE",
        credentials: "include",
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setMessage({ type: "success", text: "Secret API Key berhasil dicabut/dihapus." });
        await fetchApiKeys(selectedProject.id);
      } else {
        setMessage({ type: "error", text: json.error || "Gagal menghapus API Key" });
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Gagal menghubungi server" });
    } finally {
      setDeletingKeyId(null);
    }
  };

  const activeSnippet =
    FRAMEWORK_SNIPPETS.find((f) => f.id === selectedFramework) ||
    FRAMEWORK_SNIPPETS[0];
  const currentPid = selectedProject?.id || "PROJECT_ID_ANDA";
  const currentKey = selectedProject?.writeKey || "WRITE_KEY_ANDA";
  const displayCode = activeSnippet.getCode(
    currentPid,
    currentKey,
    trackingMode === "smart"
  );

  const copyToClipboard = () => {
    navigator.clipboard.writeText(displayCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Unified Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-zinc-100 border border-zinc-200 text-zinc-900 flex items-center justify-center shrink-0">
              <Layers className="w-4 h-4" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900">
              Manajemen Project &amp; Pemasangan Script
            </h1>
          </div>
          <p className="text-xs text-zinc-500 leading-relaxed pl-10.5">
            Daftarkan website baru Anda dan dapatkan panduan kode siap pakai untuk framework apa pun.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            type="button"
            onClick={fetchProjects}
            disabled={loading}
            className="h-9 px-3.5 text-xs bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 text-white font-medium rounded-lg transition-all cursor-pointer flex items-center gap-1.5 shadow-xs active:scale-[0.98]"
            title="Segarkan daftar project"
          >
            <RotateCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>{loading ? "Memuat..." : "Segarkan Data"}</span>
          </button>
        </div>
      </div>

      {/* Formulir Tambah Project Baru */}
      <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
          <Plus className="w-4 h-4 text-zinc-700" />
          <span>Daftarkan Website Baru</span>
        </h2>

        {message && (
          <div
            className={`p-3 rounded-lg text-xs font-medium border flex items-center gap-2 ${
              message.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : "bg-rose-50 border-rose-200 text-rose-800"
            }`}
          >
            {message.type === "success" ? (
              <Check className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        <form
          onSubmit={handleCreateProject}
          className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end"
        >
          <div className="sm:col-span-5 space-y-1">
            <label className="text-xs font-semibold text-zinc-700">
              Nama Website / Project
            </label>
            <input
              type="text"
              placeholder="Contoh: Portfolio Saya / Toko Online"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="w-full bg-white border border-zinc-300 rounded-lg px-3 py-2 text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-900 transition-colors"
              required
            />
          </div>

          <div className="sm:col-span-5 space-y-1">
            <label className="text-xs font-semibold text-zinc-700">
              Domain Website
            </label>
            <input
              type="text"
              placeholder="Contoh: https://myportofolio.vercel.app"
              value={projectDomain}
              onChange={(e) => setProjectDomain(e.target.value)}
              className="w-full bg-white border border-zinc-300 rounded-lg px-3 py-2 text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-900 transition-colors font-mono"
              required
            />
          </div>

          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 text-white font-medium text-xs py-2 px-4 rounded-lg shadow-sm transition-all active:scale-[0.98] cursor-pointer h-[38px] flex items-center justify-center gap-1.5"
            >
              {isSubmitting ? "Menyimpan..." : "Buat Project"}
            </button>
          </div>
        </form>
      </div>

      {/* Container Card: Daftar Project Aktif Milik Anda */}
      <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
              <FolderCheck className="w-4 h-4 text-zinc-700" />
              <span>Daftar Project Aktif Milik Anda ({projects.length})</span>
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Pilih proyek untuk melihat panduan instalasi script dan write key terkait
            </p>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-zinc-400">
            Memuat data project...
          </div>
        ) : projects.length === 0 ? (
          <div className="py-12 px-4 text-center space-y-2 border border-zinc-200 rounded-xl bg-zinc-50/50">
            <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center mx-auto text-zinc-400">
              <FolderCheck className="w-5 h-5" />
            </div>
            <div className="text-sm font-semibold text-zinc-800">Belum ada project terdaftar</div>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto">
              Gunakan formulir di atas untuk mendaftarkan website baru Anda.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            {projects.map((proj) => (
              <div
                key={proj.id}
                onClick={() => setSelectedProject(proj)}
                className={`border rounded-xl p-5 transition-all cursor-pointer ${
                  selectedProject?.id === proj.id
                    ? "bg-white border-zinc-900 ring-1 ring-zinc-900 shadow-sm"
                    : "bg-zinc-50/60 border-zinc-200 hover:border-zinc-300 hover:bg-white"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-zinc-900 text-sm">
                      {proj.name}
                    </h4>
                    <span className="font-mono text-xs text-zinc-500">
                      {proj.id}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-semibold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Aktif
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStartEdit(proj);
                      }}
                      className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-900 hover:bg-zinc-200/60 transition-colors cursor-pointer"
                      title="Ubah data project"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeletingProject(proj);
                      }}
                      className="p-1.5 rounded-md text-zinc-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Hapus project"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2 text-xs text-zinc-600 mt-3.5">
                  <div>
                    <span className="text-zinc-400 block mb-0.5 text-[11px] font-medium flex items-center gap-1">
                      <Key className="w-3 h-3 text-zinc-400" />
                      Public Write Key:
                    </span>
                    <code className="px-2 py-1 rounded bg-zinc-100 border border-zinc-200 text-zinc-900 font-mono text-[11px] block">
                      {proj.writeKey}
                    </code>
                  </div>

                  <div>
                    <span className="text-zinc-400 block mb-0.5 text-[11px] font-medium flex items-center gap-1">
                      <Globe className="w-3 h-3 text-zinc-400" />
                      Domain Terdaftar:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {proj.allowedOrigins.map((orig) => (
                        <span
                          key={orig}
                          className="px-2 py-0.5 rounded bg-zinc-100 border border-zinc-200 text-zinc-700 font-mono text-[11px]"
                        >
                          {orig}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Secret API Keys Card (Headless Data Export / Read API) */}
      {selectedProject && (
        <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-zinc-900 text-white flex items-center justify-center">
                  <Lock className="w-3.5 h-3.5" />
                </div>
                <h2 className="text-sm font-bold text-zinc-900">
                  Secret API Key (Konsumsi Data Eksternal)
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 font-semibold font-mono">
                  Project: {selectedProject.id}
                </span>
              </div>
              <p className="text-xs text-zinc-500">
                Gunakan kunci ini pada server backend aplikasi Anda yang lain (Laravel, Node.js, Python, Flutter) untuk menarik metrik dan event secara terprogram.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/dashboard/docs#api"
                className="h-8 px-3 text-xs text-zinc-600 hover:text-zinc-900 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Server className="w-3.5 h-3.5 text-zinc-500" />
                <span>Dokumentasi API</span>
                <ExternalLink className="w-3 h-3 text-zinc-400" />
              </Link>
              <button
                type="button"
                onClick={() => setShowCreateKeyModal(true)}
                className="h-8 px-3 text-xs bg-zinc-900 hover:bg-zinc-800 text-white font-medium rounded-lg transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Buat Secret Key</span>
              </button>
            </div>
          </div>

          {loadingKeys ? (
            <div className="p-4 text-center text-xs text-zinc-400">
              Memuat daftar API Key...
            </div>
          ) : apiKeys.length === 0 ? (
            <div className="p-6 rounded-lg border border-dashed border-zinc-200 bg-zinc-50/50 text-center space-y-2">
              <Shield className="w-6 h-6 text-zinc-400 mx-auto" />
              <div className="text-xs font-semibold text-zinc-700">Belum ada Secret Key untuk project ini</div>
              <p className="text-[11px] text-zinc-500 max-w-md mx-auto">
                Buat Secret Key untuk menghubungkan analitik proyek ini ke aplikasi Anda yang lain via REST API.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto border border-zinc-200 rounded-lg">
              <table className="w-full text-left text-xs text-zinc-700">
                <thead className="text-[11px] uppercase tracking-wider bg-zinc-50 text-zinc-500 border-b border-zinc-200">
                  <tr>
                    <th className="px-4 py-2.5 font-semibold">Nama Kunci</th>
                    <th className="px-4 py-2.5 font-semibold">Prefix Kunci</th>
                    <th className="px-4 py-2.5 font-semibold">Izin (Scope)</th>
                    <th className="px-4 py-2.5 font-semibold">Dibuat Pada</th>
                    <th className="px-4 py-2.5 font-semibold">Terakhir Digunakan</th>
                    <th className="px-4 py-2.5 font-semibold text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 bg-white font-mono text-[11px]">
                  {apiKeys.map((k) => (
                    <tr key={k.id} className="hover:bg-zinc-50 transition-colors">
                      <td className="px-4 py-2.5 font-sans font-medium text-zinc-900 text-xs">
                        {k.name}
                      </td>
                      <td className="px-4 py-2.5 text-zinc-600">
                        <code>{k.key_prefix}</code>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-700 border border-zinc-200 text-[10px]">
                          metrics:read
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-zinc-500 font-sans text-xs">
                        {new Date(k.created_at).toLocaleDateString("id-ID")}
                      </td>
                      <td className="px-4 py-2.5 text-zinc-500 font-sans text-xs">
                        {k.last_used_at ? new Date(k.last_used_at).toLocaleString("id-ID") : "Belum pernah"}
                      </td>
                      <td className="px-4 py-2.5 text-right font-sans">
                        <button
                          type="button"
                          disabled={deletingKeyId === k.id}
                          onClick={() => handleDeleteApiKey(k.id)}
                          className="p-1 rounded text-zinc-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer disabled:opacity-50"
                          title="Cabut / Hapus Kunci ini"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Script Tag Snippet Generator per Framework */}
      <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
              <Code2 className="w-4 h-4 text-zinc-800" />
              <span>Panduan Pasang Script per Framework</span>
            </h2>
            <p className="text-xs text-zinc-500">
              Pilih framework website Anda di bawah ini, lalu salin kodenya ke
              file yang ditentukan.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs text-zinc-500 font-medium">
              Pilih Project:
            </label>
            <select
              value={selectedProject?.id || ""}
              onChange={(e) => {
                const found = projects.find((p) => p.id === e.target.value);
                if (found) setSelectedProject(found);
              }}
              className="bg-zinc-50 border border-zinc-200 text-zinc-800 text-xs rounded-lg px-3 py-1.5 font-medium focus:outline-none focus:border-zinc-400 cursor-pointer"
            >
              {projects.map((proj) => (
                <option key={proj.id} value={proj.id}>
                  {proj.name} ({proj.id})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Tab Selector Framework */}
        <div className="flex flex-wrap gap-1.5 border-b border-zinc-200 pb-3">
          {FRAMEWORK_SNIPPETS.map((fw) => (
            <button
              key={fw.id}
              type="button"
              onClick={() => setSelectedFramework(fw.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                selectedFramework === fw.id
                  ? "bg-zinc-900 text-white shadow-sm"
                  : "bg-zinc-100 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/70"
              }`}
            >
              {fw.name}
            </button>
          ))}
        </div>

        {/* Pilihan Mode Pelacakan: Smart Auto-Capture vs Manual Selektif */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-zinc-50 border border-zinc-200 rounded-xl">
          <div className="space-y-0.5">
            <span className="text-xs font-bold text-zinc-900 flex items-center gap-1.5">
              <span>Pilih Mode Pelacakan Script</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-200 text-zinc-700">
                {trackingMode === 'smart' ? 'data-auto-capture="true"' : 'data-auto-capture="false"'}
              </span>
            </span>
            <p className="text-[11px] text-zinc-500">
              {trackingMode === 'smart' 
                ? 'Mode Smart: Otomatis mendeteksi klik tombol aksi dan logo brand tanpa koding manual.' 
                : 'Mode Manual: Hanya tombol yang secara spesifik diberi atribut data-track-cta yang akan dihitung.'}
            </p>
          </div>

          <div className="flex items-center gap-1 bg-white border border-zinc-200 p-1 rounded-lg shrink-0">
            <button
              type="button"
              onClick={() => setTrackingMode('smart')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                trackingMode === 'smart'
                  ? 'bg-zinc-900 text-white shadow-sm'
                  : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Smart (Otomatis)</span>
            </button>

            <button
              type="button"
              onClick={() => setTrackingMode('manual')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                trackingMode === 'manual'
                  ? 'bg-zinc-900 text-white shadow-sm'
                  : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Manual (Selektif)</span>
            </button>
          </div>
        </div>

        {/* Lokasi File Target */}
        <div className="flex items-center justify-between text-xs text-zinc-600">
          <div className="flex items-center gap-2">
            <span>Tempelkan di file:</span>
            <code className="px-2 py-0.5 rounded bg-zinc-100 border border-zinc-200 text-zinc-900 font-mono text-[11px] font-semibold">
              {activeSnippet.fileTarget}
            </code>
          </div>
          {activeSnippet.note && (
            <span className="text-[11px] text-zinc-500 hidden sm:inline">
              {activeSnippet.note}
            </span>
          )}
        </div>

        {/* Code Block Container */}
        <div className="relative group">
          <pre className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-100 overflow-x-auto leading-relaxed">
            {displayCode}
          </pre>

          <button
            type="button"
            onClick={copyToClipboard}
            className="absolute top-3 right-3 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 text-xs font-medium flex items-center gap-1.5 transition-all active:scale-[0.98] shadow-sm cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Tersalin!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Salin Kode</span>
              </>
            )}
          </button>
        </div>

        {/* Panduan Menandai Tombol & Smart Auto-Capture */}
        <div className="rounded-xl bg-zinc-50 border border-zinc-200 p-4 text-xs text-zinc-600 space-y-3">
          <div className="font-semibold text-zinc-900 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-zinc-500" />
              <span>Langkah 2: Pelacakan Klik Tombol &amp; Logo Brand</span>
            </div>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-zinc-200/80 text-zinc-800 text-[10px] font-semibold font-mono">
              Mode Aktif: {trackingMode === 'smart' ? 'Smart Auto-Capture' : 'Manual Selektif'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            <div
              className={`p-3.5 rounded-lg border transition-all ${
                trackingMode === 'smart'
                  ? 'bg-white border-zinc-900 ring-1 ring-zinc-900 shadow-sm'
                  : 'bg-white/60 border-zinc-200 opacity-60'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold text-zinc-900 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-zinc-700" />
                  <span>1. Mode Otomatis (Smart Auto-Capture)</span>
                </span>
                {trackingMode === 'smart' && (
                  <span className="text-[10px] bg-zinc-900 text-white px-1.5 py-0.5 rounded font-medium">
                    Aktif
                  </span>
                )}
              </div>
              <p className="text-[11px] text-zinc-500 leading-relaxed">
                Tanpa perlu koding manual. Tombol (seperti <em>&quot;Explore&quot;</em>, <em>&quot;Detail&quot;</em>) otomatis dikombinasikan dengan judul kartu produk (contoh: <code className="bg-zinc-100 px-1 py-0.5 rounded font-mono text-zinc-800">812-explore</code>), dan logo brand mobil (dari tag <code className="bg-zinc-100 px-1 py-0.5 rounded font-mono text-zinc-800">alt=&quot;Ferrari&quot;</code>) langsung tercatat sebagai <code className="bg-zinc-100 px-1 py-0.5 rounded font-mono text-zinc-800">brand-ferrari</code>.
              </p>
            </div>

            <div
              className={`p-3.5 rounded-lg border transition-all ${
                trackingMode === 'manual'
                  ? 'bg-white border-zinc-900 ring-1 ring-zinc-900 shadow-sm'
                  : 'bg-white/60 border-zinc-200 opacity-60'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold text-zinc-900 flex items-center gap-1.5">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-zinc-700" />
                  <span>2. Mode Manual (Presisi Selektif)</span>
                </span>
                {trackingMode === 'manual' && (
                  <span className="text-[10px] bg-zinc-900 text-white px-1.5 py-0.5 rounded font-medium">
                    Aktif
                  </span>
                )}
              </div>
              <p className="text-[11px] text-zinc-500 leading-relaxed mb-2">
                Hanya elemen bertanda khusus yang dilacak. Tambahkan atribut <code className="bg-zinc-100 px-1 py-0.5 rounded font-mono text-zinc-800">data-track-cta=&quot;nama_tombol&quot;</code> pada tombol Anda:
              </p>
              <code className="text-zinc-800 font-mono text-[11px] block bg-zinc-100 p-2 rounded border border-zinc-200 overflow-x-auto">
                &lt;button data-track-cta=&quot;btn-checkout&quot;&gt;Beli Sekarang&lt;/button&gt;
              </code>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Dialog: Ubah Project */}
      {editingProject && (
        <div className="fixed inset-0 z-50 bg-zinc-950/20 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-xl max-w-md w-full space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <Pencil className="w-4 h-4 text-zinc-700" />
                <h3 className="text-sm font-bold text-zinc-900">Ubah Data Project</h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingProject(null)}
                className="text-zinc-400 hover:text-zinc-700 p-1 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-700">Nama Website / Project</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-white border border-zinc-300 rounded-lg px-3 py-2 text-xs text-zinc-900 focus:outline-none focus:border-zinc-900"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-700">
                  Domain Terdaftar (Pisahkan dengan koma jika lebih dari 1)
                </label>
                <input
                  type="text"
                  value={editDomain}
                  onChange={(e) => setEditDomain(e.target.value)}
                  className="w-full bg-white border border-zinc-300 rounded-lg px-3 py-2 text-xs text-zinc-900 focus:outline-none focus:border-zinc-900 font-mono"
                  placeholder="https://myportofolio.vercel.app, http://localhost:3000"
                  required
                />
                <span className="text-[10px] text-zinc-400 block">
                  Domain localhost otomatis diizinkan untuk semua port saat pengujian lokal.
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setEditingProject(null)}
                  className="px-3.5 py-2 rounded-lg text-xs font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="px-4 py-2 rounded-lg text-xs font-medium bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 text-white flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  {isUpdating ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <span>Simpan Perubahan</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Dialog: Konfirmasi Hapus Project */}
      {deletingProject && (
        <div className="fixed inset-0 z-50 bg-zinc-950/20 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-xl max-w-md w-full space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-lg bg-rose-50 text-rose-600 border border-rose-200 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-zinc-900">
                  Hapus Project &quot;{deletingProject.name}&quot;?
                </h3>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  Tindakan ini tidak dapat dibatalkan. Seluruh data pelacakan klik (<code className="font-mono text-zinc-700">{deletingProject.id}</code>) dan riwayat metrik terkait akan dihapus secara permanen dari Cloudflare D1.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeletingProject(null)}
                className="px-3.5 py-2 rounded-lg text-xs font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-lg text-xs font-medium bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Menghapus...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Ya, Hapus Project</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Dialog: Buat Secret API Key Baru */}
      {showCreateKeyModal && selectedProject && (
        <div className="fixed inset-0 z-50 bg-zinc-950/20 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-xl max-w-md w-full space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-zinc-900" />
                <h3 className="text-sm font-bold text-zinc-900">Buat Secret Key Baru</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateKeyModal(false)}
                className="text-zinc-400 hover:text-zinc-700 p-1 rounded-md cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateApiKey} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-700">Nama Identifier Kunci</label>
                <input
                  type="text"
                  placeholder="Contoh: Server Laravel / Aplikasi Mobile"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  className="w-full bg-white border border-zinc-300 rounded-lg px-3 py-2 text-xs text-zinc-900 focus:outline-none focus:border-zinc-900"
                  required
                  autoFocus
                />
                <p className="text-[11px] text-zinc-500">
                  Digunakan untuk mengidentifikasi server atau aplikasi yang menggunakan kunci ini.
                </p>
              </div>

              <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-lg text-xs space-y-1 text-zinc-600">
                <div className="font-semibold text-zinc-900 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Izin Akses (Scope): Read-Only</span>
                </div>
                <p className="text-[11px] text-zinc-500">
                  Kunci ini hanya diizinkan membaca metrik dan ringkasan CTA proyek <code className="font-mono text-zinc-800">{selectedProject.id}</code>.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setShowCreateKeyModal(false)}
                  className="px-3.5 py-2 rounded-lg text-xs font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isCreatingKey}
                  className="px-4 py-2 rounded-lg text-xs font-medium bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 text-white flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  {isCreatingKey ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  <span>{isCreatingKey ? "Membuat..." : "Buat Kunci"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Dialog: Kunci Baru Berhasil Dibuat (One-Time Display) */}
      {createdKeyData && (
        <div className="fixed inset-0 z-50 bg-zinc-950/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-2xl max-w-lg w-full space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <Check className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-zinc-900">Secret Key Berhasil Dibuat!</h3>
                <p className="text-xs text-zinc-500">Simpan sekarang di berkas konfigurasi (.env) server Anda</p>
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <strong className="font-semibold block">PENTING: Kunci ini hanya ditampilkan sekali!</strong>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  Demi alasan keamanan, kami tidak menyimpan kunci mentah ini di database kami (hanya hash SHA-256). Jika Anda kehilangan kunci ini, Anda harus membuat kunci baru.
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-700">Secret Key Anda:</label>
              <div className="flex items-center gap-2">
                <code className="flex-1 p-2.5 bg-zinc-900 text-emerald-400 font-mono text-xs rounded-lg border border-zinc-800 select-all overflow-x-auto">
                  {createdKeyData.rawKey}
                </code>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(createdKeyData.rawKey);
                    setCopiedKey(true);
                    setTimeout(() => setCopiedKey(false), 2000);
                  }}
                  className="px-3.5 py-2.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer shadow-sm"
                >
                  {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey ? "Tersalin!" : "Salin"}</span>
                </button>
              </div>
            </div>

            <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-lg text-xs text-zinc-600 space-y-1">
              <div className="font-semibold text-zinc-800">Contoh Penggunaan Header:</div>
              <code className="font-mono text-[11px] block text-zinc-700">
                x-api-key: {createdKeyData.rawKey}
              </code>
            </div>

            <div className="flex justify-end pt-2 border-t border-zinc-100">
              <button
                type="button"
                onClick={() => {
                  setCreatedKeyData(null);
                  setCopiedKey(false);
                }}
                className="px-5 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg text-xs font-medium cursor-pointer shadow-sm"
              >
                Saya Sudah Menyimpan Kunci Ini
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
