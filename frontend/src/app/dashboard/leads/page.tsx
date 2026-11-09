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
  LayoutGrid,
  List,
  Calendar,
  DollarSign,
  Globe,
  ArrowRight,
  FileText,
  ChevronRight,
  Inbox,
  Tag,
  GripVertical,
} from 'lucide-react';
import { useProject } from '@/context/ProjectContext';

// Helper format angka rupiah dengan pemisah ribuan
const formatRupiahDisplay = (val: string | number | undefined) => {
  if (val === undefined || val === null || val === '') return '';
  const clean = String(val).replace(/\D/g, '');
  if (!clean) return '';
  return new Intl.NumberFormat('id-ID').format(Number(clean));
};

const parseRupiahRaw = (val: string) => {
  return val.replace(/\D/g, '');
};

const QUICK_NOTE_CHIPS = [
  'Telepon Tidak Diangkat',
  'Minta Proposal via WA',
  'Janji Telepon Ulang',
  'Tertarik Paket Promo',
  'Harga Belum Cocok',
  'Menunggu Keputusan Direksi',
];

type LeadPlatform = 'whatsapp' | 'instagram' | 'facebook' | 'gmail' | 'website';
type LeadStatus = 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'NEGOTIATION' | 'CONVERTED' | 'LOST' | 'SPAM';

export interface LeadNote {
  id: string;
  author: string;
  text: string;
  createdAt: string;
}

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
  dealValue?: number;
  nextFollowUpAt?: string | null;
  notes?: string | null;
  sourceAttribution: string | null;
  unread: boolean;
  firstContactAt: string;
  lastContactAt: string;
  createdAt: string;
}

interface LeadStats {
  totalLeads: number;
  newToday: number;
  followUpDueToday?: number;
  totalRevenue?: number;
  qualifiedRate: string;
  byPlatform: Record<string, number>;
  byStatus: Record<string, number>;
}

const KANBAN_STAGES: { status: LeadStatus; label: string; desc: string }[] = [
  { status: 'NEW', label: 'Baru', desc: 'Pesan masuk belum direspons' },
  { status: 'CONTACTED', label: 'Dihubungi', desc: 'Sudah dihubungi / chat aktif' },
  { status: 'QUALIFIED', label: 'Kualifikasi', desc: 'Minat tinggi & sesuai target' },
  { status: 'NEGOTIATION', label: 'Negosiasi', desc: 'Tahap penawaran harga' },
  { status: 'CONVERTED', label: 'Deal / Won', desc: 'Closing berhasil' },
  { status: 'LOST', label: 'Lost / Batal', desc: 'Tidak berminat / batal' },
];

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

function getInitials(name: string | null | undefined): string {
  if (!name) return '?';
  const clean = name.replace('@', '').trim();
  const parts = clean.split(/[\s._-]+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return clean.slice(0, 2).toUpperCase() || '?';
}

function getAvatarColor(str: string): string {
  const colors = [
    'bg-blue-100 text-blue-700 border-blue-200',
    'bg-purple-100 text-purple-700 border-purple-200',
    'bg-amber-100 text-amber-700 border-amber-200',
    'bg-emerald-100 text-emerald-700 border-emerald-200',
    'bg-pink-100 text-pink-700 border-pink-200',
    'bg-indigo-100 text-indigo-700 border-indigo-200',
    'bg-teal-100 text-teal-700 border-teal-200',
    'bg-orange-100 text-orange-700 border-orange-200',
  ];
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

function formatRelativeTime(dateStr: string | null | undefined): string {
  const d = parseUtcDate(dateStr);
  if (!d) return '-';
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / (60 * 1000));
  const diffHours = Math.floor(diffMs / (60 * 60 * 1000));
  const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));

  if (diffMins < 1) return 'Baru saja';
  if (diffMins < 60) return `${diffMins}m lalu`;
  if (diffHours < 24) return `${diffHours}j lalu`;
  if (diffDays === 1) return 'Kemarin';
  if (diffDays < 7) return `${diffDays}h lalu`;
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
}

