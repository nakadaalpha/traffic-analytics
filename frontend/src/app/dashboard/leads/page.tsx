'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import {
  MessageSquare,
  RefreshCw,
  Search,
  Filter,
  Plus,
  Download,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  UserCheck,
  Flame,
  X,
  Phone,
  Mail,
  Share2,
  Trash2,
  Layers,
  ArrowUpDown,
  Check,
  Send,
  HelpCircle,
} from 'lucide-react';
import { useProject } from '@/context/ProjectContext';

type LeadPlatform = 'whatsapp' | 'instagram' | 'facebook' | 'gmail';
type LeadStatus = 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'CONVERTED' | 'SPAM';

interface InboundLead {
  id: string;
  projectId: string;
  userId: string;
  connectionId: string | null;
  platform: LeadPlatform;
  externalSenderId: string;
  senderName: string | null;
  senderHandle: string | null;
  lastMessage: string | null;
  threadId: string | null;
  status: LeadStatus;
  sourceAttribution: string | null;
  unread: boolean;
  firstContactAt: string;
  lastContactAt: string;
  createdAt: string;
}

interface LeadStats {
  totalLeads: number;
  newToday: number;
  qualifiedRate: string;
  byPlatform: Record<string, number>;
  byStatus: Record<string, number>;
}

function parseUtcDate(dateStr: string | null | undefined): Date | null {
  if (!dateStr) return null;
  const normalized = dateStr.includes('T') ? dateStr : dateStr.replace(' ', 'T') + (dateStr.endsWith('Z') ? '' : 'Z');
  const d = new Date(normalized);
  return isNaN(d.getTime()) ? null : d;
}

function formatLocalDateTime(dateStr: string | null | undefined): string {
  const d = parseUtcDate(dateStr);
  return d ? d.toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' }) : '-';
}

function getPlatformMeta(platform: string) {
  switch (platform.toLowerCase()) {
    case 'whatsapp':
      return {
        name: 'WhatsApp',
        badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        dotColor: 'bg-emerald-500',
        textColor: 'text-emerald-600',
        icon: (
          <svg className="w-4 h-4 fill-[#25D366]" viewBox="0 0 24 24">
            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
          </svg>
        ),
      };
    case 'instagram':
      return {
        name: 'Instagram DM',
        badgeClass: 'bg-pink-50 text-pink-700 border-pink-200',
        dotColor: 'bg-pink-500',
        textColor: 'text-pink-600',
        icon: (
          <svg className="w-4 h-4 fill-[#E1306C]" viewBox="0 0 24 24">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
          </svg>
        ),
      };
    case 'facebook':
      return {
        name: 'Messenger',
        badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
        dotColor: 'bg-[#1877F2]',
        textColor: 'text-[#1877F2]',
        icon: (
          <svg className="w-4 h-4 fill-[#1877F2]" viewBox="0 0 24 24">
            <path d="M12 2C6.477 2 2 6.145 2 11.258c0 2.91 1.455 5.512 3.736 7.18V22l3.435-1.884c.899.25 1.854.384 2.829.384 5.523 0 10-4.145 10-9.258C22 6.145 17.523 2 12 2zm1.066 12.434l-2.716-2.898-5.3 2.898 5.83-6.19 2.784 2.898 5.232-2.898-5.83 6.19z"/>
          </svg>
        ),
      };
    case 'gmail':
      return {
        name: 'Gmail',
        badgeClass: 'bg-red-50 text-red-700 border-red-200',
        dotColor: 'bg-red-500',
        textColor: 'text-red-600',
        icon: (
          <svg className="w-4 h-4 fill-[#EA4335]" viewBox="0 0 24 24">
            <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.272H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L12 9.49l8.073-5.997c1.618-1.214 3.927-.059 3.927 1.964z"/>
          </svg>
        ),
      };
    default:
      return {
        name: platform,
        badgeClass: 'bg-zinc-100 text-zinc-700 border-zinc-200',
        dotColor: 'bg-zinc-400',
        textColor: 'text-zinc-600',
        icon: <MessageSquare className="w-4 h-4 text-zinc-500" />,
      };
  }
}

