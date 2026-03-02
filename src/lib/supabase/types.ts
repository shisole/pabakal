export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

// ─── Enum Types ────────────────────────────────────────────────
export type UserRole = "admin" | "customer";
export type CargoStatus =
  | "purchased"
  | "packed"
  | "shipped"
  | "in_transit"
  | "arrived"
  | "distributed";
export type OrderStatus =
  | "pending"
  | "confirmed"
  | "preparing"
  | "ready"
  | "shipped_local"
  | "delivered"
  | "cancelled";
export type FulfillmentType = "in_stock" | "pre_order";
export type PaymentMethod = "gcash" | "bank_transfer" | "cash" | "dragonpay";
export type PaymentStatus = "pending" | "partial" | "paid" | "refunded";
export type ProductStatus = "draft" | "active" | "sold_out" | "archived";
export type ProductCondition = "new" | "like_new" | "good" | "fair";
export type RequestStatus = "pending" | "reviewing" | "available" | "unavailable" | "closed";

// ─── Database Interface ────────────────────────────────────────
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          phone: string | null;
          avatar_url: string | null;
          role: UserRole;
          address_line: string | null;
          city: string | null;
          province: string | null;
          zip_code: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          role?: UserRole;
          address_line?: string | null;
          city?: string | null;
          province?: string | null;
          zip_code?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          role?: UserRole;
          address_line?: string | null;
          city?: string | null;
          province?: string | null;
          zip_code?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };

      categories: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          image_url: string | null;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string | null;
          image_url?: string | null;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          name?: string;
          slug?: string;
          description?: string | null;
          image_url?: string | null;
          sort_order?: number;
        };
        Relationships: [];
      };

      products: {
        Row: {
          id: string;
          category_id: string | null;
          name: string;
          slug: string;
          description: string | null;
          brand: string | null;
          condition: ProductCondition;
          cost_usd: number;
          shipping_allocation_php: number;
          selling_price_php: number;
          compare_at_price_php: number | null;
          quantity_total: number;
          quantity_sold: number;
          quantity_reserved: number;
          status: ProductStatus;
          is_featured: boolean;
          cargo_id: string | null;
          added_by: string;
          tags: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          category_id?: string | null;
          name: string;
          slug: string;
          description?: string | null;
          brand?: string | null;
          condition?: ProductCondition;
          cost_usd: number;
          shipping_allocation_php?: number;
          selling_price_php: number;
          compare_at_price_php?: number | null;
          quantity_total?: number;
          quantity_sold?: number;
          quantity_reserved?: number;
          status?: ProductStatus;
          is_featured?: boolean;
          cargo_id?: string | null;
          added_by: string;
          tags?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          category_id?: string | null;
          name?: string;
          slug?: string;
          description?: string | null;
          brand?: string | null;
          condition?: ProductCondition;
          cost_usd?: number;
          shipping_allocation_php?: number;
          selling_price_php?: number;
          compare_at_price_php?: number | null;
          quantity_total?: number;
          quantity_sold?: number;
          quantity_reserved?: number;
          status?: ProductStatus;
          is_featured?: boolean;
          cargo_id?: string | null;
          tags?: string[];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey";
            columns: ["category_id"];
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "products_cargo_id_fkey";
            columns: ["cargo_id"];
            referencedRelation: "cargos";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "products_added_by_fkey";
            columns: ["added_by"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };

      product_images: {
        Row: {
          id: string;
          product_id: string;
          url: string;
          alt_text: string | null;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          url: string;
          alt_text?: string | null;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          url?: string;
          alt_text?: string | null;
          sort_order?: number;
        };
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey";
            columns: ["product_id"];
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };

      product_variants: {
        Row: {
          id: string;
          product_id: string;
          name: string;
          sku: string | null;
          price_adjustment_php: number;
          quantity_total: number;
          quantity_sold: number;
          quantity_reserved: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          name: string;
          sku?: string | null;
          price_adjustment_php?: number;
          quantity_total?: number;
          quantity_sold?: number;
          quantity_reserved?: number;
          created_at?: string;
        };
        Update: {
          name?: string;
          sku?: string | null;
          price_adjustment_php?: number;
          quantity_total?: number;
          quantity_sold?: number;
          quantity_reserved?: number;
        };
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey";
            columns: ["product_id"];
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };

      cargos: {
        Row: {
          id: string;
          name: string;
          status: CargoStatus;
          shipping_provider: string | null;
          tracking_number: string | null;
          total_shipping_cost_php: number;
          estimated_arrival: string | null;
          actual_arrival: string | null;
          notes: string | null;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          status?: CargoStatus;
          shipping_provider?: string | null;
          tracking_number?: string | null;
          total_shipping_cost_php?: number;
          estimated_arrival?: string | null;
          actual_arrival?: string | null;
          notes?: string | null;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          status?: CargoStatus;
          shipping_provider?: string | null;
          tracking_number?: string | null;
          total_shipping_cost_php?: number;
          estimated_arrival?: string | null;
          actual_arrival?: string | null;
          notes?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "cargos_created_by_fkey";
            columns: ["created_by"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };

      cargo_status_history: {
        Row: {
          id: string;
          cargo_id: string;
          status: CargoStatus;
          changed_by: string;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          cargo_id: string;
          status: CargoStatus;
          changed_by: string;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          status?: CargoStatus;
          notes?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "cargo_status_history_cargo_id_fkey";
            columns: ["cargo_id"];
            referencedRelation: "cargos";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "cargo_status_history_changed_by_fkey";
            columns: ["changed_by"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };

      orders: {
        Row: {
          id: string;
          order_number: string;
          customer_id: string;
          status: OrderStatus;
          subtotal_php: number;
          shipping_fee_php: number;
          discount_php: number;
          total_php: number;
          payment_status: PaymentStatus;
          has_pre_order_items: boolean;
          delivery_address: string;
          delivery_city: string;
          delivery_province: string;
          delivery_zip: string;
          customer_notes: string | null;
          admin_notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          order_number: string;
          customer_id: string;
          status?: OrderStatus;
          subtotal_php: number;
          shipping_fee_php?: number;
          discount_php?: number;
          total_php: number;
          payment_status?: PaymentStatus;
          has_pre_order_items?: boolean;
          delivery_address: string;
          delivery_city: string;
          delivery_province: string;
          delivery_zip: string;
          customer_notes?: string | null;
          admin_notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          status?: OrderStatus;
          subtotal_php?: number;
          shipping_fee_php?: number;
          discount_php?: number;
          total_php?: number;
          payment_status?: PaymentStatus;
          has_pre_order_items?: boolean;
          delivery_address?: string;
          delivery_city?: string;
          delivery_province?: string;
          delivery_zip?: string;
          customer_notes?: string | null;
          admin_notes?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "orders_customer_id_fkey";
            columns: ["customer_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };

      order_items: {
        Row: {
          id: string;
          order_id: string;
          product_id: string;
          variant_id: string | null;
          quantity: number;
          unit_price_php: number;
          total_price_php: number;
          fulfillment_type: FulfillmentType;
          cargo_id: string | null;
          product_name: string;
          product_image_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          product_id: string;
          variant_id?: string | null;
          quantity: number;
          unit_price_php: number;
          total_price_php: number;
          fulfillment_type?: FulfillmentType;
          cargo_id?: string | null;
          product_name: string;
          product_image_url?: string | null;
          created_at?: string;
        };
        Update: {
          quantity?: number;
          unit_price_php?: number;
          total_price_php?: number;
          fulfillment_type?: FulfillmentType;
          cargo_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey";
            columns: ["order_id"];
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "order_items_product_id_fkey";
            columns: ["product_id"];
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "order_items_variant_id_fkey";
            columns: ["variant_id"];
            referencedRelation: "product_variants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "order_items_cargo_id_fkey";
            columns: ["cargo_id"];
            referencedRelation: "cargos";
            referencedColumns: ["id"];
          },
        ];
      };

      payments: {
        Row: {
          id: string;
          order_id: string;
          amount_php: number;
          method: PaymentMethod;
          reference_number: string | null;
          proof_url: string | null;
          notes: string | null;
          verified: boolean;
          verified_at: string | null;
          verified_by: string | null;
          paid_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          amount_php: number;
          method: PaymentMethod;
          reference_number?: string | null;
          proof_url?: string | null;
          notes?: string | null;
          verified?: boolean;
          verified_at?: string | null;
          verified_by?: string | null;
          paid_at?: string | null;
          created_at?: string;
        };
        Update: {
          amount_php?: number;
          method?: PaymentMethod;
          reference_number?: string | null;
          proof_url?: string | null;
          notes?: string | null;
          verified?: boolean;
          verified_at?: string | null;
          verified_by?: string | null;
          paid_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "payments_order_id_fkey";
            columns: ["order_id"];
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "payments_verified_by_fkey";
            columns: ["verified_by"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };

      reviews: {
        Row: {
          id: string;
          product_id: string;
          customer_id: string;
          order_id: string;
          rating: number;
          comment: string | null;
          is_visible: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          customer_id: string;
          order_id: string;
          rating: number;
          comment?: string | null;
          is_visible?: boolean;
          created_at?: string;
        };
        Update: {
          rating?: number;
          comment?: string | null;
          is_visible?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "reviews_product_id_fkey";
            columns: ["product_id"];
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reviews_customer_id_fkey";
            columns: ["customer_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reviews_order_id_fkey";
            columns: ["order_id"];
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
        ];
      };

      notifications: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          body: string;
          type: string;
          reference_id: string | null;
          reference_type: string | null;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          body: string;
          type: string;
          reference_id?: string | null;
          reference_type?: string | null;
          is_read?: boolean;
          created_at?: string;
        };
        Update: {
          title?: string;
          body?: string;
          is_read?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };

      exchange_rates: {
        Row: {
          id: string;
          rate: number;
          effective_date: string;
          set_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          rate: number;
          effective_date: string;
          set_by: string;
          created_at?: string;
        };
        Update: {
          rate?: number;
          effective_date?: string;
        };
        Relationships: [
          {
            foreignKeyName: "exchange_rates_set_by_fkey";
            columns: ["set_by"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };

      product_requests: {
        Row: {
          id: string;
          customer_id: string;
          product_name: string;
          product_url: string | null;
          description: string | null;
          budget_min_php: number | null;
          budget_max_php: number | null;
          status: RequestStatus;
          admin_response: string | null;
          estimated_price_php: number | null;
          responded_by: string | null;
          responded_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          customer_id: string;
          product_name: string;
          product_url?: string | null;
          description?: string | null;
          budget_min_php?: number | null;
          budget_max_php?: number | null;
          status?: RequestStatus;
          admin_response?: string | null;
          estimated_price_php?: number | null;
          responded_by?: string | null;
          responded_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          product_name?: string;
          product_url?: string | null;
          description?: string | null;
          budget_min_php?: number | null;
          budget_max_php?: number | null;
          status?: RequestStatus;
          admin_response?: string | null;
          estimated_price_php?: number | null;
          responded_by?: string | null;
          responded_at?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "product_requests_customer_id_fkey";
            columns: ["customer_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "product_requests_responded_by_fkey";
            columns: ["responded_by"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      generate_order_number: {
        Args: Record<string, never>;
        Returns: string;
      };
    };
    Enums: {
      user_role: UserRole;
      cargo_status: CargoStatus;
      order_status: OrderStatus;
      fulfillment_type: FulfillmentType;
      payment_method: PaymentMethod;
      payment_status: PaymentStatus;
      product_status: ProductStatus;
      product_condition: ProductCondition;
      request_status: RequestStatus;
    };
    CompositeTypes: Record<string, never>;
  };
}

// ─── Convenience Types ─────────────────────────────────────────
export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type InsertTables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];
export type UpdateTables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];

// Common row types
export type Profile = Tables<"profiles">;
export type Category = Tables<"categories">;
export type Product = Tables<"products">;
export type ProductImage = Tables<"product_images">;
export type ProductVariant = Tables<"product_variants">;
export type Cargo = Tables<"cargos">;
export type CargoStatusHistory = Tables<"cargo_status_history">;
export type Order = Tables<"orders">;
export type OrderItem = Tables<"order_items">;
export type Payment = Tables<"payments">;
export type Review = Tables<"reviews">;
export type Notification = Tables<"notifications">;
export type ExchangeRate = Tables<"exchange_rates">;
export type ProductRequest = Tables<"product_requests">;

// Joined types for common queries
export type ProductWithImages = Product & {
  product_images: ProductImage[];
};

export type ProductWithDetails = Product & {
  product_images: ProductImage[];
  product_variants: ProductVariant[];
  categories: Category | null;
  cargos: Cargo | null;
};

export type OrderWithItems = Order & {
  order_items: OrderItem[];
  payments: Payment[];
  profiles: Profile | null;
};

export type ProductRequestWithCustomer = ProductRequest & {
  profiles: Profile | null;
};
