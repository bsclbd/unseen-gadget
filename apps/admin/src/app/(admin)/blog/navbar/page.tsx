'use client';

import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { Pencil, Plus, Trash2, Phone, Save, Loader2, Upload, X, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { TablePanel } from '@/components/ui/table-panel';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { PageHeader } from '@/components/layout/page-header';
import { apiRequest } from '@/lib/api';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000';

interface NavLink {
  id: string;
  label: string;
  url: string;
  order: number;
}

const initialLinks: NavLink[] = [
  { id: '1', label: 'Terms & Conditions', url: '/terms', order: 1 },
  { id: '2', label: 'Delivery & Return', url: '/delivery-return', order: 2 },
  { id: '3', label: 'Privacy Policy', url: '/privacy', order: 3 },
  { id: '4', label: 'Our Blogs', url: '/blog', order: 4 },
  { id: '5', label: 'Our Contacts', url: '/contact', order: 5 },
];

export default function NavbarPage() {
  const [links, setLinks] = useState<NavLink[]>(initialLinks);
  const [supportPhone, setSupportPhone] = useState('');
  const [supportLabel, setSupportLabel] = useState('Support');
  const [logo, setLogo] = useState<string | null>(null);
  const [storeName, setStoreName] = useState('');
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [savingBrand, setSavingBrand] = useState(false);
  const [savingContact, setSavingContact] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingLink, setEditingLink] = useState<NavLink | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<NavLink | null>(null);
  const [label, setLabel] = useState('');
  const [url, setUrl] = useState('');
  const logoFileRef = useRef<HTMLInputElement>(null);

  // Load existing navbar and general settings
  useEffect(() => {
    Promise.all([
      apiRequest('/cms/navbar').catch(() => null),
      apiRequest('/cms/general').catch(() => null),
    ])
      .then(([navRes, genRes]) => {
        const navData = navRes?.data as any;
        const genData = genRes?.data as any;

        if (navData && typeof navData === 'object') {
          if (Array.isArray(navData)) {
            setLinks(navData);
          } else if (Array.isArray(navData.links)) {
            setLinks(navData.links);
          }
          if (navData.supportPhone) setSupportPhone(navData.supportPhone);
          if (navData.supportLabel) setSupportLabel(navData.supportLabel);
          if (navData.logo) setLogo(navData.logo);
          if (typeof navData.storeName === 'string') setStoreName(navData.storeName);
        }

        if (genData && typeof genData === 'object') {
          if (!supportPhone && (genData.supportPhone || genData.storePhone)) {
            setSupportPhone(genData.supportPhone || genData.storePhone);
          }
          if (genData.supportLabel) setSupportLabel(genData.supportLabel);
          if (genData.logo && !navData?.logo) setLogo(genData.logo);
          if (typeof genData.storeName === 'string' && navData?.storeName === undefined) {
            setStoreName(genData.storeName);
          }
        }
      });
  }, []);

  const handleLogoUpload = async (files: FileList | null) => {
    if (!files || !files[0]) return;
    const file = files[0];
    setUploadingLogo(true);
    try {
      const data = new FormData();
      data.append('file', file);

      const token = typeof window !== 'undefined' ? localStorage.getItem('admin_access_token') : null;
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`${API_BASE}/api/admin/upload`, {
        method: 'POST',
        credentials: 'include',
        headers,
        body: data,
      });
      const json = await res.json();
      if (json.success && json.data?.url) {
        const url: string = json.data.url;
        // If url is pointing to localhost on a live production deployment, use DataURL fallback
        const isLive = typeof window !== 'undefined' && window.location.hostname !== 'localhost';
        if (isLive && url.includes('localhost:5000')) {
          const reader = new FileReader();
          reader.onload = () => {
            setLogo(reader.result as string);
            toast.success("Logo uploaded successfully! Click 'Save Brand & Logo' to apply.");
          };
          reader.readAsDataURL(file);
          return;
        }

        setLogo(url);
        toast.success("Logo uploaded successfully! Click 'Save Brand & Logo' to apply.");
      } else {
        // Fallback to FileReader so the admin is never blocked
        const reader = new FileReader();
        reader.onload = () => {
          setLogo(reader.result as string);
          toast.success("Logo loaded (local preview). Click 'Save Brand & Logo' to apply.");
        };
        reader.readAsDataURL(file);
      }
    } catch (e: unknown) {
      const reader = new FileReader();
      reader.onload = () => {
        setLogo(reader.result as string);
        toast.success("Logo loaded (local preview). Click 'Save Brand & Logo' to apply.");
      };
      reader.readAsDataURL(file);
    } finally {
      setUploadingLogo(false);
      if (logoFileRef.current) logoFileRef.current.value = '';
    }
  };

  const handleSaveBrand = async () => {
    setSavingBrand(true);
    try {
      const [navRes, genRes] = await Promise.all([
        apiRequest('/cms/navbar').catch(() => null),
        apiRequest('/cms/general').catch(() => null),
      ]);
      const currentNav = (navRes?.data && typeof navRes.data === 'object') ? (navRes.data as any) : {};
      const currentGen = (genRes?.data && typeof genRes.data === 'object') ? (genRes.data as any) : {};

      const brandLogo = logo ? logo.trim() : null;
      const brandStoreName = storeName.trim();
      const phone = supportPhone.trim();
      const label = supportLabel.trim() || 'Support';

      const navPayload = {
        ...currentNav,
        logo: brandLogo,
        storeName: brandStoreName,
        supportPhone: phone,
        supportLabel: label,
        links,
      };

      const genPayload = {
        ...currentGen,
        logo: brandLogo,
        storeName: brandStoreName,
      };

      await Promise.all([
        apiRequest('/cms/navbar', {
          method: 'PUT',
          body: JSON.stringify({ value: navPayload }),
        }),
        apiRequest('/cms/general', {
          method: 'PUT',
          body: JSON.stringify({ value: genPayload }),
        }),
      ]);

      // Also try saving to /admin/settings/general (in case SUPER_ADMIN)
      apiRequest('/admin/settings/general', {
        method: 'PUT',
        body: JSON.stringify({
          value: genPayload,
        }),
      }).catch(() => {});

      toast.success('Navbar Logo & Brand Name updated successfully!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to save brand settings');
    } finally {
      setSavingBrand(false);
    }
  };

  const handleSaveSupportContact = async () => {
    setSavingContact(true);
    try {
      const [navRes, genRes] = await Promise.all([
        apiRequest('/cms/navbar').catch(() => null),
        apiRequest('/cms/general').catch(() => null),
      ]);
      const currentNav = (navRes?.data && typeof navRes.data === 'object') ? (navRes.data as any) : {};
      const currentGen = (genRes?.data && typeof genRes.data === 'object') ? (genRes.data as any) : {};

      const brandLogo = logo ? logo.trim() : (currentNav.logo ?? null);
      const brandStoreName = storeName.trim();
      const phone = supportPhone.trim();
      const label = supportLabel.trim() || 'Support';

      const navPayload = {
        ...currentNav,
        logo: brandLogo,
        storeName: brandStoreName,
        supportPhone: phone,
        supportLabel: label,
        links: links.length ? links : (currentNav.links || []),
      };

      const genPayload = {
        ...currentGen,
        supportPhone: phone,
        supportLabel: label,
        storePhone: phone || currentGen.storePhone,
      };

      // 1. Update CMS Navbar
      await apiRequest('/cms/navbar', {
        method: 'PUT',
        body: JSON.stringify({ value: navPayload }),
      });

      // 2. Also sync to CMS General so both match 100%
      await apiRequest('/cms/general', {
        method: 'PUT',
        body: JSON.stringify({ value: genPayload }),
      }).catch(() => {});

      // 3. Also sync to /admin/settings/general
      apiRequest('/admin/settings/general', {
        method: 'PUT',
        body: JSON.stringify({ value: genPayload }),
      }).catch(() => {});

      toast.success('Navbar Support Contact updated successfully!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to save support contact');
    } finally {
      setSavingContact(false);
    }
  };

  const persistLinks = async (updatedLinks: NavLink[]) => {
    setLinks(updatedLinks);
    try {
      await apiRequest('/cms/navbar', {
        method: 'PUT',
        body: JSON.stringify({
          value: {
            logo: logo ? logo.trim() : null,
            storeName: storeName.trim(),
            supportPhone: supportPhone.trim(),
            supportLabel: supportLabel.trim() || 'Support',
            links: updatedLinks,
          },
        }),
      });
    } catch (e) {
      console.error('Failed to sync navbar links to CMS:', e);
    }
  };

  const openAdd = () => {
    setEditingLink(null);
    setLabel('');
    setUrl('');
    setIsEditing(true);
  };

  const openEdit = (link: NavLink) => {
    setEditingLink(link);
    setLabel(link.label);
    setUrl(link.url);
    setIsEditing(true);
  };

  const handleSaveLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim() || !url.trim()) {
      toast.error('Label and URL are required');
      return;
    }
    if (editingLink) {
      const updated = links.map((l) =>
        l.id === editingLink.id ? { ...l, label: label.trim(), url: url.trim() } : l
      );
      void persistLinks(updated);
      toast.success('Link updated');
    } else {
      const nextOrder = links.length ? Math.max(...links.map((l) => l.order)) + 1 : 1;
      const updated = [
        ...links,
        { id: String(Date.now()), label: label.trim(), url: url.trim(), order: nextOrder },
      ];
      void persistLinks(updated);
      toast.success('Link added');
    }
    setIsEditing(false);
  };

  const handleDelete = (link: NavLink) => {
    const updated = links.filter((l) => l.id !== link.id);
    void persistLinks(updated);
    setDeleteTarget(null);
    toast.success('Link deleted');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Navbar Management"
        description="Manage the top navigation links and hotline/support phone of your storefront."
        actions={
          <Button onClick={openAdd}>
            <Plus className="h-4 w-4" />
            Add Link
          </Button>
        }
      />

      {/* ── Brand Logo & Store Name Card ── */}
      <Card className="border-primary/20 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <ImageIcon className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-base font-bold">Navbar Store Logo & Brand Name (লোগো ও নাম)</CardTitle>
              <CardDescription className="text-xs">
                This logo and store name are displayed on the top navbar across the storefront.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700">Store / Brand Name (দোকানের নাম)</label>
              <Input
                type="text"
                placeholder="e.g. Unseen Gadget (বা ফাঁকা রাখুন)"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700">Navbar Logo (লোগো URL অথবা ফাইল আপলোড)</label>
              <div className="flex items-center gap-2">
                <Input
                  type="text"
                  placeholder="https://... or /logo.png"
                  value={logo || ''}
                  onChange={(e) => setLogo(e.target.value)}
                />
                <input
                  type="file"
                  accept="image/*"
                  ref={logoFileRef}
                  onChange={(e) => handleLogoUpload(e.target.files)}
                  style={{ display: 'none' }}
                />
                <Button
                  type="button"
                  variant="outline"
                  disabled={uploadingLogo}
                  onClick={() => logoFileRef.current?.click()}
                  className="shrink-0 gap-1.5"
                >
                  {uploadingLogo ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  Upload
                </Button>
              </div>
            </div>
          </div>

          {logo ? (
            <div className="mt-3 flex items-center justify-between rounded-lg border border-border p-2.5 bg-muted/20">
              <div className="flex items-center gap-3">
                <img
                  src={logo}
                  alt="Navbar Logo Preview"
                  className="h-9 max-w-[160px] object-contain rounded"
                />
                <div>
                  <p className="text-xs font-medium text-foreground">Active Logo Preview</p>
                  <p className="text-[11px] text-muted-foreground truncate max-w-xs">{logo}</p>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-red-600 h-7"
                onClick={() => setLogo(null)}
              >
                <X className="h-3.5 w-3.5 mr-1" /> Remove
              </Button>
            </div>
          ) : null}

          <div className="mt-4 flex justify-end">
            <Button
              type="button"
              onClick={handleSaveBrand}
              disabled={savingBrand}
              className="gap-2"
            >
              {savingBrand ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save Brand & Logo
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── Support Number / Hotline Card ── */}
      <Card className="border-primary/20 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Phone className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-base font-bold">Navbar Support Phone (হটলাইন নম্বর)</CardTitle>
              <CardDescription className="text-xs">
                This phone number and label are displayed in the header next to the search bar on desktop.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700">Support Phone Number (ফোন নম্বর)</label>
              <Input
                type="text"
                placeholder="e.g. +880 1886-054504"
                value={supportPhone}
                onChange={(e) => setSupportPhone(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700">Support Label (লেবেল)</label>
              <Input
                type="text"
                placeholder="e.g. Support or হটলাইন"
                value={supportLabel}
                onChange={(e) => setSupportLabel(e.target.value)}
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <Button
              type="button"
              onClick={handleSaveSupportContact}
              disabled={savingContact}
              className="gap-2"
            >
              {savingContact ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save Support Contact
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── Navigation Links Table & Form ── */}
      {isEditing ? (
        <Card>
          <CardHeader>
            <CardTitle>{editingLink ? 'Edit Link' : 'Add New Link'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSaveLink}>
              <div className="space-y-2">
                <label className="text-sm font-medium">Link Label</label>
                <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. About Us" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">URL</label>
                <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="e.g. /about" />
              </div>
              <div className="flex gap-4">
                <Button type="submit">{editingLink ? 'Save Changes' : 'Save Link'}</Button>
                <Button variant="ghost" onClick={() => setIsEditing(false)}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <TablePanel title="Navigation Links" count={links.length}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">Order</TableHead>
                <TableHead>Label</TableHead>
                <TableHead>URL</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...links].sort((a, b) => a.order - b.order).map((link) => (
                <TableRow key={link.id}>
                  <TableCell className="text-gray-400">{link.order}</TableCell>
                  <TableCell className="font-medium">{link.label}</TableCell>
                  <TableCell className="text-gray-500">{link.url}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(link)} aria-label={`Edit link ${link.label}`}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-red-600" onClick={() => setDeleteTarget(link)} aria-label={`Delete link ${link.label}`}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TablePanel>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        onConfirm={() => deleteTarget && handleDelete(deleteTarget)}
        title="Delete link"
        description={`Are you sure you want to delete "${deleteTarget?.label}"? This action cannot be undone.`}
        confirmLabel="Delete"
      />
    </div>
  );
}