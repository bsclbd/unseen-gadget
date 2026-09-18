"use client";

import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { PageHeader } from "@/components/layout/page-header";
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { apiRequest } from "@/lib/api";
import { CategoryPreview } from "./components/category-preview";
import { CategoryListTable } from "./components/category-list-table";
import {
  CategoryItemDialog,
  type CategoryShowcaseItem,
} from "./components/category-item-dialog";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

interface FeaturedCategoriesCmsData {
  enabled: boolean;
  kicker: string;
  title: string;
  items: CategoryShowcaseItem[];
}

const DEFAULT_CONFIG: FeaturedCategoriesCmsData = {
  enabled: true,
  kicker: "MUST-HAVE SELECTIONS",
  title: "Browse through our top categories to find the products you'll love",
  items: [
    { id: "accessories", name: "Accessories", href: "/category/accessories", iconType: "accessories", active: true },
    { id: "cameras", name: "Cameras", href: "/category/electronics", iconType: "cameras", active: true },
    { id: "cases-protectors", name: "Cases & Protectors", href: "/category/cases-protectors/iphone", iconType: "iphone-cases", active: true },
    { id: "computers", name: "Computer & Laptops", href: "/category/computers", iconType: "macbook", active: true },
    { id: "electronics", name: "Electronics", href: "/category/electronics", iconType: "electronics", active: true },
    { id: "gaming", name: "Gaming Zone", href: "/category/gaming", iconType: "gaming", active: true },
    { id: "audio", name: "Headphones & Speakers", href: "/category/audio", iconType: "headphones", active: true },
    { id: "home-appliances", name: "Home Appliances", href: "/category/electronics", iconType: "home-appliances", active: true },
    { id: "ipads-tablets", name: "iPad and Tab", href: "/category/ipads-tablets", iconType: "ipads", active: true },
    { id: "smartwatches", name: "Smart Watches", href: "/category/smartwatches", iconType: "smart-watches", active: true },
  ],
};

