export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      actions: {
        Row: {
          action: string
          build_number: number
          created_at: string
          description: string
          input_schema: Json
          method: string
          organization_name: string
          output_schema: Json | null
          price_input_mt: number | null
          price_output_mt: number | null
          price_run: number | null
          price_run_second: number | null
          repository_name: string
        }
        Insert: {
          action: string
          build_number: number
          created_at?: string
          description: string
          input_schema: Json
          method?: string
          organization_name: string
          output_schema?: Json | null
          price_input_mt?: number | null
          price_output_mt?: number | null
          price_run?: number | null
          price_run_second?: number | null
          repository_name: string
        }
        Update: {
          action?: string
          build_number?: number
          created_at?: string
          description?: string
          input_schema?: Json
          method?: string
          organization_name?: string
          output_schema?: Json | null
          price_input_mt?: number | null
          price_output_mt?: number | null
          price_run?: number | null
          price_run_second?: number | null
          repository_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "actions_organization_name_repository_name_build_number_fkey"
            columns: ["organization_name", "repository_name", "build_number"]
            isOneToOne: false
            referencedRelation: "hosted_releases"
            referencedColumns: [
              "organization_name",
              "repository_name",
              "build_number",
            ]
          },
        ]
      }
      hosted_releases: {
        Row: {
          bootstrap_command: string | null
          build_number: number
          created_at: string
          env_variables: Json
          organization_name: string
          pid: number | null
          price_run_second: number
          repository_name: string
          template_id: string | null
          version: string
        }
        Insert: {
          bootstrap_command?: string | null
          build_number: number
          created_at?: string
          env_variables?: Json
          organization_name: string
          pid?: number | null
          price_run_second?: number
          repository_name: string
          template_id?: string | null
          version: string
        }
        Update: {
          bootstrap_command?: string | null
          build_number?: number
          created_at?: string
          env_variables?: Json
          organization_name?: string
          pid?: number | null
          price_run_second?: number
          repository_name?: string
          template_id?: string | null
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "hosted_releases_repository_name_organization_name_fkey"
            columns: ["repository_name", "organization_name"]
            isOneToOne: false
            referencedRelation: "repositories"
            referencedColumns: ["name", "organization_name"]
          },
          {
            foreignKeyName: "hosted_releases_repository_name_organization_name_fkey"
            columns: ["repository_name", "organization_name"]
            isOneToOne: false
            referencedRelation: "repositories_keys"
            referencedColumns: ["name", "organization_name"]
          },
          {
            foreignKeyName: "hosted_releases_repository_name_organization_name_fkey"
            columns: ["repository_name", "organization_name"]
            isOneToOne: false
            referencedRelation: "repositories_members"
            referencedColumns: ["name", "organization_name"]
          },
        ]
      }
      keys: {
        Row: {
          created_at: string
          id: string
          project_id: string
          value: string
        }
        Insert: {
          created_at?: string
          id?: string
          project_id: string
          value: string
        }
        Update: {
          created_at?: string
          id?: string
          project_id?: string
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "keys_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      mcp_servers: {
        Row: {
          created_at: string
          description: string
          github_url: string
          name: string
          owner: string
          repository: string
          template_id: string
        }
        Insert: {
          created_at?: string
          description: string
          github_url: string
          name: string
          owner: string
          repository: string
          template_id: string
        }
        Update: {
          created_at?: string
          description?: string
          github_url?: string
          name?: string
          owner?: string
          repository?: string
          template_id?: string
        }
        Relationships: []
      }
      org_keys: {
        Row: {
          created_at: string
          id: string
          name: string | null
          organization_id: string
          value: string
        }
        Insert: {
          created_at?: string
          id?: string
          name?: string | null
          organization_id: string
          value: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string | null
          organization_id?: string
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "org_keys_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "org_keys_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_members"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "org_keys_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_org_keys"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "org_keys_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_prj_keys"
            referencedColumns: ["organization_id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          id: string
          image: string | null
          name: string
          stripe_customer_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          image?: string | null
          name: string
          stripe_customer_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          image?: string | null
          name?: string
          stripe_customer_id?: string | null
        }
        Relationships: []
      }
      prices: {
        Row: {
          gpu_model: Database["public"]["Enums"]["product"]
          price_hour: number
        }
        Insert: {
          gpu_model: Database["public"]["Enums"]["product"]
          price_hour: number
        }
        Update: {
          gpu_model?: Database["public"]["Enums"]["product"]
          price_hour?: number
        }
        Relationships: []
      }
      projects: {
        Row: {
          created_at: string
          id: string
          name: string | null
          organization_id: string
          provider_id: string
          version: Database["public"]["Enums"]["version"]
        }
        Insert: {
          created_at?: string
          id?: string
          name?: string | null
          organization_id: string
          provider_id: string
          version: Database["public"]["Enums"]["version"]
        }
        Update: {
          created_at?: string
          id?: string
          name?: string | null
          organization_id?: string
          provider_id?: string
          version?: Database["public"]["Enums"]["version"]
        }
        Relationships: [
          {
            foreignKeyName: "projects_v0.1_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_v0.1_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_members"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "projects_v0.1_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_org_keys"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "projects_v0.1_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_prj_keys"
            referencedColumns: ["organization_id"]
          },
        ]
      }
      projects_old: {
        Row: {
          created_at: string
          crusoe_project_id: string
          hyperstack_project_id: string | null
          key: string
          name: string
          stripe_customer_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          crusoe_project_id: string
          hyperstack_project_id?: string | null
          key: string
          name: string
          stripe_customer_id: string
          user_id?: string
        }
        Update: {
          created_at?: string
          crusoe_project_id?: string
          hyperstack_project_id?: string | null
          key?: string
          name?: string
          stripe_customer_id?: string
          user_id?: string
        }
        Relationships: []
      }
      repositories: {
        Row: {
          created_at: string
          description: string | null
          is_private: boolean
          name: string
          organization_name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          is_private?: boolean
          name: string
          organization_name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          is_private?: boolean
          name?: string
          organization_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "repositories_organization_name_fkey"
            columns: ["organization_name"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["name"]
          },
          {
            foreignKeyName: "repositories_organization_name_fkey"
            columns: ["organization_name"]
            isOneToOne: false
            referencedRelation: "organizations_members"
            referencedColumns: ["organization_name"]
          },
          {
            foreignKeyName: "repositories_organization_name_fkey"
            columns: ["organization_name"]
            isOneToOne: false
            referencedRelation: "organizations_org_keys"
            referencedColumns: ["organization_name"]
          },
          {
            foreignKeyName: "repositories_organization_name_fkey"
            columns: ["organization_name"]
            isOneToOne: false
            referencedRelation: "organizations_prj_keys"
            referencedColumns: ["organization_name"]
          },
        ]
      }
      run_sessions: {
        Row: {
          build_number: number
          closed_at: string | null
          created_at: string
          id: string
          last_run_at: string | null
          org_key_id: string
          organization_name: string
          pid: number
          price_run_second: number
          repository_name: string
          sandbox_id: string
        }
        Insert: {
          build_number: number
          closed_at?: string | null
          created_at?: string
          id?: string
          last_run_at?: string | null
          org_key_id: string
          organization_name: string
          pid: number
          price_run_second: number
          repository_name: string
          sandbox_id: string
        }
        Update: {
          build_number?: number
          closed_at?: string | null
          created_at?: string
          id?: string
          last_run_at?: string | null
          org_key_id?: string
          organization_name?: string
          pid?: number
          price_run_second?: number
          repository_name?: string
          sandbox_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "run_sessions_org_key_id_fkey"
            columns: ["org_key_id"]
            isOneToOne: false
            referencedRelation: "org_keys"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "run_sessions_org_key_id_fkey"
            columns: ["org_key_id"]
            isOneToOne: false
            referencedRelation: "organizations_org_keys"
            referencedColumns: ["org_key_id"]
          },
          {
            foreignKeyName: "run_sessions_org_key_id_fkey"
            columns: ["org_key_id"]
            isOneToOne: false
            referencedRelation: "repositories_keys"
            referencedColumns: ["key_id"]
          },
          {
            foreignKeyName: "run_sessions_organization_name_repository_name_build_numbe_fkey"
            columns: ["organization_name", "repository_name", "build_number"]
            isOneToOne: false
            referencedRelation: "hosted_releases"
            referencedColumns: [
              "organization_name",
              "repository_name",
              "build_number",
            ]
          },
        ]
      }
      runs: {
        Row: {
          action: string
          build_number: number
          created_at: string
          id: string
          input_tokens: number
          key_id: string
          organization_name: string
          output_tokens: number | null
          price_input_mt: number | null
          price_output_mt: number | null
          price_run: number | null
          price_run_second: number | null
          repository_name: string
          run_seconds: number | null
        }
        Insert: {
          action: string
          build_number: number
          created_at?: string
          id?: string
          input_tokens: number
          key_id: string
          organization_name: string
          output_tokens?: number | null
          price_input_mt?: number | null
          price_output_mt?: number | null
          price_run?: number | null
          price_run_second?: number | null
          repository_name: string
          run_seconds?: number | null
        }
        Update: {
          action?: string
          build_number?: number
          created_at?: string
          id?: string
          input_tokens?: number
          key_id?: string
          organization_name?: string
          output_tokens?: number | null
          price_input_mt?: number | null
          price_output_mt?: number | null
          price_run?: number | null
          price_run_second?: number | null
          repository_name?: string
          run_seconds?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "runs_key_id_fkey"
            columns: ["key_id"]
            isOneToOne: false
            referencedRelation: "org_keys"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "runs_key_id_fkey"
            columns: ["key_id"]
            isOneToOne: false
            referencedRelation: "organizations_org_keys"
            referencedColumns: ["org_key_id"]
          },
          {
            foreignKeyName: "runs_key_id_fkey"
            columns: ["key_id"]
            isOneToOne: false
            referencedRelation: "repositories_keys"
            referencedColumns: ["key_id"]
          },
          {
            foreignKeyName: "runs_organization_name_repository_name_build_number_fkey"
            columns: ["organization_name", "repository_name", "build_number"]
            isOneToOne: false
            referencedRelation: "hosted_releases"
            referencedColumns: [
              "organization_name",
              "repository_name",
              "build_number",
            ]
          },
          {
            foreignKeyName: "runs_organization_name_repository_name_fkey"
            columns: ["organization_name", "repository_name"]
            isOneToOne: false
            referencedRelation: "repositories"
            referencedColumns: ["organization_name", "name"]
          },
          {
            foreignKeyName: "runs_organization_name_repository_name_fkey"
            columns: ["organization_name", "repository_name"]
            isOneToOne: false
            referencedRelation: "repositories_keys"
            referencedColumns: ["organization_name", "name"]
          },
          {
            foreignKeyName: "runs_organization_name_repository_name_fkey"
            columns: ["organization_name", "repository_name"]
            isOneToOne: false
            referencedRelation: "repositories_members"
            referencedColumns: ["organization_name", "name"]
          },
        ]
      }
      user_profiles: {
        Row: {
          created_at: string
          full_name: string
          handle: string
          image: string | null
          user_id: string
          website_url: string | null
        }
        Insert: {
          created_at?: string
          full_name: string
          handle: string
          image?: string | null
          user_id: string
          website_url?: string | null
        }
        Update: {
          created_at?: string
          full_name?: string
          handle?: string
          image?: string | null
          user_id?: string
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users_organizations: {
        Row: {
          organization_id: string
          user_id: string
        }
        Insert: {
          organization_id: string
          user_id: string
        }
        Update: {
          organization_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_organizations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "users_organizations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_members"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "users_organizations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_org_keys"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "users_organizations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_prj_keys"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "users_organizations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      organizations_members: {
        Row: {
          organization_id: string | null
          organization_name: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_organizations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations_org_keys: {
        Row: {
          org_key_id: string | null
          org_key_name: string | null
          organization_id: string | null
          organization_name: string | null
        }
        Relationships: []
      }
      organizations_prj_keys: {
        Row: {
          organization_id: string | null
          organization_name: string | null
          prj_key_id: string | null
        }
        Relationships: []
      }
      repositories_keys: {
        Row: {
          created_at: string | null
          description: string | null
          image: string | null
          is_hosted: boolean | null
          is_private: boolean | null
          key_id: string | null
          name: string | null
          organization_name: string | null
          runs: number | null
        }
        Relationships: [
          {
            foreignKeyName: "repositories_organization_name_fkey"
            columns: ["organization_name"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["name"]
          },
          {
            foreignKeyName: "repositories_organization_name_fkey"
            columns: ["organization_name"]
            isOneToOne: false
            referencedRelation: "organizations_members"
            referencedColumns: ["organization_name"]
          },
          {
            foreignKeyName: "repositories_organization_name_fkey"
            columns: ["organization_name"]
            isOneToOne: false
            referencedRelation: "organizations_org_keys"
            referencedColumns: ["organization_name"]
          },
          {
            foreignKeyName: "repositories_organization_name_fkey"
            columns: ["organization_name"]
            isOneToOne: false
            referencedRelation: "organizations_prj_keys"
            referencedColumns: ["organization_name"]
          },
        ]
      }
      repositories_members: {
        Row: {
          created_at: string | null
          description: string | null
          image: string | null
          is_hosted: boolean | null
          is_private: boolean | null
          member: string | null
          name: string | null
          organization_name: string | null
          runs: number | null
        }
        Relationships: [
          {
            foreignKeyName: "repositories_organization_name_fkey"
            columns: ["organization_name"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["name"]
          },
          {
            foreignKeyName: "repositories_organization_name_fkey"
            columns: ["organization_name"]
            isOneToOne: false
            referencedRelation: "organizations_members"
            referencedColumns: ["organization_name"]
          },
          {
            foreignKeyName: "repositories_organization_name_fkey"
            columns: ["organization_name"]
            isOneToOne: false
            referencedRelation: "organizations_org_keys"
            referencedColumns: ["organization_name"]
          },
          {
            foreignKeyName: "repositories_organization_name_fkey"
            columns: ["organization_name"]
            isOneToOne: false
            referencedRelation: "organizations_prj_keys"
            referencedColumns: ["organization_name"]
          },
          {
            foreignKeyName: "users_organizations_user_id_fkey"
            columns: ["member"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      repository_runs_by_day: {
        Row: {
          action: string | null
          date: string | null
          name: string | null
          organization_name: string | null
          runs: number | null
        }
        Relationships: [
          {
            foreignKeyName: "runs_organization_name_repository_name_fkey"
            columns: ["organization_name", "name"]
            isOneToOne: false
            referencedRelation: "repositories"
            referencedColumns: ["organization_name", "name"]
          },
          {
            foreignKeyName: "runs_organization_name_repository_name_fkey"
            columns: ["organization_name", "name"]
            isOneToOne: false
            referencedRelation: "repositories_keys"
            referencedColumns: ["organization_name", "name"]
          },
          {
            foreignKeyName: "runs_organization_name_repository_name_fkey"
            columns: ["organization_name", "name"]
            isOneToOne: false
            referencedRelation: "repositories_members"
            referencedColumns: ["organization_name", "name"]
          },
        ]
      }
      repository_runs_by_month: {
        Row: {
          action: string | null
          date: string | null
          name: string | null
          organization_name: string | null
          runs: number | null
        }
        Relationships: [
          {
            foreignKeyName: "runs_organization_name_repository_name_fkey"
            columns: ["organization_name", "name"]
            isOneToOne: false
            referencedRelation: "repositories"
            referencedColumns: ["organization_name", "name"]
          },
          {
            foreignKeyName: "runs_organization_name_repository_name_fkey"
            columns: ["organization_name", "name"]
            isOneToOne: false
            referencedRelation: "repositories_keys"
            referencedColumns: ["organization_name", "name"]
          },
          {
            foreignKeyName: "runs_organization_name_repository_name_fkey"
            columns: ["organization_name", "name"]
            isOneToOne: false
            referencedRelation: "repositories_members"
            referencedColumns: ["organization_name", "name"]
          },
        ]
      }
      users: {
        Row: {
          email: string | null
          id: string | null
        }
        Insert: {
          email?: string | null
          id?: string | null
        }
        Update: {
          email?: string | null
          id?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      product:
        | "A100-40-PCIE"
        | "A100-80-PCIE"
        | "A100-80-PCIE-NVLINK"
        | "A100-80-SXM"
        | "H100-80-SXM"
        | "H100-80-PCIE-NVLINK"
        | "H100-80-PCIE"
        | "A40-48-PCIE"
        | "RTXA5000-24-PCIE"
        | "RTXA6000-48-PCIE"
        | "RTXA6000ADA-48-PCIE"
        | "H200-80-SXM"
        | "H200-80-PCIE"
        | "L40-48-PCIE"
        | "L40S-48-PCIE"
        | "RTX4090-24-PCIE"
        | "RTXA4000-16-PCIE"
        | "VOLUME"
        | "IP"
      version: "v0.1" | "v0.2"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
