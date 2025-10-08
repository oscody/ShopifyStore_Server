import {
  categories,
  products,
  orders,
  orderItems,
  type Category,
  type Product,
  type Order,
  type OrderWithItems,
  type InsertCategory,
  type InsertProduct,
  type InsertOrder,
  type InsertOrderItem,
} from "./schema";
import { db } from "./db";
import { eq, desc, asc, and, sql, ilike } from "drizzle-orm";

export interface IStorage {
  // Categories
  getCategories(): Promise<Category[]>;
  createCategory(category: InsertCategory): Promise<Category>;

  // Products
  getProducts(params?: {
    search?: string;
    category?: string;
    status?: string;
    sort?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ products: Product[]; total: number }>;
  getProduct(id: string): Promise<Product | undefined>;
  getProductBySlug(slug: string): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: string, updates: Partial<InsertProduct>): Promise<Product>;
  deleteProduct(id: string): Promise<void>;

  // Orders
  getOrders(params?: {
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ orders: OrderWithItems[]; total: number }>;
  getOrder(id: string): Promise<OrderWithItems | undefined>;
  getOrderByNumber(orderNumber: string): Promise<OrderWithItems | undefined>;
  createOrder(
    order: InsertOrder,
    items: InsertOrderItem[]
  ): Promise<OrderWithItems>;
  updateOrderStatus(id: string, status: string): Promise<Order>;

  // Stats
  getDashboardStats(): Promise<{
    revenue: number;
    orders: number;
    customers: number;
    lowStock: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // Categories
  async getCategories(): Promise<Category[]> {
    return await db.select().from(categories).orderBy(asc(categories.name));
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const [result] = await db.insert(categories).values(category).returning();
    return result;
  }

  // Products
  async getProducts(
    params: {
      search?: string;
      category?: string;
      status?: string;
      sort?: string;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<{ products: Product[]; total: number }> {
    const { search, category, status, sort, limit = 50, offset = 0 } = params;

    let query = db.select().from(products);
    let countQuery = db.select({ count: sql<number>`count(*)` }).from(products);

    const conditions = [];

    if (search) {
      const searchCondition = ilike(products.name, `%${search}%`);
      conditions.push(searchCondition);
    }

    if (category) {
      conditions.push(eq(products.categoryId, category));
    }

    if (status) {
      conditions.push(eq(products.status, status));
    }

    if (conditions.length > 0) {
      const whereClause =
        conditions.length === 1 ? conditions[0] : and(...conditions);
      query = query.where(whereClause) as any;
      countQuery = countQuery.where(whereClause) as any;
    }

    // Apply sorting
    switch (sort) {
      case "price-low":
        query = query.orderBy(asc(products.price)) as any;
        break;
      case "price-high":
        query = query.orderBy(desc(products.price)) as any;
        break;
      case "newest":
        query = query.orderBy(desc(products.createdAt)) as any;
        break;
      case "popular":
        // For now, use created date as popularity proxy
        // In a real app, you'd track sales/views
        query = query.orderBy(desc(products.createdAt)) as any;
        break;
      default:
        query = query.orderBy(desc(products.createdAt)) as any;
        break;
    }

    const [productsResult, countResult] = await Promise.all([
      query.limit(limit).offset(offset),
      countQuery,
    ]);

    return {
      products: productsResult,
      total: countResult[0].count,
    };
  }

  async getProduct(id: string): Promise<Product | undefined> {
    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.id, id));
    return product;
  }

  async getProductBySlug(slug: string): Promise<Product | undefined> {
    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.slug, slug));
    return product;
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const [result] = await db
      .insert(products)
      .values({
        ...product,
        updatedAt: new Date(),
      })
      .returning();
    return result;
  }

