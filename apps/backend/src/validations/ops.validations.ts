import { z } from "zod";

const cuidish = z.string().min(1);

// ============ Suppliers ============

export const supplierCreateSchema = z.object({
  name: z.string().min(1),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  address: z.string().optional(),
  company: z.string().optional(),
  dueAmount: z.number().int().nonnegative().optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
});

export const supplierUpdateSchema = supplierCreateSchema.partial();

export const idParamsSchema = z.object({ id: z.string().min(1) });

export const supplierTransactionCreateSchema = z.object({
  type: z.enum(["PURCHASE", "PAYMENT", "REFUND"]),
  amount: z.number().int().positive(),
  date: z.string().datetime().optional(),
  reference: z.string().optional(),
  note: z.string().optional(),
});

// ============ Purchases ============

const purchaseItemSchema = z.object({
  productId: cuidish.optional(),
  productName: z.string().min(1),
  quantity: z.number().int().positive(),
  unitPrice: z.number().int().nonnegative(),
});

export const purchaseBaseSchema = z.object({
  supplierId: cuidish,
  items: z.array(purchaseItemSchema).min(1),
  discount: z.number().int().nonnegative().default(0),
  tax: z.number().int().nonnegative().default(0),
  paidAmount: z.number().int().nonnegative().default(0),
  invoiceNumber: z.string().optional(),
  date: z.string().datetime().optional(),
});

export const purchaseCreateSchema = purchaseBaseSchema.refine(
  (data) => {
    const subtotal = data.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
    return data.paidAmount <= subtotal - data.discount + data.tax;
  },
  { message: "paidAmount cannot exceed purchase total" },
);

export const purchaseUpdateSchema = purchaseBaseSchema.partial();

// ============ Inventory ============

export const inventoryUpdateSchema = z.object({
  minStock: z.number().int().nonnegative().optional(),
  maxStock: z.number().int().nonnegative().nullable().optional(),
});

export const stockMovementCreateSchema = z.object({
  productId: cuidish,
  type: z.enum(["IN", "OUT", "ADJUSTMENT"]),
  quantity: z.number().int().positive(),
  note: z.string().optional(),
  reference: z.string().optional(),
});

// ============ Reviews (admin) ============

export const reviewStatusSchema = z.object({
  status: z.enum(["APPROVED", "PENDING", "REJECTED"]),
});

// ============ Returns ============

export const returnStatusSchema = z.object({
  status: z.enum(["PENDING", "APPROVED", "REFUNDED", "REJECTED"]),
  refundAmount: z.number().int().nonnegative().optional(),
});

export const returnCreateSchema = z.object({
  orderId: cuidish,
  product: z.string().min(1).optional(),
  reason: z.string().min(3),
  refundAmount: z.number().int().nonnegative().optional(),
});

// ============ Deliveries ============

export const deliveryUpdateSchema = z.object({
  status: z.enum(["PENDING", "PICKED_UP", "IN_TRANSIT", "DELIVERED", "CANCELLED"]).optional(),
  courier: z.string().optional(),
  trackingNumber: z.string().optional(),
  estimatedDelivery: z.string().datetime().optional(),
});

// ============ Expenses ============

export const expenseCreateSchema = z.object({
  category: z.enum([
    "MARKETING",
    "INVENTORY",
    "UTILITIES",
    "SALARY",
    "RENT",
    "LOGISTICS",
    "MAINTENANCE",
    "OFFICE_SUPPLIES",
    "INSURANCE",
    "MISCELLANEOUS",
  ]),
  amount: z.number().int().positive(),
  description: z.string().optional(),
  date: z.string().datetime().optional(),
  paymentMethod: z.string().optional(),
  receipt: z.string().optional(),
});

export const expenseUpdateSchema = expenseCreateSchema.partial();

// ============ Notifications ============

export const notificationCreateSchema = z.object({
  title: z.string().min(1),
  message: z.string().min(1),
  type: z.enum(["ORDER", "PAYMENT", "RETURN", "ALERT", "SHIPPING", "CUSTOMER", "SYSTEM"]),
  actionUrl: z.string().optional(),
});

// ============ Promotions ============

export const promotionCreateSchema = z.object({
  name: z.string().min(1),
  title: z.string().optional(),
  badge: z.string().optional(),
  description: z.string().optional(),
  type: z.enum(["SALE", "FREE_SHIPPING", "BOGO", "BUNDLE"]).default("SALE"),
  discountType: z.enum(["PERCENTAGE", "FIXED"]),
  discountValue: z.number().int().nonnegative().default(0),
  applicableTo: z.enum(["ALL", "CATEGORY", "PRODUCT"]).default("ALL"),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  status: z.enum(["ACTIVE", "ENDED", "SCHEDULED"]).default("ACTIVE"),
  ctaLabel: z.string().optional(),
  ctaHref: z.string().optional(),
  icon: z.string().optional(),
  gradient: z.string().optional(),
  sortOrder: z.number().int().default(0),
  active: z.boolean().default(true),
});

export const promotionUpdateSchema = promotionCreateSchema.partial();

// ============ POS ============

export const posSessionCreateSchema = z.object({
  cashInHand: z.number().int().nonnegative().default(0),
});

export const posSessionSaleSchema = z.object({
  amount: z.number().int().positive(),
});

export const posSessionCloseSchema = z.object({
  totalSales: z.number().int().nonnegative().optional(),
  totalOrders: z.number().int().nonnegative().optional(),
});

// ============ Settings ============

export const settingUpsertSchema = z.object({
  value: z.unknown(),
});

// ============ Admin management ============

export const adminCreateSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  roleId: cuidish,
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
});

export const adminUpdateSchema = adminCreateSchema.partial().omit({ password: true }).extend({
  password: z.string().min(8).optional(),
});

export const roleCreateSchema = z.object({
  name: z.string().min(1),
  permissions: z.array(z.string()).default([]),
});

export const roleUpdateSchema = roleCreateSchema.partial();

// ============ CMS ============

const isoDate = z.string().datetime();

export const cmsPostSchema = z.object({
  title: z.string().min(1),
  slug: z.string().optional(),
  excerpt: z.string().optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).default([]),
  author: z.string().optional(),
  publishedAt: isoDate.optional(),
  featuredImage: z.string().optional(),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  status: z.enum(["DRAFT", "PUBLISHED"]).default("DRAFT"),
  blocks: z.unknown().optional(),
});

export const cmsPostUpdateSchema = cmsPostSchema.partial();

export const cmsJobSchema = z.object({
  title: z.string().min(1),
  department: z.string().optional(),
  type: z.string().optional(),
  location: z.string().optional(),
  description: z.string().optional(),
  responsibilities: z.array(z.string()).default([]),
  requirements: z.array(z.string()).default([]),
  active: z.boolean().default(true),
});

export const cmsJobUpdateSchema = cmsJobSchema.partial();

export const cmsPageUpdateSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  status: z
    .enum(["DRAFT", "PUBLISHED", "draft", "published"])
    .transform((val) => val.toUpperCase() as "DRAFT" | "PUBLISHED")
    .optional(),
  seo: z.unknown().optional(),
  blocks: z.unknown().optional(),
  content: z.unknown().optional(),
  lastUpdated: z.union([isoDate, z.string(), z.null()]).optional(),
});

export const cmsSettingValueSchema = z.union([
  z.object({ value: z.unknown().refine((val) => val !== undefined, { message: "value must be defined" }) }),
  z.record(z.string(), z.unknown()),
  z.array(z.unknown()),
]);
