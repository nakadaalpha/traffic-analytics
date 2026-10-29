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
  Users,
  UserPlus,
  Share2,
  FileText,
  Building2,
} from "lucide-react";
import { useProject } from "@/context/ProjectContext";

interface ProjectData {
  id: string;
  name: string;
  writeKey: string;
  allowedOrigins: string[];
  isActive: boolean;
  ownerId?: string;
  role?: 'owner' | 'editor' | 'viewer';
  createdAt?: string;
}

export interface ProjectMember {
  id: string;
  projectId: string;
  userId: string;
  role: 'owner' | 'editor' | 'viewer';
  name: string;
  email: string;
  username: string;
  createdAt?: string;
  isOwner?: boolean;
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

const CTA_BUTTON_EXAMPLES = [
  {
    id: "whatsapp",
    title: "Tombol WhatsApp / Kontak Langsung",
    icon: Share2,
    code: `<a 
  href="https://wa.me/62812345678" 
  data-track-cta="btn-hubungi-whatsapp"
  target="_blank"
  rel="noopener noreferrer"
>
  Hubungi via WhatsApp
</a>`,
  },
  {
    id: "brosur",
    title: "Tombol Unduh Brosur / Katalog PDF",
    icon: FileText,
    code: `<a 
  href="/brosur.pdf" 
  download 
  data-track-cta="btn-download-brosur"
>
  Unduh Brosur
</a>`,
  },
  {
    id: "checkout",
    title: "Tombol Beli / Checkout Keranjang",
    icon: Layers,
    code: `<button 
  type="button" 
  data-track-cta="btn-checkout-keranjang"
>
  Beli Sekarang
</button>`,
  },
  {
    id: "registrasi",
    title: "Tombol Kirim Formulir Registrasi",
    icon: Terminal,
    code: `<button 
  type="submit" 
  data-track-cta="form-submit-registrasi"
>
  Kirim Data
</button>`,
  },
];

export default function ProjectsPage() {
  const { currentProject, selectProject, refreshProjects } = useProject();
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [selectedProject, setSelectedProject] = useState<ProjectData | null>(null);
  const [loading, setLoading] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);
  const [copiedSnippetId, setCopiedSnippetId] = useState<string | null>(null);
  const [selectedFramework, setSelectedFramework] = useState("vite");
  const [trackingMode, setTrackingMode] = useState<"smart" | "manual">("smart");

