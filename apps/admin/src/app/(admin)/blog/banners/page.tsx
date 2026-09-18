'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Plus, Eye, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { PageHeader } from '@/components/layout/page-header';
import { useAdminBanners, useUpdateAdminBanners } from '@/hooks/use-admin-queries';
import { BannerFormCard } from './components/banner-form-card';
import { BannerTableSection } from './components/banner-table-section';

export interface Banner {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  cta: string;
  href: string;
  placement: 'slider' | 'side';
  status: 'Active' | 'Draft';
}

export default function BannersPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const { data: bannersRes, isLoading: loading } = useAdminBanners();
  const updateBannersMutation = useUpdateAdminBanners();
  const saving = updateBannersMutation.isPending;
  const [uploading, setUploading] = useState(false);

  // Modal / Form state
  const [isEditing, setIsEditing] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Banner | null>(null);
  const [confirmClearAll, setConfirmClearAll] = useState(false);

  // Form Fields
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [image, setImage] = useState('');
  const [cta, setCta] = useState('');
  const [href, setHref] = useState('/products');
  const [placement, setPlacement] = useState<'slider' | 'side'>('slider');
  const [status, setStatus] = useState<'Active' | 'Draft'>('Active');
  const [urlInput, setUrlInput] = useState('');

  useEffect(() => {
    if (!bannersRes) return;
    const rawData = (bannersRes as any)?.data ?? bannersRes;
    if (Array.isArray(rawData)) {
      const normalized: Banner[] = rawData.map((b: Partial<Banner>, index: number) => ({
        id: b.id || `banner-${b.placement || 'slider'}-${index + 1}`,
        title: b.title || '',
        subtitle: b.subtitle || '',
        image: b.image || '',
        cta: b.cta || 'Shop Now',
        href: b.href || '/products',
        placement: (b.placement as 'slider' | 'side') || 'slider',
        status: (b.status as 'Active' | 'Draft') || 'Active',
      }));
      setBanners(normalized);
    } else {
      setBanners([]);
    }
  }, [bannersRes]);

  const sliderBanners = banners.filter((b) => b.placement === 'slider');
  const sideBanners = banners.filter((b) => b.placement === 'side');

  const uploadFileToServer = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);

    const token = typeof window !== 'undefined' ? localStorage.getItem('admin_access_token') : null;
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000'}/api/admin/upload`,
        {
          method: 'POST',
          credentials: 'include',
          headers,
          body: formData,
        }
      );
      const data = await res.json();
      if (data.success && data.data?.url) {
        const url: string = data.data.url;
        const isLive = typeof window !== 'undefined' && window.location.hostname !== 'localhost';
        if (!isLive || !url.includes('localhost:5000')) {
          return url;
        }
      }
    } catch {
      // Fall through to FileReader fallback
    }

    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const file = files[0];
      const uploadedUrl = await uploadFileToServer(file);
      setImage(uploadedUrl);
      setUrlInput('');
      toast.success('Banner image uploaded successfully!');
    } catch {
      toast.error('Failed to upload image. Please try entering an image URL.');
    } finally {
      setUploading(false);
    }
  };

  const handleApplyUrl = () => {
    if (!urlInput.trim()) return;
    setImage(urlInput.trim());
    toast.success('Image URL applied');
  };

  const openAdd = (defaultPlacement: 'slider' | 'side' = 'slider') => {
    setEditingBanner(null);
    setTitle('');
    setSubtitle('');
    setImage('');
    setCta('Shop Now');
    setHref('/products');
    setPlacement(defaultPlacement);
    setStatus('Active');
    setUrlInput('');
    setIsEditing(true);
  };

  const openEdit = (banner: Banner) => {
    setEditingBanner(banner);
    setTitle(banner.title);
    setSubtitle(banner.subtitle);
    setImage(banner.image);
    setCta(banner.cta);
    setHref(banner.href);
    setPlacement(banner.placement);
    setStatus(banner.status);
    setUrlInput('');
    setIsEditing(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!image) {
      toast.error('Please upload or provide an image URL for the banner');
      return;
    }

    let updatedList: Banner[];
    if (editingBanner) {
      updatedList = banners.map((b) =>
        b.id === editingBanner.id
          ? { ...b, title, subtitle, image, cta, href, placement, status }
          : b
      );
    } else {
      const newBanner: Banner = {
        id: `banner-${Date.now()}`,
        title,
        subtitle,
        image,
        cta: cta || 'Shop Now',
        href: href || '/products',
        placement,
        status,
      };
      updatedList = [...banners, newBanner];
    }

    try {
      await updateBannersMutation.mutateAsync(updatedList);
      setBanners(updatedList);
      setIsEditing(false);
      toast.success(editingBanner ? 'Banner updated successfully' : 'Banner created successfully');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save banners');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const targetId = deleteTarget.id;
    const updatedList = banners.filter((b) => b.id !== targetId);
    try {
      await updateBannersMutation.mutateAsync(updatedList);
      setBanners(updatedList);
      setDeleteTarget(null);
      toast.success('Banner deleted successfully');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to delete banner');
    }
  };

  const handleClearAll = async () => {
    try {
      await updateBannersMutation.mutateAsync([]);
      setBanners([]);
      setConfirmClearAll(false);
      toast.success('All banners removed successfully');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to remove all banners');
    }
  };

  const handleToggleStatus = async (banner: Banner) => {
    const updatedStatus = banner.status === 'Active' ? 'Draft' : 'Active';
    const updatedList = banners.map((b) =>
      b.id === banner.id ? { ...b, status: updatedStatus as 'Active' | 'Draft' } : b
    );
    try {
      await updateBannersMutation.mutateAsync(updatedList);
      setBanners(updatedList);
      toast.success(`Banner set to ${updatedStatus}`);
    } catch {
      toast.error('Failed to update status');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Homepage Banners Manager"
        description="Manage the top visual hero slider and 2 promotional side banner cards displayed on the storefront."
        actions={
          <div className="flex items-center gap-2">
            <a
              href={`${process.env.NEXT_PUBLIC_STORE_URL ?? 'http://localhost:3000'}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
            >
              <Eye className="h-4 w-4" /> View Live Storefront
            </a>
            {!isEditing && banners.length > 0 && (
              <Button
                variant="outline"
                className="text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200"
                onClick={() => setConfirmClearAll(true)}
              >
                <Trash2 className="mr-1.5 h-4 w-4" /> Remove All Banners
              </Button>
            )}
            {!isEditing && (
              <Button onClick={() => openAdd('slider')}>
                <Plus className="mr-1.5 h-4 w-4" /> Add New Banner
              </Button>
            )}
          </div>
        }
      />

      {isEditing ? (
        <BannerFormCard
          editingBanner={editingBanner}
          placement={placement}
          setPlacement={setPlacement}
          title={title}
          setTitle={setTitle}
          subtitle={subtitle}
          setSubtitle={setSubtitle}
          cta={cta}
          setCta={setCta}
          href={href}
          setHref={setHref}
          status={status}
          setStatus={setStatus}
          image={image}
          setImage={setImage}
          urlInput={urlInput}
          setUrlInput={setUrlInput}
          uploading={uploading}
          saving={saving}
          onFileUpload={handleFileUpload}
          onApplyUrl={handleApplyUrl}
          onSave={handleSave}
          onCancel={() => setIsEditing(false)}
        />
      ) : (
        <BannerTableSection
          sliderBanners={sliderBanners}
          sideBanners={sideBanners}
          loading={loading}
          onOpenAdd={openAdd}
          onOpenEdit={openEdit}
          onToggleStatus={handleToggleStatus}
          onDeleteTarget={setDeleteTarget}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete Banner"
        description={`Are you sure you want to delete the banner "${deleteTarget?.title || 'Untitled'}"? This will immediately remove it from the homepage.`}
        confirmLabel="Delete Banner"
        destructive
        onConfirm={handleDelete}
      />

      {/* Clear All Confirmation Dialog */}
      <ConfirmDialog
        open={confirmClearAll}
        onOpenChange={setConfirmClearAll}
        title="Remove All Banners"
        description="Are you sure you want to remove ALL homepage banners? This will clear both slider slides and promo cards immediately from the storefront."
        confirmLabel="Remove All"
        destructive
        onConfirm={handleClearAll}
      />
    </div>
  );
}