function getNoteCount(notesJson: string | null | undefined): number {
  if (!notesJson) return 0;
  try {
    const parsed = JSON.parse(notesJson);
    if (Array.isArray(parsed)) return parsed.length;
    return 1;
  } catch {
    return notesJson.trim() ? 1 : 0;
  }
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
    case 'website':
      return {
        name: 'Formulir Web',
        badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        dotColor: 'bg-indigo-500',
        textColor: 'text-indigo-600',
        icon: <Globe className="w-4 h-4 text-indigo-600" />,
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
        accentBorder: 'border-t-blue-500',
        pillClass: 'bg-blue-100 text-blue-800',
        dropZoneClass: 'border-2 border-dashed border-blue-400 bg-blue-50/30 ring-2 ring-blue-300/30 ring-inset',
      };
    case 'CONTACTED':
      return {
        label: 'Dihubungi',
        badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
        dotClass: 'bg-amber-500',
        accentBorder: 'border-t-amber-500',
        pillClass: 'bg-amber-100 text-amber-800',
        dropZoneClass: 'border-2 border-dashed border-amber-400 bg-amber-50/30 ring-2 ring-amber-300/30 ring-inset',
      };
    case 'QUALIFIED':
      return {
        label: 'Kualifikasi',
        badgeClass: 'bg-purple-50 text-purple-700 border-purple-200',
        dotClass: 'bg-purple-500',
        accentBorder: 'border-t-purple-500',
        pillClass: 'bg-purple-100 text-purple-800',
        dropZoneClass: 'border-2 border-dashed border-purple-400 bg-purple-50/30 ring-2 ring-purple-300/30 ring-inset',
      };
    case 'NEGOTIATION':
      return {
        label: 'Negosiasi',
        badgeClass: 'bg-orange-50 text-orange-700 border-orange-200',
        dotClass: 'bg-orange-500',
        accentBorder: 'border-t-orange-500',
        pillClass: 'bg-orange-100 text-orange-800',
        dropZoneClass: 'border-2 border-dashed border-orange-400 bg-orange-50/30 ring-2 ring-orange-300/30 ring-inset',
      };
    case 'CONVERTED':
      return {
        label: 'Deal / Won',
        badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        dotClass: 'bg-emerald-500',
        accentBorder: 'border-t-emerald-500',
        pillClass: 'bg-emerald-100 text-emerald-800',
        dropZoneClass: 'border-2 border-dashed border-emerald-400 bg-emerald-50/30 ring-2 ring-emerald-300/30 ring-inset',
      };
    case 'LOST':
      return {
        label: 'Lost / Batal',
        badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
        dotClass: 'bg-rose-500',
        accentBorder: 'border-t-rose-500',
        pillClass: 'bg-rose-100 text-rose-800',
        dropZoneClass: 'border-2 border-dashed border-rose-400 bg-rose-50/30 ring-2 ring-rose-300/30 ring-inset',
      };
    case 'SPAM':
      return {
        label: 'Spam',
        badgeClass: 'bg-zinc-100 text-zinc-600 border-zinc-300',
        dotClass: 'bg-zinc-400',
        accentBorder: 'border-t-zinc-400',
        pillClass: 'bg-zinc-200 text-zinc-700',
        dropZoneClass: 'border-2 border-dashed border-zinc-400 bg-zinc-100/40 ring-2 ring-zinc-300/30 ring-inset',
      };
    default:
      return {
        label: status,
        badgeClass: 'bg-zinc-100 text-zinc-700 border-zinc-200',
        dotClass: 'bg-zinc-400',
        accentBorder: 'border-t-zinc-400',
        pillClass: 'bg-zinc-200 text-zinc-700',
        dropZoneClass: 'border-2 border-dashed border-zinc-400 bg-zinc-100/40 ring-2 ring-zinc-300/30 ring-inset',
      };
  }
}