export default function FeaturedCategoriesCmsPage() {
  const [data, setData] = useState<FeaturedCategoriesCmsData>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Store categories for autofill
  const [categoriesList, setCategoriesList] = useState<
    Array<{ id: string; name: string; slug?: string; image?: string }>
  >([]);

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [deleteConfirmIndex, setDeleteConfirmIndex] = useState<number | null>(null);

  // Form State
  const [formData, setFormData] = useState<CategoryShowcaseItem>({
    id: "",
    name: "",
    href: "",
    iconType: "custom-image",
    image: "",
    active: true,
  });

  // Inline upload ref
  const inlineUploadRef = useRef<HTMLInputElement>(null);
  const [inlineUploadIndex, setInlineUploadIndex] = useState<number | null>(null);

  useEffect(() => {
    Promise.all([
      apiRequest("/cms/featured-categories").catch(() => ({ data: null })),
      apiRequest("/admin/categories").catch(() => ({ data: [] })),
    ])
      .then(([cmsRes, catRes]) => {
        if (cmsRes?.data) {
          const cmsData = (cmsRes.data as any)?.value || cmsRes.data;
          setData({
            enabled: cmsData.enabled !== false,
            kicker: cmsData.kicker || DEFAULT_CONFIG.kicker,
            title: cmsData.title || DEFAULT_CONFIG.title,
            items: Array.isArray(cmsData.items) && cmsData.items.length > 0
              ? cmsData.items
              : DEFAULT_CONFIG.items,
          });
        }
        if (catRes.data && Array.isArray(catRes.data)) {
          setCategoriesList(catRes.data as Array<{ id: string; name: string; slug?: string; image?: string }>);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await apiRequest("/cms/featured-categories", {
        method: "PUT",
        body: JSON.stringify({ value: data }),
      });
      if (res.success || res.data) {
        toast.success("Featured Categories saved successfully");
      } else {
        throw new Error(res.error || res.message || "Failed to save");
      }
    } catch (e: unknown) {
      const err = e as { error?: string; message?: string };
      toast.error(err.error || err.message || "Failed to save Featured Categories");
    } finally {
      setSaving(false);
    }
  };

  const uploadImageFile = async (file: File): Promise<string> => {
    const formDataUpload = new FormData();
    formDataUpload.append("file", file);

    const res = await fetch(`${API_BASE}/api/admin/upload`, {
      method: "POST",
      credentials: "include",
      body: formDataUpload,
    });
    const result = await res.json();
    if (result.success && result.data?.url) {
      return result.data.url;
    }
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });
  };

  const handleModalFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const url = await uploadImageFile(file);
      setFormData((prev) => ({
        ...prev,
        image: url,
        iconType: "custom-image",
      }));
      toast.success("Image uploaded successfully");
    } catch {
      toast.error("Failed to upload image. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleInlineFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || inlineUploadIndex === null) return;

    setUploading(true);
    try {
      const url = await uploadImageFile(file);
      setData((prev) => {
        const copy = [...prev.items];
        copy[inlineUploadIndex] = {
          ...copy[inlineUploadIndex],
          image: url,
          iconType: "custom-image",
        };
        return { ...prev, items: copy };
      });
      toast.success("Category logo updated!");
    } catch {
      toast.error("Failed to upload image.");
    } finally {
      setUploading(false);
      setInlineUploadIndex(null);
    }
  };

  const openAddModal = () => {
    setEditingIndex(null);
    setFormData({
      id: `cat-${Date.now()}`,
      name: "",
      href: "/category/",
      iconType: "custom-image",
      image: "",
      active: true,
    });
    setModalOpen(true);
  };

  const openEditModal = (item: CategoryShowcaseItem, index: number) => {
    setEditingIndex(index);
    setFormData({ ...item });
    setModalOpen(true);
  };

  const handleSaveModal = () => {
    if (!formData.name.trim()) {
      toast.error("Category name is required");
      return;
    }
    const cleanHref = formData.href.trim() || `/category/${formData.name.toLowerCase().replace(/\s+/g, "-")}`;
    const updatedItem: CategoryShowcaseItem = {
      ...formData,
      href: cleanHref,
    };

    if (editingIndex !== null) {
      setData((prev) => {
        const copy = [...prev.items];
        copy[editingIndex] = updatedItem;
        return { ...prev, items: copy };
      });
      toast.success("Category item updated");
    } else {
      setData((prev) => ({ ...prev, items: [...prev.items, updatedItem] }));
      toast.success("New category item added");
    }
    setModalOpen(false);
  };

  const removeItem = (index: number) => {
    setData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
    setDeleteConfirmIndex(null);
    toast.success("Category item deleted");
  };

  const moveItem = (index: number, direction: "up" | "down") => {
    setData((prev) => {
      const copy = [...prev.items];
      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= copy.length) return prev;
      const temp = copy[index];
      copy[index] = copy[targetIndex];
      copy[targetIndex] = temp;
      return { ...prev, items: copy };
    });
  };

  const toggleItemActive = (index: number, active: boolean) => {
    setData((prev) => {
      const copy = [...prev.items];
      copy[index] = { ...copy[index], active };
      return { ...prev, items: copy };
    });
  };

  const importFromStore = () => {
    if (categoriesList.length === 0) {
      toast.info("No store categories found to import");
      return;
    }
    const imported: CategoryShowcaseItem[] = categoriesList.map((cat) => ({
      id: cat.slug || cat.id,
      name: cat.name,
      href: `/category/${cat.slug}`,
      iconType: cat.slug || "accessories",
      image: cat.image || undefined,
      active: true,
    }));
    setData((prev) => ({ ...prev, items: imported }));
    toast.success(`Imported ${imported.length} categories from store catalog`);
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Hidden file input for inline logo replacement */}
      <input
        ref={inlineUploadRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleInlineFileUpload}
      />

      <PageHeader
        title="Featured Categories CMS"
        description="Configure the circular category icons showcase displayed on the customer storefront homepage."
        actions={
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save All Changes
          </Button>
        }
      />

      {/* SECTION SETTINGS */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold">Section Settings</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Enable or disable this section and set titles.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-muted-foreground">Enable Section</span>
              <Switch
                checked={data.enabled}
                onCheckedChange={(checked) => setData((p) => ({ ...p, enabled: checked }))}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                Kicker / Top Subtitle
              </label>
              <Input
                value={data.kicker}
                onChange={(e) => setData((p) => ({ ...p, kicker: e.target.value }))}
                placeholder="e.g. MUST-HAVE SELECTIONS"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                Section Main Title
              </label>
              <Input
                value={data.title}
                onChange={(e) => setData((p) => ({ ...p, title: e.target.value }))}
                placeholder="e.g. Browse through our top categories..."
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* LIVE STOREFRONT PREVIEW */}
      <CategoryPreview
        kicker={data.kicker}
        title={data.title}
        items={data.items}
        onItemClick={openEditModal}
      />

      {/* CRUD CATEGORY CARDS TABLE */}
      <CategoryListTable
        items={data.items}
        onImportStore={importFromStore}
        onAddClick={openAddModal}
        onEditClick={openEditModal}
        onDeleteClick={(index) => setDeleteConfirmIndex(index)}
        onMoveItem={moveItem}
        onToggleActive={toggleItemActive}
        onInlineUpload={(index) => {
          setInlineUploadIndex(index);
          inlineUploadRef.current?.click();
        }}
      />

      {/* CREATE / EDIT CATEGORY MODAL */}
      <CategoryItemDialog
        open={modalOpen}
        onOpenChange={setModalOpen}
        isEditing={editingIndex !== null}
        formData={formData}
        setFormData={setFormData}
        categoriesList={categoriesList}
        uploading={uploading}
        onFileUpload={handleModalFileUpload}
        onSave={handleSaveModal}
      />

      {/* DELETE CONFIRMATION DIALOG */}
      <Dialog
        open={deleteConfirmIndex !== null}
        onOpenChange={(open) => !open && setDeleteConfirmIndex(null)}
      >
        <DialogHeader close>
          <DialogTitle>Delete Category Showcase Item</DialogTitle>
          <DialogDescription>
            Are you sure you want to remove this category from the homepage showcase?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setDeleteConfirmIndex(null)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              if (deleteConfirmIndex !== null) {
                removeItem(deleteConfirmIndex);
              }
            }}
          >
            Delete Item
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