function getStatusMeta(status: LeadStatus) {
  switch (status) {
    case 'NEW':
      return {
        label: 'Baru',
        badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
        dotClass: 'bg-blue-500',
      };
    case 'CONTACTED':
      return {
        label: 'Dihubungi',
        badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
        dotClass: 'bg-amber-500',
      };
    case 'QUALIFIED':
      return {
        label: 'Terkualifikasi',
        badgeClass: 'bg-purple-50 text-purple-700 border-purple-200',
        dotClass: 'bg-purple-500',
      };
    case 'CONVERTED':
      return {
        label: 'Terkonversi',
        badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        dotClass: 'bg-emerald-500',
      };
    case 'SPAM':
      return {
        label: 'Spam',
        badgeClass: 'bg-zinc-100 text-zinc-600 border-zinc-300',
        dotClass: 'bg-zinc-400',
      };
    default:
      return {
        label: status,
        badgeClass: 'bg-zinc-100 text-zinc-700 border-zinc-200',
        dotClass: 'bg-zinc-400',
      };
  }
}

function getChatLink(lead: InboundLead): string {
  switch (lead.platform) {
    case 'whatsapp': {
      const cleanPhone = lead.externalSenderId.replace(/[^0-9]/g, '');
      return `https://wa.me/${cleanPhone}`;
    }
    case 'instagram': {
      const handle = (lead.senderHandle || lead.externalSenderId || '').replace('@', '');
      return `https://instagram.com/${handle}`;
    }
    case 'facebook': {
      return `https://m.me/${lead.externalSenderId}`;
    }
    case 'gmail': {
      const email = lead.senderHandle || lead.externalSenderId;
      return `mailto:${email}`;
    }
    default:
      return '#';
  }
}