function getChatLink(lead: InboundLead): string {
  switch (lead.platform) {
    case 'whatsapp': {
      const cleanPhone = lead.externalSenderId.replace(/[^0-9]/g, '');
      const greeting = `Halo Kak ${lead.senderName || ''}, terima kasih telah menghubungi kami. Terkait inquiry Anda "${(lead.lastMessage || '').slice(0, 45)}...", ada yang bisa kami bantu?`;
      return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(greeting.trim())}`;
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
      const subject = encodeURIComponent(`Tindak Lanjut Firenalytics - Halo ${lead.senderName || ''}`);
      return `mailto:${email}?subject=${subject}`;
    }
    case 'website': {
      if (lead.senderHandle && lead.senderHandle.includes('@')) {
        return `mailto:${lead.senderHandle}`;
      }
      const cleanPhone = (lead.senderHandle || lead.externalSenderId).replace(/[^0-9]/g, '');
      if (cleanPhone.length >= 8) {
        return `https://wa.me/${cleanPhone}`;
      }
      return '#';
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
    followUpDueToday: 0,
    totalRevenue: 0,
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

  // View Switcher (Kanban vs Table) & Follow-up Filter
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');
  const [filterDueToday, setFilterDueToday] = useState(false);

  // Kanban Drag and Drop Pipeline State
  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<LeadStatus | null>(null);

  // CRM Detail Modal State (Notes & Deal Value & Follow-Up)
  const [editDealValue, setEditDealValue] = useState<string>('');
  const [editFollowUpDate, setEditFollowUpDate] = useState<string>('');
  const [isSavingDetails, setIsSavingDetails] = useState(false);
  const [newNoteText, setNewNoteText] = useState('');
  const [submittingNote, setSubmittingNote] = useState(false);

  // Modal State Tambah Lead Manual
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addPlatform, setAddPlatform] = useState<LeadPlatform>('whatsapp');
  const [addSenderName, setAddSenderName] = useState('');
  const [addSenderId, setAddSenderId] = useState('');
  const [addSenderHandle, setAddSenderHandle] = useState('');
  const [addMessage, setAddMessage] = useState('');
  const [addStatus, setAddStatus] = useState<LeadStatus>('NEW');
  const [addDealValue, setAddDealValue] = useState('');
  const [addFollowUpDate, setAddFollowUpDate] = useState('');
  const [addNotes, setAddNotes] = useState('');
  const [addAttribution, setAddAttribution] = useState('');
  const [submittingAdd, setSubmittingAdd] = useState(false);

  // Notification State
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showNotification = useCallback((type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4500);
  }, []);

  // Sync selected lead CRM form fields
  useEffect(() => {
    if (selectedLead) {
      setEditDealValue(selectedLead.dealValue ? String(selectedLead.dealValue) : '');
      setEditFollowUpDate(
        selectedLead.nextFollowUpAt
          ? new Date(selectedLead.nextFollowUpAt).toISOString().slice(0, 16)
          : ''
      );
      setNewNoteText('');
    }
  }, [selectedLead?.id]);

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
          dealValue: Number(addDealValue) || 0,
          nextFollowUpAt: addFollowUpDate ? new Date(addFollowUpDate).toISOString() : undefined,
          notes: addNotes.trim() || undefined,
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
        setAddDealValue('');
        setAddFollowUpDate('');
        setAddNotes('');
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

  // Append Internal Sales Note to Lead
  const handleAddNote = async (leadId: string) => {
    if (!newNoteText.trim()) return;
    try {
      setSubmittingNote(true);
      const res = await fetch(`/api/composio/leads/${leadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appendNote: newNoteText.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (data.success) {
        showNotification('success', 'Catatan aktivitas penjualan berhasil disimpan');
        const textSaved = newNoteText.trim();
        setNewNoteText('');
        await fetchLeads();
        // Optimistic update on selectedLead
        setSelectedLead((prev) => {
          if (!prev) return null;
          let parsed: LeadNote[] = [];
          try {
            if (prev.notes) parsed = JSON.parse(prev.notes);
            if (!Array.isArray(parsed)) parsed = [];
          } catch {
            parsed = [];
          }
          parsed.unshift({
            id: `note_${Date.now()}`,
            author: 'Saya',
            text: textSaved,
            createdAt: new Date().toISOString(),
          });
          return { ...prev, notes: JSON.stringify(parsed) };
        });
      } else {
        showNotification('error', data.error || 'Gagal menyimpan catatan');
      }
    } catch {
      showNotification('error', 'Gangguan saat menghubungi server');
    } finally {
      setSubmittingNote(false);
    }
  };

  // Save Deal Value & Follow-Up Date in Detail Modal
  const handleSaveLeadCrmDetails = async (leadId: string) => {
    try {
      setIsSavingDetails(true);
      const res = await fetch(`/api/composio/leads/${leadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dealValue: Number(editDealValue) || 0,
          nextFollowUpAt: editFollowUpDate ? new Date(editFollowUpDate).toISOString() : null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (data.success) {
        showNotification('success', 'Rincian CRM prospek berhasil disimpan');
        await fetchLeads();
        setSelectedLead((prev) =>
          prev
            ? {
                ...prev,
                dealValue: Number(editDealValue) || 0,
                nextFollowUpAt: editFollowUpDate ? new Date(editFollowUpDate).toISOString() : null,
              }
            : null
        );
      } else {
        showNotification('error', data.error || 'Gagal menyimpan pembaruan');
      }
    } catch {
      showNotification('error', 'Gangguan saat menghubungi server');
    } finally {
      setIsSavingDetails(false);
    }
  };

  // Filtered Leads by Due Today or Normal
  const filteredLeads = useMemo(() => {
    if (!filterDueToday) return leads;
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);
    return leads.filter((l) => {
      if (!l.nextFollowUpAt) return false;
      if (['CONVERTED', 'LOST', 'SPAM'].includes(l.status)) return false;
      return new Date(l.nextFollowUpAt) <= endOfToday;
    });
  }, [leads, filterDueToday]);

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
          {/* View Mode Segmented Switcher */}
          <div className="flex items-center p-0.5 rounded-lg border border-zinc-200 bg-zinc-100 text-xs shadow-xs">
            <button
              type="button"
              onClick={() => setViewMode('kanban')}
              className={`px-3 py-1.5 rounded-md font-semibold flex items-center gap-1.5 transition-colors ${
                viewMode === 'kanban'
                  ? 'bg-white text-zinc-900 shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5 text-zinc-500" />
              <span>Papan Kanban</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-md font-semibold flex items-center gap-1.5 transition-colors ${
                viewMode === 'table'
                  ? 'bg-white text-zinc-900 shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              <List className="w-3.5 h-3.5 text-zinc-500" />
              <span>Daftar Tabel</span>
            </button>
          </div>

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

      {/* Prioritas Follow-up Hari Ini Alert Banner */}
      {((stats.followUpDueToday || 0) > 0 || filterDueToday) && (
        <div className="bg-gradient-to-r from-amber-50 via-amber-50 to-orange-50 border border-amber-200/90 rounded-xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-bold text-amber-950">
                  Prioritas Follow-up Hari Ini: {stats.followUpDueToday || 0} Prospek Menunggu Respon
                </h4>
                <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-200 text-amber-900 uppercase tracking-wide">
                  Action Required
                </span>
              </div>
              <p className="text-[11px] text-amber-800 mt-0.5">
                Respon prospek yang terjadwal hari ini agar alur penjualan tetap aktif dan tidak beralih ke alternatif lain.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setFilterDueToday((prev) => !prev)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 shadow-xs ${
              filterDueToday
                ? 'bg-zinc-900 text-white hover:bg-zinc-800'
                : 'bg-amber-600 hover:bg-amber-700 text-white'
            }`}
          >
            {filterDueToday ? 'Tampilkan Semua Prospek' : 'Fokus Tugas Hari Ini'}
          </button>
        </div>
      )}

      {/* KPI Highlight Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
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
            <span>ke seluruh saluran sosial & formulir</span>
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
            <span>Pesan masuk 24 jam terakhir</span>
          </div>
        </div>

        {/* Card 3: Prioritas Follow-up Hari Ini */}
        <div
          onClick={() => setFilterDueToday((prev) => !prev)}
          className={`p-4 rounded-xl border shadow-sm cursor-pointer transition-all ${
            filterDueToday
              ? 'bg-amber-50/60 border-amber-300 ring-2 ring-amber-200'
              : 'bg-white border-zinc-200 hover:border-amber-300'
          }`}
          title="Klik untuk filter tugas follow-up hari ini"
        >
          <div className="flex items-center justify-between text-zinc-500 mb-2">
            <span className="text-xs font-medium">Follow-up Hari Ini</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-amber-600 tracking-tight">
            {stats.followUpDueToday || 0}
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-[11px] text-amber-700 font-medium">
            <span>{filterDueToday ? '● Mode filter aktif' : 'Klik untuk filter tugas'}</span>
          </div>
        </div>

        {/* Card 4: Total Revenue Won */}
        <div className="p-4 rounded-xl bg-white border border-zinc-200 shadow-sm">
          <div className="flex items-center justify-between text-zinc-500 mb-2">
            <span className="text-xs font-medium">Pendapatan Deal Closing</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-600 tracking-tight truncate" title={`Rp ${(stats.totalRevenue || 0).toLocaleString('id-ID')}`}>
            Rp {((stats.totalRevenue || 0) / 1000000).toFixed(1)} jt
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-[11px] text-zinc-500">
            <span>Total dari status Deal / Won</span>
          </div>
        </div>

        {/* Card 5: Qualified Rate */}
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
            <span>{(stats.byStatus?.QUALIFIED || 0) + (stats.byStatus?.NEGOTIATION || 0) + (stats.byStatus?.CONVERTED || 0)} prospek potensial</span>
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

          {(['whatsapp', 'instagram', 'facebook', 'gmail', 'website'] as LeadPlatform[]).map((plat) => {
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
            {(['NEW', 'CONTACTED', 'QUALIFIED', 'NEGOTIATION', 'CONVERTED', 'LOST', 'SPAM'] as LeadStatus[]).map((st) => {
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

      {/* Main Content: Kanban Board vs Table View */}
      {loading ? (
        <div className="p-16 text-center text-zinc-500 space-y-2 bg-white rounded-xl border border-zinc-200">
          <RefreshCw className="w-5 h-5 animate-spin mx-auto text-zinc-400" />
          <p className="text-xs font-medium">Memuat data prospek masuk...</p>
        </div>
      ) : filteredLeads.length === 0 ? (
        <div className="p-16 text-center space-y-3 bg-white rounded-xl border border-zinc-200 shadow-sm">
          <div className="w-12 h-12 rounded-full bg-zinc-100 text-zinc-400 mx-auto flex items-center justify-center">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-zinc-900">
              {filterDueToday ? 'Tidak Ada Tugas Follow-up Hari Ini' : 'Belum Ada Prospek Terlacak'}
            </h3>
            <p className="text-xs text-zinc-500 max-w-md mx-auto mt-1">
              {filterDueToday
                ? 'Seluruh prospek yang dijadwalkan hari ini telah selesai ditindaklanjuti atau belum ada jadwal yang lewat tenggat.'
                : 'Pesan dari WhatsApp, Instagram DM, Facebook Messenger, Gmail, dan formulir website akan muncul otomatis di sini.'}
            </p>
          </div>
          <div className="pt-2 flex items-center justify-center gap-2">
            {filterDueToday ? (
              <button
                type="button"
                onClick={() => setFilterDueToday(false)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-zinc-900 text-white text-xs font-medium hover:bg-zinc-800 transition-colors"
              >
                <span>Tampilkan Seluruh Prospek</span>
              </button>
            ) : (
              <>
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
              </>
            )}
          </div>
        </div>
      ) : viewMode === 'kanban' ? (
        /* ================= KANBAN BOARD VIEW (MODERN FLUID PIPELINE) ================= */
        <div className="flex gap-4 overflow-x-auto pb-6 pt-2 px-1 items-start min-h-[720px] scrollbar-thin">
          {KANBAN_STAGES.map((col) => {
            const colLeads = filteredLeads.filter((l) => l.status === col.status);
            const colRevenue = colLeads.reduce((acc, l) => acc + (Number(l.dealValue) || 0), 0);
            const statusMeta = getStatusMeta(col.status);

            return (
              <div
                key={col.status}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = 'move';
                  if (dragOverCol !== col.status) setDragOverCol(col.status);
                }}
                onDragLeave={(e) => {
                  if (e.currentTarget.contains(e.relatedTarget as Node)) return;
                  setDragOverCol(null);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOverCol(null);
                  const targetLeadId = e.dataTransfer.getData('text/plain') || draggedLeadId;
                  if (targetLeadId) handleStatusChange(targetLeadId, col.status);
                }}
                className={`w-[308px] shrink-0 bg-zinc-50/95 border rounded-2xl flex flex-col h-[720px] shadow-xs transition-all duration-200 border-t-4 ${statusMeta.accentBorder} ${
                  dragOverCol === col.status
                    ? statusMeta.dropZoneClass
                    : 'border-zinc-200/90 hover:border-zinc-300'
                }`}
              >
                {/* Sticky Column Header with Metrics & Fast Add */}
                <div className="sticky top-0 bg-zinc-50/98 backdrop-blur-md z-30 px-3.5 pt-3.5 pb-2.5 border-b border-zinc-200/90 shrink-0 rounded-t-2xl shadow-2xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${statusMeta.dotClass} shadow-xs`} />
                      <div>
                        <h3 className="text-xs font-bold text-zinc-900">{col.label}</h3>
                        <p className="text-[10px] text-zinc-400 line-clamp-1">{col.desc}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${statusMeta.pillClass}`}>
                        {colLeads.length}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setAddStatus(col.status);
                          setIsAddModalOpen(true);
                        }}
                        className="p-1 rounded-md text-zinc-400 hover:text-zinc-800 hover:bg-zinc-200/60 transition-colors"
                        title={`Tambah Prospek ke tahap ${col.label}`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  {colRevenue > 0 && (
                    <div className="text-[11px] font-semibold text-emerald-700 mt-1.5 pt-1.5 border-t border-dashed border-zinc-200/80 flex items-center justify-between">
                      <span className="text-[10px] font-medium text-zinc-500">Nilai Pipeline:</span>
                      <span>Rp {colRevenue.toLocaleString('id-ID')}</span>
                    </div>
                  )}
                </div>

                {/* Independent Scrollable Cards Container with Buffer Padding Zone */}
                <div className="space-y-3 flex-1 overflow-y-auto px-2.5 py-2.5 scrollbar-thin">
                  {colLeads.length === 0 ? (
                    <div className="h-36 border-2 border-dashed border-zinc-200 bg-white/60 rounded-xl flex flex-col items-center justify-center text-zinc-400 text-xs gap-1.5 p-4 text-center transition-colors">
                      <Inbox className="w-6 h-6 text-zinc-300" />
                      <span className="font-semibold text-zinc-600">Belum ada prospek</span>
                      <span className="text-[10px] text-zinc-400">Tarik kartu ke sini atau klik + untuk menambah</span>
                    </div>
                  ) : (
                    colLeads.map((lead) => {
                      const platMeta = getPlatformMeta(lead.platform);
                      const chatUrl = getChatLink(lead);
                      const noteCount = getNoteCount(lead.notes);

                      return (
                        <div
                          key={lead.id}
                          draggable
                          onDragStart={(e) => {
                            e.dataTransfer.setData('text/plain', lead.id);
                            e.dataTransfer.effectAllowed = 'move';
                            setDraggedLeadId(lead.id);
                          }}
                          onDragEnd={() => {
                            setDraggedLeadId(null);
                            setDragOverCol(null);
                          }}
                          className={`group relative bg-white rounded-xl border p-3.5 shadow-xs hover:shadow-lg hover:-translate-y-1 hover:scale-[1.015] hover:z-20 transform-gpu backface-hidden transition-all duration-200 ease-out space-y-2.5 text-xs cursor-grab active:cursor-grabbing ${
                            draggedLeadId === lead.id ? 'opacity-40 scale-[0.98]' : ''
                          } ${
                            lead.unread
                              ? 'border-blue-300 ring-1 ring-blue-100 bg-blue-50/15'
                              : 'border-zinc-200/90 hover:border-zinc-300'
                          }`}
                        >
                          {/* Card Header: Avatar Initial with Platform Badge, Name, Recency & Grip */}
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2.5 min-w-0">
                              {/* Avatar Circle with initials */}
                              <div className="relative shrink-0">
                                <div
                                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-[11px] border shadow-2xs ${getAvatarColor(
                                    lead.senderName || lead.senderHandle || lead.externalSenderId
                                  )}`}
                                >
                                  {getInitials(lead.senderName || lead.senderHandle || lead.externalSenderId)}
                                </div>
                                {/* Platform Icon Badge on Avatar Corner */}
                                <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-white shadow-xs border border-zinc-100 flex items-center justify-center">
                                  <div className="scale-75 origin-center">{platMeta.icon}</div>
                                </div>
                              </div>

                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5">
                                  <span
                                    className="font-bold text-zinc-900 truncate text-xs hover:text-blue-600 cursor-pointer"
                                    onClick={() => setSelectedLead(lead)}
                                    title={lead.senderName || lead.senderHandle || lead.externalSenderId}
                                  >
                                    {lead.senderName || lead.senderHandle || lead.externalSenderId}
                                  </span>
                                  {lead.unread && (
                                    <span
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleToggleUnread(lead);
                                      }}
                                      className="w-2 h-2 rounded-full bg-blue-500 shrink-0 cursor-pointer hover:ring-2 hover:ring-blue-300"
                                      title="Pesan baru / belum dibaca (klik untuk tandai dibaca)"
                                    />
                                  )}
                                </div>
                                {lead.senderHandle && (
                                  <div className="text-[10px] text-zinc-500 truncate font-mono">
                                    {lead.senderHandle}
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              <span className="text-[10px] font-medium text-zinc-400">
                                {formatRelativeTime(lead.lastContactAt || lead.firstContactAt)}
                              </span>
                              <GripVertical className="w-3.5 h-3.5 text-zinc-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                          </div>

                          {/* Message Bubble Snippet */}
                          {lead.lastMessage && (
                            <div
                              onClick={() => setSelectedLead(lead)}
                              className="text-[11px] text-zinc-700 line-clamp-2 bg-zinc-50/90 hover:bg-zinc-100/90 p-2.5 rounded-lg border border-zinc-100 cursor-pointer transition-colors leading-relaxed"
                              title="Klik untuk melihat rincian percakapan"
                            >
                              {lead.lastMessage.startsWith('Membalas Story:') ? (
                                <span className="font-medium text-pink-700">
                                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-pink-500 mr-1.5 align-middle" />
                                  {lead.lastMessage}
                                </span>
                              ) : lead.lastMessage.includes('Story Telah Berakhir') ? (
                                <span className="text-zinc-400 italic">
                                  {lead.lastMessage}
                                </span>
                              ) : lead.lastMessage.includes('Reaksi Cepat Story') ? (
                                <span className="text-zinc-600">
                                  🔥 {lead.lastMessage}
                                </span>
                              ) : (
                                <span className="italic">"{lead.lastMessage}"</span>
                              )}
                            </div>
                          )}

                          {/* Badges: Deal Value, Follow-up & Notes */}
                          <div className="flex flex-wrap gap-1.5 items-center">
                            {Number(lead.dealValue) > 0 && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <DollarSign className="w-3 h-3" />
                                Rp {Number(lead.dealValue).toLocaleString('id-ID')}
                              </span>
                            )}

                            {lead.nextFollowUpAt && (() => {
                              const fDate = new Date(lead.nextFollowUpAt);
                              const now = new Date();
                              const isOverdue = fDate < now;
                              const isToday = fDate.toDateString() === now.toDateString();
                              return (
                                <span
                                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold border ${
                                    isOverdue
                                      ? 'bg-red-50 text-red-700 border-red-200 animate-pulse'
                                      : isToday
                                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                                      : 'bg-zinc-100 text-zinc-600 border-zinc-200'
                                  }`}
                                  title={`Jadwal Follow-up: ${fDate.toLocaleString('id-ID')}`}
                                >
                                  <Clock className="w-2.5 h-2.5" />
                                  {isOverdue ? 'Lewat: ' : isToday ? 'Hari ini ' : ''}
                                  {fDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                                </span>
                              );
                            })()}

                            {noteCount > 0 && (
                              <span
                                onClick={() => setSelectedLead(lead)}
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-zinc-100 text-zinc-600 border border-zinc-200 hover:bg-zinc-200 cursor-pointer"
                                title={`${noteCount} Catatan Aktivitas Internal`}
                              >
                                <FileText className="w-2.5 h-2.5" />
                                {noteCount}
                              </span>
                            )}
                          </div>

                          {/* Card Actions Footer */}
                          <div className="pt-2 border-t border-zinc-100 flex items-center justify-between gap-1.5">
                            {/* Quick Stage Mover */}
                            <select
                              value={lead.status}
                              onChange={(e) => handleStatusChange(lead.id, e.target.value as LeadStatus)}
                              className="text-[10px] font-semibold rounded-md px-2 py-1 border border-zinc-200 bg-zinc-50 text-zinc-700 hover:bg-white hover:border-zinc-300 focus:outline-none focus:ring-1 focus:ring-zinc-900 cursor-pointer transition-colors"
                              title="Pindahkan status pipeline"
                            >
                              {KANBAN_STAGES.map((s) => (
                                <option key={s.status} value={s.status}>
                                  {s.label}
                                </option>
                              ))}
                              <option value="SPAM">Spam</option>
                            </select>

                            <div className="flex items-center gap-1">
                              <a
                                href={chatUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={() => {
                                  if (lead.unread) handleToggleUnread(lead);
                                }}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-semibold bg-zinc-100 hover:bg-zinc-200 text-zinc-700 transition-colors"
                                title={`Buka Chat ${platMeta.name}`}
                              >
                                <span>Chat</span>
                                <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                              <button
                                type="button"
                                onClick={() => setSelectedLead(lead)}
                                className="p-1 rounded-md hover:bg-zinc-100 text-zinc-500 hover:text-zinc-900 transition-colors"
                                title="Buka Detail Prospek"
                              >
                                <FileText className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ================= TABLE LIST VIEW ================= */
        <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50/70 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Saluran & Kontak</th>
                  <th className="py-3 px-4">Pesan Terakhir</th>
                  <th className="py-3 px-4">Nilai Deal</th>
                  <th className="py-3 px-4">Jadwal Follow-up</th>
                  <th className="py-3 px-4">Status Pipeline</th>
                  <th className="py-3 px-4">Waktu Kontak</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200/70 text-xs">
                {filteredLeads.map((lead) => {
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
                          {lead.lastMessage ? (
                            lead.lastMessage.startsWith('Membalas Story:') ? (
                              <span className="font-medium text-pink-700">
                                {lead.lastMessage}
                              </span>
                            ) : lead.lastMessage.includes('Story Telah Berakhir') ? (
                              <span className="text-zinc-400 italic">
                                {lead.lastMessage}
                              </span>
                            ) : lead.lastMessage.includes('Reaksi Cepat Story') ? (
                              <span className="text-zinc-600">
                                {lead.lastMessage}
                              </span>
                            ) : (
                              lead.lastMessage
                            )
                          ) : (
                            <span className="text-zinc-400 italic">Tidak ada pesan teks</span>
                          )}
                        </div>
                      </td>

                      {/* Kolom Nilai Deal */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {Number(lead.dealValue) > 0 ? (
                          <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[11px]">
                            Rp {Number(lead.dealValue).toLocaleString('id-ID')}
                          </span>
                        ) : (
                          <span className="text-zinc-400 text-[11px]">-</span>
                        )}
                      </td>

                      {/* Kolom Jadwal Follow-up */}
                      <td className="py-3 px-4 whitespace-nowrap text-[11px]">
                        {lead.nextFollowUpAt ? (() => {
                          const fDate = new Date(lead.nextFollowUpAt);
                          const now = new Date();
                          const isOverdue = fDate < now;
                          const isToday = fDate.toDateString() === now.toDateString();
                          return (
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[11px] ${
                                isOverdue
                                  ? 'bg-red-50 text-red-700 border-red-200 font-semibold'
                                  : isToday
                                  ? 'bg-amber-50 text-amber-700 border-amber-200 font-semibold'
                                  : 'bg-zinc-100 text-zinc-600 border-zinc-200'
                              }`}
                            >
                              <Clock className="w-3 h-3" />
                              {isOverdue ? 'Lewat: ' : isToday ? 'Hari ini ' : ''}
                              {fDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                            </span>
                          );
                        })() : (
                          <span className="text-zinc-400">-</span>
                        )}
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
                            <option value="QUALIFIED">Kualifikasi</option>
                            <option value="NEGOTIATION">Negosiasi</option>
                            <option value="CONVERTED">Deal / Won</option>
                            <option value="LOST">Lost / Batal</option>
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
        </div>
      )}

      {/* Detail Modal & CRM Sales Activity Timeline */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-xs">
          <div className="bg-white w-full max-w-xl rounded-2xl border border-zinc-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
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
                className="p-1.5 text-zinc-400 hover:text-zinc-700 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
              {/* Message Box */}
              <div>
                <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider block mb-1.5">
                  Isi Pesan Terakhir
                </label>
                <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200 text-zinc-800 whitespace-pre-wrap leading-relaxed">
                  {selectedLead.lastMessage || 'Tidak ada pesan teks tercatat.'}
                </div>
              </div>

              {/* Status Pipeline & Status Baca */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider block mb-1.5">
                    Status Pipeline
                  </label>
                  <select
                    value={selectedLead.status}
                    onChange={(e) => handleStatusChange(selectedLead.id, e.target.value as LeadStatus)}
                    className="w-full text-xs font-medium rounded-lg px-3 py-2 border border-zinc-200 bg-white focus:outline-none focus:ring-1 focus:ring-zinc-900 cursor-pointer"
                  >
                    <option value="NEW">Baru</option>
                    <option value="CONTACTED">Sedang Dihubungi</option>
                    <option value="QUALIFIED">Terkualifikasi</option>
                    <option value="NEGOTIATION">Negosiasi / Proposal</option>
                    <option value="CONVERTED">Deal / Closing (Won)</option>
                    <option value="LOST">Lost (Gagal Closing)</option>
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
                    className={`w-full py-2 px-3 rounded-lg border text-xs font-medium transition-colors text-center cursor-pointer ${
                      selectedLead.unread
                        ? 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100'
                        : 'bg-zinc-100 border-zinc-200 text-zinc-700 hover:bg-zinc-200'
                    }`}
                  >
                    {selectedLead.unread ? '● Belum Dibaca' : '✓ Sudah Dibaca'}
                  </button>
                </div>
              </div>

              {/* CRM Opportunity & Follow-up Scheduler Box */}
              <div className="p-4 rounded-xl bg-emerald-50/40 border border-emerald-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-emerald-800 font-semibold text-xs">
                    <DollarSign className="w-4 h-4 text-emerald-600" />
                    <span>Peluang Transaksi & Jadwal Follow-up</span>
                  </div>
                  {selectedLead.nextFollowUpAt && (
                    <span className="text-[10px] text-zinc-500">
                      Tenggat: {formatLocalDateTime(selectedLead.nextFollowUpAt)}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-medium text-zinc-600 block mb-1">
                      Potensi Nilai Deal (Rp)
                    </label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400 font-medium text-xs">
                        Rp
                      </span>
                      <input
                        type="text"
                        value={formatRupiahDisplay(editDealValue)}
                        onChange={(e) => setEditDealValue(parseRupiahRaw(e.target.value))}
                        placeholder="Contoh: 1.500.000"
                        className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-zinc-200 bg-white text-xs font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-zinc-600 block mb-1">
                      Jadwal Follow-up Berikutnya
                    </label>
                    <input
                      type="datetime-local"
                      value={editFollowUpDate}
                      onChange={(e) => setEditFollowUpDate(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-200 bg-white text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    disabled={isSavingDetails}
                    onClick={() => handleSaveLeadCrmDetails(selectedLead.id)}
                    className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-medium text-xs transition-colors disabled:opacity-60 cursor-pointer flex items-center gap-1.5"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{isSavingDetails ? 'Menyimpan...' : 'Simpan Nilai & Jadwal'}</span>
                  </button>
                </div>
              </div>

              {/* Internal Sales Notes & Activity Timeline */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-semibold text-zinc-600 uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-zinc-500" />
                    <span>Catatan Aktivitas Penjualan ({
                      (() => {
                        if (!selectedLead.notes) return 0;
                        try {
                          const p = JSON.parse(selectedLead.notes);
                          return Array.isArray(p) ? p.length : 1;
                        } catch {
                          return 1;
                        }
                      })()
                    })</span>
                  </label>
                </div>

                {/* Quick Note Chips */}
                <div className="flex items-center flex-wrap gap-1.5">
                  <span className="text-[10px] text-zinc-400 font-medium flex items-center gap-1">
                    <Tag className="w-3 h-3" />
                    Template Cepat:
                  </span>
                  {QUICK_NOTE_CHIPS.map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() =>
                        setNewNoteText((prev) => (prev ? `${prev} • ${chip}` : chip))
                      }
                      className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-700 border border-zinc-200/80 transition-colors cursor-pointer"
                    >
                      + {chip}
                    </button>
                  ))}
                </div>

                {/* Add Note Form */}
                <div className="flex gap-2">
                  <textarea
                    rows={2}
                    value={newNoteText}
                    onChange={(e) => setNewNoteText(e.target.value)}
                    placeholder="Tulis catatan panggilan, negosiasi harga, atau klik salah satu template di atas..."
                    className="w-full px-3 py-2 rounded-lg border border-zinc-200 focus:outline-none focus:ring-1 focus:ring-zinc-900 text-xs resize-none"
                  />
                  <button
                    type="button"
                    disabled={submittingNote || !newNoteText.trim()}
                    onClick={() => handleAddNote(selectedLead.id)}
                    className="px-3.5 py-1.5 rounded-lg bg-zinc-900 text-white font-medium text-xs hover:bg-zinc-800 disabled:opacity-50 transition-colors shrink-0 self-end cursor-pointer"
                  >
                    {submittingNote ? 'Menyimpan...' : 'Kirim'}
                  </button>
                </div>

                {/* Activity Log Chronological List */}
                <div className="space-y-2 max-h-48 overflow-y-auto mt-2">
                  {(() => {
                    let notesList: LeadNote[] = [];
                    if (selectedLead.notes) {
                      try {
                        const parsed = JSON.parse(selectedLead.notes);
                        if (Array.isArray(parsed)) {
                          notesList = parsed;
                        } else {
                          notesList = [
                            {
                              id: 'note_legacy',
                              author: 'Catatan Awal',
                              text: String(selectedLead.notes),
                              createdAt: selectedLead.firstContactAt,
                            },
                          ];
                        }
                      } catch {
                        notesList = [
                          {
                            id: 'note_raw',
                            author: 'Catatan Awal',
                            text: String(selectedLead.notes),
                            createdAt: selectedLead.firstContactAt,
                          },
                        ];
                      }
                    }

                    if (notesList.length === 0) {
                      return (
                        <div className="p-3 text-center text-zinc-400 bg-zinc-50/50 rounded-lg border border-dashed border-zinc-200 text-[11px]">
                          Belum ada catatan aktivitas internal untuk prospek ini.
                        </div>
                      );
                    }

                    return notesList.map((note, idx) => (
                      <div
                        key={note.id || idx}
                        className="p-2.5 rounded-lg bg-zinc-50 border border-zinc-200 text-zinc-800 space-y-1"
                      >
                        <div className="flex items-center justify-between text-[10px] text-zinc-400">
                          <span className="font-semibold text-zinc-700">{note.author || 'Tim Penjualan'}</span>
                          <span>{formatLocalDateTime(note.createdAt)}</span>
                        </div>
                        <p className="text-xs whitespace-pre-wrap leading-relaxed">{note.text}</p>
                      </div>
                    ));
                  })()}
                </div>
              </div>

              {/* Metadata Info */}
              <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200 space-y-1.5 text-[11px]">
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

            {/* Footer */}
            <div className="p-4 border-t border-zinc-200 bg-zinc-50/50 flex items-center justify-between">
              <button
                type="button"
                onClick={() => handleDeleteLead(selectedLead.id)}
                className="text-xs text-red-600 hover:text-red-700 font-medium px-2 py-1.5 rounded transition-colors cursor-pointer"
              >
                Hapus Prospek
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedLead(null)}
                  className="px-3.5 py-1.5 rounded-lg border border-zinc-200 bg-white text-zinc-700 text-xs font-medium hover:bg-zinc-100 transition-colors cursor-pointer"
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
                  className="px-4 py-1.5 rounded-lg bg-zinc-900 text-white text-xs font-medium hover:bg-zinc-800 flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
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
                <div className="grid grid-cols-5 gap-1.5">
                  {(['whatsapp', 'instagram', 'facebook', 'gmail', 'website'] as LeadPlatform[]).map((p) => {
                    const m = getPlatformMeta(p);
                    const isSel = addPlatform === p;
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setAddPlatform(p)}
                        className={`p-2 rounded-lg border text-center flex flex-col items-center gap-1 transition-colors cursor-pointer ${
                          isSel ? 'border-zinc-900 bg-zinc-900 text-white' : 'border-zinc-200 bg-white hover:bg-zinc-50'
                        }`}
                      >
                        {m.icon}
                        <span className="text-[10px] font-medium truncate max-w-full">{m.name.split(' ')[0]}</span>
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
                      : addPlatform === 'website'
                      ? 'Formulir Kontak Web / Email Prospek'
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
                    Handle / Perusahaan
                  </label>
                  <input
                    type="text"
                    value={addSenderHandle}
                    onChange={(e) => setAddSenderHandle(e.target.value)}
                    placeholder="@budis / PT Solusi Digital"
                    className="w-full px-3 py-2 rounded-lg border border-zinc-200 focus:outline-none focus:ring-1 focus:ring-zinc-900 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-zinc-600 block mb-1">
                  Pesan / Catatan Permintaan Awal
                </label>
                <textarea
                  rows={2}
                  value={addMessage}
                  onChange={(e) => setAddMessage(e.target.value)}
                  placeholder="Isi pesan awal, kebutuhan produk, atau pertanyaan prospek..."
                  className="w-full px-3 py-2 rounded-lg border border-zinc-200 focus:outline-none focus:ring-1 focus:ring-zinc-900 text-xs resize-none"
                />
              </div>

              {/* Potensi Deal & Jadwal Follow Up */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-zinc-600 block mb-1">
                    Potensi Nilai Deal (Rp)
                  </label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400 font-medium text-xs">
                      Rp
                    </span>
                    <input
                      type="text"
                      value={formatRupiahDisplay(addDealValue)}
                      onChange={(e) => setAddDealValue(parseRupiahRaw(e.target.value))}
                      placeholder="Contoh: 2.500.000"
                      className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-zinc-200 focus:outline-none focus:ring-1 focus:ring-zinc-900 text-xs font-mono"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-zinc-600 block mb-1">
                    Jadwal Follow-up
                  </label>
                  <input
                    type="datetime-local"
                    value={addFollowUpDate}
                    onChange={(e) => setAddFollowUpDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-200 focus:outline-none focus:ring-1 focus:ring-zinc-900 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-zinc-600 block mb-1">
                    Status Pipeline
                  </label>
                  <select
                    value={addStatus}
                    onChange={(e) => setAddStatus(e.target.value as LeadStatus)}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-200 focus:outline-none focus:ring-1 focus:ring-zinc-900 text-xs cursor-pointer"
                  >
                    <option value="NEW">Baru</option>
                    <option value="CONTACTED">Sedang Dihubungi</option>
                    <option value="QUALIFIED">Terkualifikasi</option>
                    <option value="NEGOTIATION">Negosiasi / Proposal</option>
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
                    placeholder="Walk-in / Event / Web"
                    className="w-full px-3 py-2 rounded-lg border border-zinc-200 focus:outline-none focus:ring-1 focus:ring-zinc-900 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-zinc-600 block mb-1">
                  Catatan Internal Awal Tim
                </label>
                <textarea
                  rows={2}
                  value={addNotes}
                  onChange={(e) => setAddNotes(e.target.value)}
                  placeholder="Catatan internal awal untuk tim sales mengenai prospek ini..."
                  className="w-full px-3 py-2 rounded-lg border border-zinc-200 focus:outline-none focus:ring-1 focus:ring-zinc-900 text-xs resize-none"
                />
              </div>

              <div className="pt-3 border-t border-zinc-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg border border-zinc-200 text-zinc-700 text-xs font-medium hover:bg-zinc-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingAdd}
                  className="px-4 py-1.5 rounded-lg bg-zinc-900 text-white text-xs font-medium hover:bg-zinc-800 disabled:opacity-60 transition-colors cursor-pointer"
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