  async updateProduct(
    id: string,
    updates: Partial<InsertProduct>
  ): Promise<Product> {
    const [result] = await db
      .update(products)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(products.id, id))
      .returning();
    return result;
  }

  async deleteProduct(id: string): Promise<void> {
    await db.delete(products).where(eq(products.id, id));
  }

  // Orders
  async getOrders(
    params: {
      status?: string;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<{ orders: OrderWithItems[]; total: number }> {
    const { status, limit = 50, offset = 0 } = params;

    let query = db.select().from(orders);
    let countQuery = db.select({ count: sql<number>`count(*)` }).from(orders);

    if (status) {
      query = query.where(eq(orders.status, status)) as any;
      countQuery = countQuery.where(eq(orders.status, status)) as any;
    }

    const [ordersResult, countResult] = await Promise.all([
      query.orderBy(desc(orders.createdAt)).limit(limit).offset(offset),
      countQuery,
    ]);

    const ordersWithItems = await Promise.all(
      ordersResult.map(async (order) => {
        const items = await db
          .select({
            id: orderItems.id,
            orderId: orderItems.orderId,
            productId: orderItems.productId,
            productName: orderItems.productName,
            productSku: orderItems.productSku,
            price: orderItems.price,
            quantity: orderItems.quantity,
            total: orderItems.total,
            product: products,
          })
          .from(orderItems)
          .leftJoin(products, eq(orderItems.productId, products.id))
          .where(eq(orderItems.orderId, order.id));

        return {
          ...order,
          items: items.map((item) => ({
            ...item,
            product:
              item.product ||
              ({
                id: item.productId,
                name: item.productName,
                sku: item.productSku,
              } as Product),
          })),
        };
      })
    );

    return {
      orders: ordersWithItems,
      total: countResult[0].count,
    };
  }

  async getOrder(id: string): Promise<OrderWithItems | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    if (!order) return undefined;

    const items = await db
      .select({
        id: orderItems.id,
        orderId: orderItems.orderId,
        productId: orderItems.productId,
        productName: orderItems.productName,
        productSku: orderItems.productSku,
        price: orderItems.price,
        quantity: orderItems.quantity,
        total: orderItems.total,
        product: products,
      })
      .from(orderItems)
      .leftJoin(products, eq(orderItems.productId, products.id))
      .where(eq(orderItems.orderId, order.id));

    return {
      ...order,
      items: items.map((item) => ({
        ...item,
        product:
          item.product ||
          ({
            id: item.productId,
            name: item.productName,
            sku: item.productSku,
          } as Product),
      })),
    };
  }

  async getOrderByNumber(
    orderNumber: string
  ): Promise<OrderWithItems | undefined> {
    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.orderNumber, orderNumber));
    if (!order) return undefined;

    const items = await db
      .select({
        id: orderItems.id,
        orderId: orderItems.orderId,
        productId: orderItems.productId,
        productName: orderItems.productName,
        productSku: orderItems.productSku,
        price: orderItems.price,
        quantity: orderItems.quantity,
        total: orderItems.total,
        product: products,
      })
      .from(orderItems)
      .leftJoin(products, eq(orderItems.productId, products.id))
      .where(eq(orderItems.orderId, order.id));

    return {
      ...order,
      items: items.map((item) => ({
        ...item,
        product:
          item.product ||
          ({
            id: item.productId,
            name: item.productName,
            sku: item.productSku,
          } as Product),
      })),
    };
  }

  async createOrder(
    order: InsertOrder,
    items: InsertOrderItem[]
  ): Promise<OrderWithItems> {
    const [orderResult] = await db.insert(orders).values(order).returning();

    const orderItemsWithOrderId = items.map((item) => ({
      ...item,
      orderId: orderResult.id,
    }));

    const itemsResult = await db
      .insert(orderItems)
      .values(orderItemsWithOrderId)
      .returning();

    // Update product stock
    await Promise.all(
      items.map(async (item) => {
        await db
          .update(products)
          .set({
            stock: sql`${products.stock} - ${item.quantity}`,
            updatedAt: new Date(),
          })
          .where(eq(products.id, item.productId));
      })
    );

    const productsForItems = await Promise.all(
      itemsResult.map(async (item) => {
        const [product] = await db
          .select()
          .from(products)
          .where(eq(products.id, item.productId));
        return {
          ...item,
          product:
            product ||
            ({
              id: item.productId,
              name: item.productName,
              sku: item.productSku,
            } as Product),
        };
      })
    );

    return {
      ...orderResult,
      items: productsForItems,
    };
  }

  async updateOrderStatus(id: string, status: string): Promise<Order> {
    const [result] = await db
      .update(orders)
      .set({
        status,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, id))
      .returning();
    return result;
  }

  async getDashboardStats(): Promise<{
    revenue: number;
    orders: number;
    customers: number;
    lowStock: number;
  }> {
    const [revenueResult] = await db
      .select({
        total: sql<number>`coalesce(sum(cast(${orders.total} as decimal)), 0)`,
        count: sql<number>`count(*)`,
      })
      .from(orders)
      .where(eq(orders.status, "completed"));

    const [customersResult] = await db
      .select({ count: sql<number>`count(distinct ${orders.customerEmail})` })
      .from(orders);

    const [lowStockResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(products)
      .where(sql`${products.stock} <= ${products.minStock}`);

    return {
      revenue: Number(revenueResult.total) || 0,
      orders: revenueResult.count || 0,
      customers: customersResult.count || 0,
      lowStock: lowStockResult.count || 0,
    };
  }
}

export const storage = new DatabaseStorage();