export default function LeadsPage() {
  const { currentProject } = useProject();

  const [leads, setLeads] = useState<InboundLead[]>([]);
  const [stats, setStats] = useState<LeadStats>({
    totalLeads: 0,
    newToday: 0,
    qualifiedRate: '0.0%',
    byPlatform: {},
    byStatus: {},
  });
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedLead, setSelectedLead] = useState<InboundLead | null>(null);

  // Modal State Tambah Lead Manual
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addPlatform, setAddPlatform] = useState<LeadPlatform>('whatsapp');
  const [addSenderName, setAddSenderName] = useState('');
  const [addSenderId, setAddSenderId] = useState('');
  const [addSenderHandle, setAddSenderHandle] = useState('');
  const [addMessage, setAddMessage] = useState('');
  const [addStatus, setAddStatus] = useState<LeadStatus>('NEW');
  const [addAttribution, setAddAttribution] = useState('');
  const [submittingAdd, setSubmittingAdd] = useState(false);

  // Notification State
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showNotification = useCallback((type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4500);
  }, []);

  // Fetch Leads
  const fetchLeads = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (currentProject?.id) params.set('projectId', currentProject.id);
      if (selectedPlatform && selectedPlatform !== 'all') params.set('platform', selectedPlatform);
      if (selectedStatus && selectedStatus !== 'all') params.set('status', selectedStatus);
      if (searchQuery.trim()) params.set('search', searchQuery.trim());

      const res = await fetch(`/api/composio/leads?${params.toString()}`);
      const data = await res.json().catch(() => ({}));

      if (data.success && data.data) {
        setLeads(data.data.leads || []);
        if (data.data.stats || data.data.summary) {
          setStats(data.data.stats || data.data.summary);
        }
      }
    } catch (err: any) {
      console.error('Error fetching leads:', err);
    } finally {
      setLoading(false);
    }
  }, [currentProject?.id, selectedPlatform, selectedStatus, searchQuery]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  // Sync Multi-Channel Leads via Composio
  const handleSyncLeads = async () => {
    try {
      setIsSyncing(true);
      const res = await fetch('/api/composio/leads/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: currentProject?.id }),
      });
      const data = await res.json().catch(() => ({}));

      if (data.success) {
        showNotification('success', data.message || 'Sinkronisasi prospek multi-channel berhasil!');
        await fetchLeads();
      } else {
        showNotification('error', data.error || 'Gagal menyinkronkan leads dari platform terhubung');
      }
    } catch (err: any) {
      showNotification('error', 'Terjadi gangguan jaringan saat sinkronisasi');
    } finally {
      setIsSyncing(false);
    }
  };

  // Quick Status Change with Optimistic UI Update
  const handleStatusChange = async (leadId: string, nextStatus: LeadStatus) => {
    const prevLeads = [...leads];
    setLeads((prev) =>
      prev.map((lead) => (lead.id === leadId ? { ...lead, status: nextStatus, unread: false } : lead))
    );

    try {
      const res = await fetch(`/api/composio/leads/${leadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus, unread: false }),
      });
      const data = await res.json().catch(() => ({}));

      if (!data.success) {
        setLeads(prevLeads);
        showNotification('error', data.error || 'Gagal memperbarui status');
      } else {
        if (selectedLead?.id === leadId) {
          setSelectedLead((curr) => (curr ? { ...curr, status: nextStatus, unread: false } : null));
        }
      }
    } catch {
      setLeads(prevLeads);
      showNotification('error', 'Gagal terhubung ke server');
    }
  };

  // Toggle Unread State
  const handleToggleUnread = async (lead: InboundLead) => {
    const nextUnread = !lead.unread;
    setLeads((prev) =>
      prev.map((l) => (l.id === lead.id ? { ...l, unread: nextUnread } : l))
    );

    try {
      await fetch(`/api/composio/leads/${lead.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ unread: nextUnread }),
      });
      if (selectedLead?.id === lead.id) {
        setSelectedLead((curr) => (curr ? { ...curr, unread: nextUnread } : null));
      }
    } catch {
      // Revert if error
      setLeads((prev) =>
        prev.map((l) => (l.id === lead.id ? { ...l, unread: lead.unread } : l))
      );
    }
  };

  // Delete Lead
  const handleDeleteLead = async (leadId: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus data prospek ini?')) return;

    try {
      const res = await fetch(`/api/composio/leads/${leadId}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));

      if (data.success) {
        showNotification('success', 'Lead berhasil dihapus');
        setLeads((prev) => prev.filter((l) => l.id !== leadId));
        if (selectedLead?.id === leadId) setSelectedLead(null);
      } else {
        showNotification('error', data.error || 'Gagal menghapus lead');
      }
    } catch {
      showNotification('error', 'Gangguan saat menghubungi server');
    }
  };

  // Submit Manual Lead
  const handleCreateManualLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addSenderId.trim()) {
      alert('Mohon masukkan nomor HP, username, atau email pengirim.');
      return;
    }

    try {
      setSubmittingAdd(true);
      const res = await fetch('/api/composio/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: currentProject?.id || 'prj_default',
          platform: addPlatform,
          externalSenderId: addSenderId.trim(),
          senderName: addSenderName.trim() || undefined,
          senderHandle: addSenderHandle.trim() || undefined,
          lastMessage: addMessage.trim() || undefined,
          status: addStatus,
          sourceAttribution: addAttribution.trim() || 'Manual Input',
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (data.success) {
        showNotification('success', 'Prospek baru berhasil dicatat!');
        setIsAddModalOpen(false);
        // Reset form
        setAddSenderName('');
        setAddSenderId('');
        setAddSenderHandle('');
        setAddMessage('');
        setAddStatus('NEW');
        setAddAttribution('');
        await fetchLeads();
      } else {
        showNotification('error', data.error || 'Gagal menyimpan prospek');
      }
    } catch {
      showNotification('error', 'Terjadi kesalahan sistem');
    } finally {
      setSubmittingAdd(false);
    }
  };

  // Export to CSV
  const handleExportCsv = () => {
    if (leads.length === 0) {
      alert('Tidak ada data leads untuk diekspor.');
      return;
    }

    const headers = ['ID', 'Platform', 'Sender Name', 'Contact/Handle', 'Last Message', 'Status', 'Attribution', 'First Contact', 'Last Contact'];
    const rows = leads.map((l) => [
      `"${l.id}"`,
      `"${l.platform}"`,
      `"${(l.senderName || '').replace(/"/g, '""')}"`,
      `"${(l.senderHandle || l.externalSenderId || '').replace(/"/g, '""')}"`,
      `"${(l.lastMessage || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`,
      `"${l.status}"`,
      `"${(l.sourceAttribution || '').replace(/"/g, '""')}"`,
      `"${l.firstContactAt}"`,
      `"${l.lastContactAt}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `firenalytics_leads_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Top Channel Calculation
  const topPlatformInfo = useMemo(() => {
    const counts = stats.byPlatform || {};
    let max = 0;
    let top = 'whatsapp';
    Object.entries(counts).forEach(([plat, count]) => {
      if (count > max) {
        max = count;
        top = plat;
      }
    });
    return { platform: top, count: max };
  }, [stats.byPlatform]);

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg border text-xs font-medium transition-all ${
            notification.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-red-50 text-red-800 border-red-200'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl font-bold text-zinc-900 tracking-tight">Leads & Pesan Masuk</h1>
            {currentProject && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-zinc-100 text-zinc-700 border border-zinc-200">
                <Layers className="w-3 h-3 text-zinc-500" />
                {currentProject.name}
              </span>
            )}
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              Omni-Channel Inbox
            </span>
          </div>
          <p className="text-xs text-zinc-500">
            Pelacakan prospek dan pesan privat otomatis dari WhatsApp Business, Instagram DM, Facebook Messenger, dan Gmail.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleExportCsv}
            disabled={leads.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 text-xs font-medium shadow-sm transition-colors disabled:opacity-50"
            title="Ekspor CSV"
          >
            <Download className="w-3.5 h-3.5 text-zinc-500" />
            <span>Ekspor CSV</span>
          </button>

          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 text-xs font-medium shadow-sm transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-zinc-500" />
            <span>Tambah Prospek</span>
          </button>

          <button
            type="button"
            onClick={handleSyncLeads}
            disabled={isSyncing}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium shadow-sm transition-colors disabled:opacity-60"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Menyinkronkan...' : 'Sinkronkan Leads'}</span>
          </button>
        </div>
      </div>

      {/* KPI Highlight Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Leads */}
        <div className="p-4 rounded-xl bg-white border border-zinc-200 shadow-sm">
          <div className="flex items-center justify-between text-zinc-500 mb-2">
            <span className="text-xs font-medium">Total Prospek Masuk</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <MessageSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-zinc-900 tracking-tight">
            {stats.totalLeads.toLocaleString('id-ID')}
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-[11px] text-zinc-500">
            <span className="text-emerald-600 font-medium">Terhubung</span>
            <span>ke seluruh saluran sosial & email</span>
          </div>
        </div>

        {/* Card 2: Leads Baru Hari Ini */}
        <div className="p-4 rounded-xl bg-white border border-zinc-200 shadow-sm">
          <div className="flex items-center justify-between text-zinc-500 mb-2">
            <span className="text-xs font-medium">Leads Baru Hari Ini</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-zinc-900 tracking-tight">
            +{stats.newToday}
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-[11px] text-zinc-500">
            <Clock className="w-3 h-3 text-zinc-400" />
            <span>Diperbarui secara real-time</span>
          </div>
        </div>

        {/* Card 3: Qualified Rate */}
        <div className="p-4 rounded-xl bg-white border border-zinc-200 shadow-sm">
          <div className="flex items-center justify-between text-zinc-500 mb-2">
            <span className="text-xs font-medium">Tingkat Kualifikasi</span>
            <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-zinc-900 tracking-tight">
            {stats.qualifiedRate}
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-[11px] text-zinc-500">
            <span>{(stats.byStatus?.QUALIFIED || 0) + (stats.byStatus?.CONVERTED || 0)} prospek lolos kualifikasi</span>
          </div>
        </div>

        {/* Card 4: Top Channel */}
        <div className="p-4 rounded-xl bg-white border border-zinc-200 shadow-sm">
          <div className="flex items-center justify-between text-zinc-500 mb-2">
            <span className="text-xs font-medium">Saluran Terpopuler</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-zinc-900 tracking-tight capitalize flex items-center gap-2">
            {getPlatformMeta(topPlatformInfo.platform).icon}
            <span>{getPlatformMeta(topPlatformInfo.platform).name}</span>
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-[11px] text-zinc-500">
            <span>{topPlatformInfo.count} pesan masuk terlacak</span>
          </div>
        </div>
      </div>

      {/* Main Filter Tabs & Search Console */}
      <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-4 space-y-4">
        {/* Platform Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
          <button
            type="button"
            onClick={() => setSelectedPlatform('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              selectedPlatform === 'all'
                ? 'bg-zinc-900 text-white shadow-sm'
                : 'bg-zinc-100 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/80'
            }`}
          >
            <span>Semua Saluran</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20 text-current">
              {stats.totalLeads}
            </span>
          </button>

          {(['whatsapp', 'instagram', 'facebook', 'gmail'] as LeadPlatform[]).map((plat) => {
            const meta = getPlatformMeta(plat);
            const count = stats.byPlatform?.[plat] || 0;
            const isSelected = selectedPlatform === plat;

            return (
              <button
                key={plat}
                type="button"
                onClick={() => setSelectedPlatform(plat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 border ${
                  isSelected
                    ? 'border-zinc-900 bg-zinc-900 text-white shadow-sm'
                    : 'border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50'
                }`}
              >
                {meta.icon}
                <span>{meta.name}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-semibold ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-zinc-100 text-zinc-600'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Status Filter Pills & Search Input */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-zinc-100">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            <span className="text-xs text-zinc-400 font-medium mr-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" />
              Status:
            </span>
            <button
              type="button"
              onClick={() => setSelectedStatus('all')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                selectedStatus === 'all'
                  ? 'bg-zinc-800 text-white'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
              }`}
            >
              Semua
            </button>
            {(['NEW', 'CONTACTED', 'QUALIFIED', 'CONVERTED', 'SPAM'] as LeadStatus[]).map((st) => {
              const meta = getStatusMeta(st);
              const isSelected = selectedStatus === st;
              const count = stats.byStatus?.[st] || 0;

              return (
                <button
                  key={st}
                  type="button"
                  onClick={() => setSelectedStatus(st)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors flex items-center gap-1 border ${
                    isSelected
                      ? 'border-zinc-800 bg-zinc-800 text-white'
                      : `${meta.badgeClass} hover:opacity-80`
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : meta.dotClass}`} />
                  <span>{meta.label}</span>
                  <span className="opacity-80 text-[10px]">({count})</span>
                </button>
              );
            })}
          </div>

          {/* Search Bar */}
          <div className="relative min-w-[240px]">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama, handle, atau pesan..."
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-zinc-200 bg-zinc-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900 transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Leads Table / List */}
      <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-zinc-500 space-y-2">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto text-zinc-400" />
            <p className="text-xs font-medium">Memuat data prospek masuk...</p>
          </div>
        ) : leads.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-zinc-100 text-zinc-400 mx-auto flex items-center justify-center">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-zinc-900">Belum Ada Prospek Terlacak</h3>
              <p className="text-xs text-zinc-500 max-w-md mx-auto mt-1">
                Pesan dari WhatsApp, Instagram DM, Facebook Messenger, dan Gmail akan muncul otomatis di sini saat pelanggan mengirim pesan atau Anda dapat mencatat prospek secara manual.
              </p>
            </div>
            <div className="pt-2 flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 text-white text-xs font-medium hover:bg-zinc-800 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Prospek Manual</span>
              </button>
              <Link
                href="/dashboard/social"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 text-zinc-700 text-xs font-medium hover:bg-zinc-50 transition-colors"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Cek Koneksi Akun</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50/70 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Saluran & Kontak</th>
                  <th className="py-3 px-4">Pesan Terakhir</th>
                  <th className="py-3 px-4">Status Pipeline</th>
                  <th className="py-3 px-4">Waktu Kontak</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200/70 text-xs">
                {leads.map((lead) => {
                  const platMeta = getPlatformMeta(lead.platform);
                  const statusMeta = getStatusMeta(lead.status);
                  const chatUrl = getChatLink(lead);

                  return (
                    <tr
                      key={lead.id}
                      className={`hover:bg-zinc-50/80 transition-colors ${
                        lead.unread ? 'bg-blue-50/20 font-medium' : ''
                      }`}
                    >
                      {/* Kolom Saluran & Kontak */}
                      <td className="py-3 px-4">
                        <div className="flex items-start gap-2.5">
                          <div className="mt-0.5 relative flex-shrink-0">
                            <div className="p-1.5 rounded-lg border border-zinc-200 bg-white shadow-xs">
                              {platMeta.icon}
                            </div>
                            {lead.unread && (
                              <span
                                className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-blue-600 ring-2 ring-white"
                                title="Pesan Belum Dibaca"
                              />
                            )}
                          </div>
                          <div>
                            <div className="font-semibold text-zinc-900 flex items-center gap-1.5">
                              <span>{lead.senderName || lead.senderHandle || lead.externalSenderId}</span>
                              <span className={`text-[10px] px-1.5 py-0.2 rounded border font-medium ${platMeta.badgeClass}`}>
                                {platMeta.name}
                              </span>
                            </div>
                            <div className="text-[11px] text-zinc-500 font-normal">
                              {lead.senderHandle || lead.externalSenderId}
                            </div>
                            {lead.sourceAttribution && (
                              <div className="text-[10px] text-zinc-400 mt-0.5">
                                Ref: {lead.sourceAttribution}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Kolom Pesan Terakhir */}
                      <td className="py-3 px-4 max-w-xs md:max-w-md">
                        <div
                          onClick={() => setSelectedLead(lead)}
                          className="text-zinc-700 hover:text-zinc-900 cursor-pointer line-clamp-2 text-xs"
                          title="Klik untuk detail percakapan"
                        >
                          {lead.lastMessage || <span className="text-zinc-400 italic">Tidak ada pesan teks</span>}
                        </div>
                      </td>

                      {/* Kolom Status Pipeline (Interactive Dropdown) */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="relative inline-block">
                          <select
                            value={lead.status}
                            onChange={(e) => handleStatusChange(lead.id, e.target.value as LeadStatus)}
                            className={`text-[11px] font-semibold rounded-lg px-2.5 py-1 border cursor-pointer focus:outline-none transition-colors appearance-none pr-6 ${statusMeta.badgeClass}`}
                          >
                            <option value="NEW">Baru</option>
                            <option value="CONTACTED">Dihubungi</option>
                            <option value="QUALIFIED">Terkualifikasi</option>
                            <option value="CONVERTED">Terkonversi</option>
                            <option value="SPAM">Spam</option>
                          </select>
                          <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-zinc-500">
                            ▼
                          </span>
                        </div>
                      </td>

                      {/* Kolom Waktu Kontak */}
                      <td className="py-3 px-4 whitespace-nowrap text-zinc-500 text-[11px]">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-zinc-400" />
                          <span>{formatLocalDateTime(lead.lastContactAt)}</span>
                        </div>
                      </td>

                      {/* Kolom Aksi */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Quick Chat Link */}
                          <a
                            href={chatUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => {
                              if (lead.unread) handleToggleUnread(lead);
                            }}
                            className="p-1.5 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-100 text-zinc-700 hover:text-zinc-900 transition-colors"
                            title={`Buka Chat di ${platMeta.name}`}
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>

                          {/* Detail View */}
                          <button
                            type="button"
                            onClick={() => setSelectedLead(lead)}
                            className="px-2.5 py-1 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-100 text-zinc-700 text-[11px] font-medium transition-colors"
                          >
                            Detail
                          </button>

                          {/* Delete Lead */}
                          <button
                            type="button"
                            onClick={() => handleDeleteLead(lead.id)}
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                            title="Hapus Lead"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-xs">
          <div className="bg-white w-full max-w-lg rounded-2xl border border-zinc-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-zinc-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg border border-zinc-200 bg-zinc-50">
                  {getPlatformMeta(selectedLead.platform).icon}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-zinc-900">
                    {selectedLead.senderName || selectedLead.senderHandle || selectedLead.externalSenderId}
                  </h3>
                  <p className="text-xs text-zinc-500">
                    {getPlatformMeta(selectedLead.platform).name} • {selectedLead.senderHandle || selectedLead.externalSenderId}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLead(null)}
                className="p-1.5 text-zinc-400 hover:text-zinc-700 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto text-xs">
              {/* Message Box */}
              <div>
                <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider block mb-1.5">
                  Isi Pesan Terakhir
                </label>
                <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200 text-zinc-800 whitespace-pre-wrap leading-relaxed">
                  {selectedLead.lastMessage || 'Tidak ada pesan teks tercatat.'}
                </div>
              </div>

              {/* Status & Unread */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider block mb-1.5">
                    Status Pipeline
                  </label>
                  <select
                    value={selectedLead.status}
                    onChange={(e) => handleStatusChange(selectedLead.id, e.target.value as LeadStatus)}
                    className="w-full text-xs font-medium rounded-lg px-3 py-2 border border-zinc-200 bg-white focus:outline-none focus:ring-1 focus:ring-zinc-900"
                  >
                    <option value="NEW">Baru</option>
                    <option value="CONTACTED">Dihubungi</option>
                    <option value="QUALIFIED">Terkualifikasi</option>
                    <option value="CONVERTED">Terkonversi</option>
                    <option value="SPAM">Spam</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider block mb-1.5">
                    Status Baca
                  </label>
                  <button
                    type="button"
                    onClick={() => handleToggleUnread(selectedLead)}
                    className={`w-full py-2 px-3 rounded-lg border text-xs font-medium transition-colors text-center ${
                      selectedLead.unread
                        ? 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100'
                        : 'bg-zinc-100 border-zinc-200 text-zinc-700 hover:bg-zinc-200'
                    }`}
                  >
                    {selectedLead.unread ? '● Belum Dibaca' : '✓ Sudah Dibaca'}
                  </button>
                </div>
              </div>

              {/* Metadata Info */}
              <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200 space-y-2 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Sumber Atribusi:</span>
                  <span className="font-medium text-zinc-800">{selectedLead.sourceAttribution || 'Direct Inbound'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Kontak Pertama:</span>
                  <span className="font-medium text-zinc-800">{formatLocalDateTime(selectedLead.firstContactAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Kontak Terakhir:</span>
                  <span className="font-medium text-zinc-800">{formatLocalDateTime(selectedLead.lastContactAt)}</span>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-zinc-200 bg-zinc-50/50 flex items-center justify-between">
              <button
                type="button"
                onClick={() => handleDeleteLead(selectedLead.id)}
                className="text-xs text-red-600 hover:text-red-700 font-medium px-2 py-1.5 rounded"
              >
                Hapus Prospek
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedLead(null)}
                  className="px-3.5 py-1.5 rounded-lg border border-zinc-200 bg-white text-zinc-700 text-xs font-medium hover:bg-zinc-100"
                >
                  Tutup
                </button>
                <a
                  href={getChatLink(selectedLead)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => {
                    if (selectedLead.unread) handleToggleUnread(selectedLead);
                  }}
                  className="px-4 py-1.5 rounded-lg bg-zinc-900 text-white text-xs font-medium hover:bg-zinc-800 flex items-center gap-1.5"
                >
                  <span>Buka Chat Langsung</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Tambah Prospek Manual */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-2xl border border-zinc-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-zinc-200 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-zinc-900">Tambah Prospek Manual</h3>
                <p className="text-xs text-zinc-500">Catat prospek dari telepon, walk-in, atau jalur kontak manual</p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 text-zinc-400 hover:text-zinc-700 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateManualLead} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="text-[11px] font-semibold text-zinc-600 block mb-1">
                  Pilih Saluran Komunikasi <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(['whatsapp', 'instagram', 'facebook', 'gmail'] as LeadPlatform[]).map((p) => {
                    const m = getPlatformMeta(p);
                    const isSel = addPlatform === p;
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setAddPlatform(p)}
                        className={`p-2 rounded-lg border text-center flex flex-col items-center gap-1 transition-colors ${
                          isSel ? 'border-zinc-900 bg-zinc-900 text-white' : 'border-zinc-200 bg-white hover:bg-zinc-50'
                        }`}
                      >
                        {m.icon}
                        <span className="text-[10px] font-medium">{m.name.split(' ')[0]}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-zinc-600 block mb-1">
                  Nomor HP / Email / ID Pengirim <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={addSenderId}
                  onChange={(e) => setAddSenderId(e.target.value)}
                  placeholder={
                    addPlatform === 'whatsapp'
                      ? '6281234567890'
                      : addPlatform === 'gmail'
                      ? 'client@company.com'
                      : '@username'
                  }
                  className="w-full px-3 py-2 rounded-lg border border-zinc-200 focus:outline-none focus:ring-1 focus:ring-zinc-900 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-zinc-600 block mb-1">
                    Nama Kontak / Pengirim
                  </label>
                  <input
                    type="text"
                    value={addSenderName}
                    onChange={(e) => setAddSenderName(e.target.value)}
                    placeholder="Contoh: Budi Santoso"
                    className="w-full px-3 py-2 rounded-lg border border-zinc-200 focus:outline-none focus:ring-1 focus:ring-zinc-900 text-xs"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-zinc-600 block mb-1">
                    Handle / Alias
                  </label>
                  <input
                    type="text"
                    value={addSenderHandle}
                    onChange={(e) => setAddSenderHandle(e.target.value)}
                    placeholder="@budis"
                    className="w-full px-3 py-2 rounded-lg border border-zinc-200 focus:outline-none focus:ring-1 focus:ring-zinc-900 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-zinc-600 block mb-1">
                  Pesan / Catatan Permintaan Awal
                </label>
                <textarea
                  rows={3}
                  value={addMessage}
                  onChange={(e) => setAddMessage(e.target.value)}
                  placeholder="Isi pesan awal, kebutuhan produk, atau pertanyaan prospek..."
                  className="w-full px-3 py-2 rounded-lg border border-zinc-200 focus:outline-none focus:ring-1 focus:ring-zinc-900 text-xs resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-zinc-600 block mb-1">
                    Status Pipeline
                  </label>
                  <select
                    value={addStatus}
                    onChange={(e) => setAddStatus(e.target.value as LeadStatus)}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-200 focus:outline-none focus:ring-1 focus:ring-zinc-900 text-xs"
                  >
                    <option value="NEW">Baru</option>
                    <option value="CONTACTED">Dihubungi</option>
                    <option value="QUALIFIED">Terkualifikasi</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-zinc-600 block mb-1">
                    Sumber Atribusi
                  </label>
                  <input
                    type="text"
                    value={addAttribution}
                    onChange={(e) => setAddAttribution(e.target.value)}
                    placeholder="Walk-in / Event / Referensi"
                    className="w-full px-3 py-2 rounded-lg border border-zinc-200 focus:outline-none focus:ring-1 focus:ring-zinc-900 text-xs"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-zinc-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg border border-zinc-200 text-zinc-700 text-xs font-medium hover:bg-zinc-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingAdd}
                  className="px-4 py-1.5 rounded-lg bg-zinc-900 text-white text-xs font-medium hover:bg-zinc-800 disabled:opacity-60 transition-colors"
                >
                  {submittingAdd ? 'Menyimpan...' : 'Simpan Prospek'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