  // Form Tambah Project
  const [projectName, setProjectName] = useState("");
  const [projectDomain, setProjectDomain] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // 1. Fetch Projects
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
        if (list.length > 0) {
          const targetId = currentProject?.id;
          const match = list.find((p) => p.id === targetId) || list[0];
          setSelectedProject(match);
        } else {
          setSelectedProject(null);
        }
      }
    } catch (err) {
      console.warn("[ProjectsPage] Failed to fetch projects:", err);
    } finally {
      setLoading(false);
    }
  }, [currentProject?.id]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // Sync saat workspace berganti dari TopHeader
  useEffect(() => {
    if (currentProject && projects.length > 0) {
      const match = projects.find((p) => p.id === currentProject.id);
      if (match && selectedProject?.id !== match.id) {
        setSelectedProject(match);
      }
    }
  }, [currentProject, projects, selectedProject?.id]);

  // 2. Tambah Project Baru
  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName.trim() || !projectDomain.trim()) return;

    try {
      setIsSubmitting(true);
      setMessage(null);

      const origins = projectDomain
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const res = await fetch("/api/track/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: projectName.trim(),
          allowedOrigins: origins,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "Gagal membuat project baru.");
      }

      setMessage({
        type: "success",
        text: `Project "${projectName}" berhasil didaftarkan.`,
      });

      const newProj = json.data;
      setProjectName("");
      setProjectDomain("");
      await refreshProjects();
      await fetchProjects();
      if (newProj?.id) {
        selectProject(newProj.id);
      }
    } catch (err: any) {
      setMessage({
        type: "error",
        text: err.message || "Terjadi kesalahan saat membuat project.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // State Modal Edit Project
  const [editingProject, setEditingProject] = useState<ProjectData | null>(null);
  const [editName, setEditName] = useState("");
  const [editDomain, setEditDomain] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  // State Modal Hapus Project
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
      const origins = editDomain
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const res = await fetch(`/api/track/projects/${editingProject.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: editName.trim(),
          allowedOrigins: origins,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal memperbarui data project.");
      }

      setEditingProject(null);
      await refreshProjects();
      await fetchProjects();
    } catch (err: any) {
      alert(err.message || "Gagal memperbarui project.");
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
      if (!res.ok) {
        throw new Error(data.error || "Gagal menghapus project.");
      }

      setDeletingProject(null);
      await refreshProjects();
      await fetchProjects();
    } catch (err: any) {
      alert(err.message || "Gagal menghapus project.");
    } finally {
      setIsDeleting(false);
    }
  };

  // 3. Multi-User RBAC (Project Members)
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteIdentifier, setInviteIdentifier] = useState("");
  const [inviteRole, setInviteRole] = useState<"editor" | "viewer">("editor");
  const [isInviting, setIsInviting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [deletingMemberId, setDeletingMemberId] = useState<string | null>(null);

  const fetchMembers = useCallback(async (pid: string) => {
    try {
      setLoadingMembers(true);
      const res = await fetch(`/api/track/projects/${pid}/members`, {
        credentials: 'include',
        cache: 'no-store',
      });
      if (res.ok) {
        const json = await res.json();
        setMembers(json.data || []);
      } else {
        setMembers([]);
      }
    } catch (err) {
      console.warn('[ProjectsPage] Failed to fetch members:', err);
    } finally {
      setLoadingMembers(false);
    }
  }, []);

  useEffect(() => {
    if (selectedProject?.id) {
      fetchMembers(selectedProject.id);
    } else {
      setMembers([]);
    }
  }, [selectedProject?.id, fetchMembers]);

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject || !inviteIdentifier.trim()) return;

    try {
      setIsInviting(true);
      setInviteError(null);
      const res = await fetch(`/api/track/projects/${selectedProject.id}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          identifier: inviteIdentifier.trim(),
          role: inviteRole,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Gagal menambahkan anggota tim.');
      }

      setShowInviteModal(false);
      setInviteIdentifier('');
      fetchMembers(selectedProject.id);
    } catch (err: any) {
      setInviteError(err.message || 'Terjadi kesalahan saat mengundang.');
    } finally {
      setIsInviting(false);
    }
  };

  const handleUpdateMemberRole = async (memberId: string, newRole: "editor" | "viewer") => {
    if (!selectedProject) return;
    try {
      const res = await fetch(`/api/track/projects/${selectedProject.id}/members/${memberId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ role: newRole }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Gagal mengubah hak akses');
      fetchMembers(selectedProject.id);
    } catch (err: any) {
      alert(err.message || 'Gagal mengubah peran anggota');
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!selectedProject) return;
    if (!confirm('Apakah Anda yakin ingin mencabut hak akses anggota ini?')) return;

    try {
      setDeletingMemberId(memberId);
      const res = await fetch(`/api/track/projects/${selectedProject.id}/members/${memberId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Gagal menghapus anggota');
      fetchMembers(selectedProject.id);
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus anggota');
    } finally {
      setDeletingMemberId(null);
    }
  };

  // Kalkulasi snippet aktif
  const activeSnippet =
    FRAMEWORK_SNIPPETS.find((fw) => fw.id === selectedFramework) ||
    FRAMEWORK_SNIPPETS[0];
  const currentPid = selectedProject?.id || "PROJECT_ID_ANDA";
  const currentKey = selectedProject?.writeKey || "WRITE_KEY_ANDA";
  const displayCode = activeSnippet.getCode(
    currentPid,
    currentKey,
    trackingMode === "smart"
  );

  const copyScriptToClipboard = () => {
    navigator.clipboard.writeText(displayCode);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2000);
  };

  const copySnippetToClipboard = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSnippetId(id);
    setTimeout(() => setCopiedSnippetId(null), 2000);
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
              Manajemen Project &amp; Integrasi
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
              Pilih proyek di bawah untuk mengganti workspace aktif dan melihat panduan instalasi script.
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
                onClick={() => {
                  setSelectedProject(proj);
                  selectProject(proj.id);
                }}
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
                  <div className="flex items-center gap-1.5 flex-wrap justify-end">
                    {proj.role && (
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          proj.role === 'owner'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : proj.role === 'editor'
                            ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                            : 'bg-zinc-100 text-zinc-600 border-zinc-200'
                        }`}
                      >
                        {proj.role.toUpperCase()}
                      </span>
                    )}
                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-semibold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Aktif
                    </span>
                    {(!proj.role || proj.role === 'owner') && (
                      <>
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
                      </>
                    )}
                  </div>
                </div>

                <div className="space-y-2 text-xs text-zinc-600 mt-3.5">
                  <div>
                    <span className="text-zinc-400 mb-0.5 text-[11px] font-medium flex items-center gap-1">
                      <Key className="w-3 h-3 text-zinc-400" />
                      Public Write Key:
                    </span>
                    <code className="px-2 py-1 rounded bg-zinc-100 border border-zinc-200 text-zinc-900 font-mono text-[11px] block">
                      {proj.writeKey}
                    </code>
                  </div>

                  <div>
                    <span className="text-zinc-400 mb-0.5 text-[11px] font-medium flex items-center gap-1">
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

      {/* Kartu Manajemen Anggota Tim & Hak Akses (Multi-User RBAC) */}
      {selectedProject && (
        <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0">
                  <Users className="w-3.5 h-3.5" />
                </div>
                <h2 className="text-sm font-bold text-zinc-900">
                  Anggota Tim &amp; Hak Akses (RBAC)
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 font-semibold font-mono">
                  {selectedProject.name}
                </span>
                {selectedProject.role && (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                      selectedProject.role === 'owner'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : selectedProject.role === 'editor'
                        ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                        : 'bg-zinc-100 text-zinc-600 border-zinc-200'
                    }`}
                  >
                    Peran Anda: {selectedProject.role.toUpperCase()}
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-500">
                Atur kolaborasi multi-user untuk brand atau klien agensi. Owner memiliki akses penuh, Editor mengelola koneksi media sosial &amp; kampanye, Viewer hanya melihat metrik.
              </p>
            </div>

            {(!selectedProject.role || selectedProject.role === 'owner') && (
              <button
                type="button"
                onClick={() => {
                  setInviteIdentifier('');
                  setInviteRole('editor');
                  setInviteError(null);
                  setShowInviteModal(true);
                }}
                className="h-8 px-3 text-xs bg-zinc-900 hover:bg-zinc-800 text-white font-medium rounded-lg transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Undang Anggota</span>
              </button>
            )}
          </div>

          {loadingMembers ? (
            <div className="p-4 text-center text-xs text-zinc-400">
              Memuat daftar anggota tim...
            </div>
          ) : members.length === 0 ? (
            <div className="p-6 rounded-lg border border-dashed border-zinc-200 bg-zinc-50/50 text-center space-y-2">
              <Users className="w-6 h-6 text-zinc-400 mx-auto" />
              <div className="text-xs font-semibold text-zinc-700">Belum ada anggota tim terdaftar</div>
              <p className="text-[11px] text-zinc-500 max-w-md mx-auto">
                Undang staf atau klien Anda dengan memasukkan email atau username akun Firenalytics mereka.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto border border-zinc-200 rounded-lg">
              <table className="w-full text-left text-xs text-zinc-700">
                <thead className="text-[11px] uppercase tracking-wider bg-zinc-50 text-zinc-500 border-b border-zinc-200">
                  <tr>
                    <th className="px-4 py-2.5 font-semibold">Nama / Pengguna</th>
                    <th className="px-4 py-2.5 font-semibold">Email</th>
                    <th className="px-4 py-2.5 font-semibold">Peran (Role)</th>
                    <th className="px-4 py-2.5 font-semibold">Bergabung Pada</th>
                    <th className="px-4 py-2.5 font-semibold text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 bg-white text-xs">
                  {members.map((m) => {
                    const isMemberOwner = m.role === 'owner' || m.isOwner;
                    const canManage = (!selectedProject.role || selectedProject.role === 'owner') && !isMemberOwner;

                    return (
                      <tr key={m.id || m.userId} className="hover:bg-zinc-50 transition-colors">
                        <td className="px-4 py-3 font-medium text-zinc-900">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-zinc-200 text-zinc-800 font-semibold flex items-center justify-center text-[10px]">
                              {(m.name || m.username || 'U').charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-semibold leading-tight">{m.name || m.username}</div>
                              <div className="text-[10px] text-zinc-400 font-mono">@{m.username}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-zinc-600">
                          {m.email}
                        </td>
                        <td className="px-4 py-3">
                          {isMemberOwner ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1 w-fit">
                              <Shield className="w-2.5 h-2.5 text-emerald-600" />
                              OWNER
                            </span>
                          ) : canManage ? (
                            <select
                              value={m.role}
                              onChange={(e) => handleUpdateMemberRole(m.id, e.target.value as 'editor' | 'viewer')}
                              className="px-2 py-1 rounded text-[11px] font-semibold border border-zinc-200 bg-white text-zinc-800 focus:outline-none cursor-pointer"
                            >
                              <option value="editor">EDITOR (Akses Penuh Fitur)</option>
                              <option value="viewer">VIEWER (Hanya Lihat)</option>
                            </select>
                          ) : (
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold border inline-block ${
                                m.role === 'editor'
                                  ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                  : 'bg-zinc-100 text-zinc-600 border-zinc-200'
                              }`}
                            >
                              {m.role.toUpperCase()}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-zinc-500 text-[11px]">
                          {m.createdAt ? new Date(m.createdAt).toLocaleDateString('id-ID') : '-'}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {canManage ? (
                            <button
                              type="button"
                              disabled={deletingMemberId === m.id}
                              onClick={() => handleRemoveMember(m.id)}
                              className="p-1 rounded text-zinc-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer disabled:opacity-50"
                              title="Cabut akses anggota ini"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          ) : isMemberOwner ? (
                            <span className="text-[10px] text-zinc-400 font-medium italic">Pemilik Proyek</span>
                          ) : (
                            <span className="text-[10px] text-zinc-400 italic">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
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
              Pilih framework website Anda di bawah ini, lalu salin kodenya ke file yang ditentukan.
            </p>
          </div>

          {selectedProject && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-zinc-100 border border-zinc-200 text-xs">
              <Building2 className="w-3.5 h-3.5 text-zinc-500" />
              <span className="text-zinc-500 font-medium">Workspace Aktif:</span>
              <span className="font-bold text-zinc-900">{selectedProject.name}</span>
              <code className="text-[10px] font-mono text-zinc-600 bg-white px-1.5 py-0.5 rounded border border-zinc-200">
                {selectedProject.id}
              </code>
            </div>
          )}
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
              <span>Pilihan Mode Pelacakan Script</span>
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
            onClick={copyScriptToClipboard}
            className="absolute top-3 right-3 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 text-xs font-medium flex items-center gap-1.5 transition-all active:scale-[0.98] shadow-sm cursor-pointer"
          >
            {copiedScript ? (
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

        {/* Penjelasan Mode Pelacakan Klik */}
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
                Tanpa perlu koding manual. Tombol (seperti <em>&quot;Explore&quot;</em>, <em>&quot;Beli&quot;</em>) otomatis dikombinasikan dengan judul kartu produk di sekitarnya, dan logo brand atau link sosial media otomatis terdeteksi.
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
                Hanya elemen yang secara eksplisit memiliki atribut <code className="bg-zinc-100 px-1 py-0.5 rounded font-mono text-zinc-800">data-track-cta=&quot;nama_tombol&quot;</code> yang akan dicatat.
              </p>
            </div>
          </div>
        </div>

        {/* Contoh Tombol Praktis (Siap Salin) */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-zinc-900 flex items-center gap-2">
              <Code2 className="w-3.5 h-3.5 text-zinc-700" />
              <span>Contoh Elemen Tombol Siap Pakai (Quick Copy)</span>
            </h3>
            <span className="text-[11px] text-zinc-400">
              Salin dan sesuaikan tag HTML di bawah ke template web Anda
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {CTA_BUTTON_EXAMPLES.map((ex) => {
              const IconComponent = ex.icon;
              const isCopied = copiedSnippetId === ex.id;

              return (
                <div
                  key={ex.id}
                  className="p-4 rounded-xl bg-zinc-50/80 border border-zinc-200 space-y-2 flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-xs font-semibold text-zinc-800 flex items-center gap-1.5">
                      <IconComponent className="w-3.5 h-3.5 text-zinc-500" />
                      <span>{ex.title}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => copySnippetToClipboard(ex.id, ex.code)}
                      className="px-2.5 py-1 text-[11px] font-medium rounded-md bg-white border border-zinc-200 hover:border-zinc-300 text-zinc-700 hover:text-zinc-900 transition-colors cursor-pointer flex items-center gap-1 shadow-2xs active:scale-[0.98]"
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span className="text-emerald-700">Tersalin!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3 text-zinc-500" />
                          <span>Salin</span>
                        </>
                      )}
                    </button>
                  </div>

                  <pre className="p-3 rounded-lg bg-zinc-900 text-[11px] font-mono text-zinc-200 overflow-x-auto leading-relaxed border border-zinc-800">
                    {ex.code}
                  </pre>
                </div>
              );
            })}
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

      {/* Modal: Undang Anggota Tim ke Workspace (RBAC) */}
      {showInviteModal && selectedProject && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
          style={{ width: '100vw', height: '100vh', margin: 0, top: 0, left: 0, right: 0, bottom: 0 }}
          onClick={() => setShowInviteModal(false)}
        >
          <div
            className="bg-white border border-zinc-200 rounded-2xl w-full max-w-md flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/70">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-zinc-900">
                    Undang Anggota Tim
                  </h3>
                  <p className="text-[11px] text-zinc-500">
                    Workspace: <strong>{selectedProject.name}</strong>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowInviteModal(false)}
                className="w-7 h-7 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 flex items-center justify-center text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleInviteMember} className="p-5 space-y-4 text-xs">
              {inviteError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                  <span>{inviteError}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block font-semibold text-zinc-800">
                  Email atau Username Pengguna
                </label>
                <input
                  type="text"
                  required
                  value={inviteIdentifier}
                  onChange={(e) => setInviteIdentifier(e.target.value)}
                  placeholder="Contoh: tim@agensi.com atau alex_dev"
                  className="w-full px-3 py-2 text-xs border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-400 bg-white text-zinc-900"
                  autoFocus
                />
                <p className="text-[11px] text-zinc-400">
                  Pastikan pengguna tersebut telah memiliki akun di Firenalytics.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="block font-semibold text-zinc-800">
                  Peran &amp; Hak Akses
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as 'editor' | 'viewer')}
                  className="w-full px-3 py-2 text-xs border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-400 bg-white text-zinc-900 cursor-pointer"
                >
                  <option value="editor">Editor — Akses Operasional Penuh (Hubungkan Akun, Link-in-Bio, Sinkronisasi)</option>
                  <option value="viewer">Viewer — Akses Lihat Saja (Melihat Grafik &amp; Unduh Laporan)</option>
                </select>
              </div>

              <div className="p-3 rounded-lg bg-zinc-50 border border-zinc-200 text-zinc-600 text-[11px] leading-relaxed">
                Anggota yang diundang akan langsung dapat memilih workspace <strong>{selectedProject.name}</strong> di menu atas (TopHeader) setelah undangan terkirim.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="px-4 py-2 rounded-lg border border-zinc-200 text-zinc-700 hover:bg-zinc-50 font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isInviting}
                  className="px-4 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-60 shadow-xs"
                >
                  {isInviting ? <RotateCw className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />}
                  <span>{isInviting ? 'Mengirim...' : 'Kirim Undangan'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
