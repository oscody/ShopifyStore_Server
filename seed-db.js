import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool } from "@neondatabase/serverless";
import { categories, products } from "./schema";
import dotenv from "dotenv";

dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle({ client: pool });

async function seedDatabase() {
  try {
    console.log("🌱 Starting database seeding...");

    // Clear existing data
    await db.delete(products);
    await db.delete(categories);
    console.log("🗑️  Cleared existing data");

    // Insert categories
    const categoryData = [
      {
        id: "cat-1",
        name: "Electronics",
        slug: "electronics",
        description: "Electronic devices and gadgets",
      },
      {
        id: "cat-2",
        name: "Clothing",
        slug: "clothing",
        description: "Fashion and apparel",
      },
      {
        id: "cat-3",
        name: "Home & Garden",
        slug: "home-garden",
        description: "Home improvement and garden supplies",
      },
      {
        id: "cat-4",
        name: "Sports",
        slug: "sports",
        description: "Sports equipment and accessories",
      },
    ];

    await db.insert(categories).values(categoryData);
    console.log("📂 Added categories");

    // Insert products
    const productData = [
      {
        id: "prod-1",
        name: "Wireless Headphones",
        description: "High-quality wireless headphones with noise cancellation",
        price: 199.99,
        sku: "WH-001",
        slug: "wireless-headphones",
        categoryId: "cat-1",
        status: "active",
        stock: 50,
        minStock: 10,
        image:
          "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400",
        images: [
          "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400",
        ],
        weight: 0.3,
        dimensions: "20x15x8",
        tags: ["electronics", "audio", "wireless"],
      },
      {
        id: "prod-2",
        name: "Smart Watch",
        description: "Feature-rich smartwatch with health monitoring",
        price: 299.99,
        sku: "SW-002",
        slug: "smart-watch",
        categoryId: "cat-1",
        status: "active",
        stock: 30,
        minStock: 5,
        image:
          "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400",
        images: [
          "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400",
        ],
        weight: 0.1,
        dimensions: "4x4x1",
        tags: ["electronics", "wearable", "smart"],
      },
      {
        id: "prod-3",
        name: "Cotton T-Shirt",
        description: "Comfortable 100% cotton t-shirt in various colors",
        price: 24.99,
        sku: "TS-003",
        slug: "cotton-t-shirt",
        categoryId: "cat-2",
        status: "active",
        stock: 100,
        minStock: 20,
        image:
          "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400",
        images: [
          "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400",
        ],
        weight: 0.2,
        dimensions: "30x25x2",
        tags: ["clothing", "cotton", "casual"],
      },
      {
        id: "prod-4",
        name: "Running Shoes",
        description: "Comfortable running shoes with excellent cushioning",
        price: 129.99,
        sku: "RS-004",
        slug: "running-shoes",
        categoryId: "cat-4",
        status: "active",
        stock: 75,
        minStock: 15,
        image:
          "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400",
        images: [
          "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400",
        ],
        weight: 0.8,
        dimensions: "35x25x15",
        tags: ["sports", "shoes", "running"],
      },
      {
        id: "prod-5",
        name: "Garden Tools Set",
        description: "Complete set of essential garden tools",
        price: 89.99,
        sku: "GT-005",
        slug: "garden-tools-set",
        categoryId: "cat-3",
        status: "active",
        stock: 25,
        minStock: 5,
        image:
          "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400",
        images: [
          "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400",
        ],
        weight: 2.5,
        dimensions: "50x30x10",
        tags: ["garden", "tools", "outdoor"],
      },
      {
        id: "prod-6",
        name: "Laptop Stand",
        description: "Adjustable laptop stand for better ergonomics",
        price: 49.99,
        sku: "LS-006",
        slug: "laptop-stand",
        categoryId: "cat-1",
        status: "active",
        stock: 40,
        minStock: 8,
        image:
          "https://images.unsplash.com/photo-1527864550417-7f91c4c76d3c?w=400",
        images: [
          "https://images.unsplash.com/photo-1527864550417-7f91c4c76d3c?w=400",
        ],
        weight: 0.6,
        dimensions: "30x20x15",
        tags: ["electronics", "accessories", "laptop"],
      },
    ];

    await db.insert(products).values(productData);
    console.log("📦 Added products");

    console.log("✅ Database seeded successfully!");
  } catch (error) {
    console.error("❌ Error seeding database:", error);
  } finally {
    await pool.end();
  }
}

seedDatabase();
