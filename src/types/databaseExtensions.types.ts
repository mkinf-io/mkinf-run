import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "./database.types";

type DatabaseClient = SupabaseClient<Database>;
type Product = Database["public"]["Enums"]["product"];
type ProductPrices = Map<string, number>;

export { DatabaseClient, Product, ProductPrices };
