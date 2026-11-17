export type Sex = 'female' | 'male' | 'other' | 'prefer_not_to_say';

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          name: string;
          birth_date: string;
          sex: Sex;
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          name: string;
          birth_date: string;
          sex: Sex;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string;
          birth_date?: string;
          sex?: Sex;
          created_at?: string;
        };
        Relationships: [];
      };
      products: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          price: number;
          image_url: string | null;
          is_available: boolean;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          price: number;
          image_url?: string | null;
          is_available?: boolean;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          price?: number;
          image_url?: string | null;
          is_available?: boolean;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      user_roles: {
        Row: {
          user_id: string;
          role: 'admin';
          created_at: string;
        };
        Insert: {
          user_id: string;
          role?: 'admin';
          created_at?: string;
        };
        Update: {
          user_id?: string;
          role?: 'admin';
          created_at?: string;
        };
        Relationships: [];
      };
      orders: {
        Row: {
          id: string;
          user_id: string;
          status: 'pending' | 'preparing' | 'out_for_delivery' | 'delivered' | 'cancelled';
          total: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          status: 'pending' | 'preparing' | 'out_for_delivery' | 'delivered' | 'cancelled';
          total: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          status?: 'pending' | 'preparing' | 'out_for_delivery' | 'delivered' | 'cancelled';
          total?: number;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      is_admin: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      set_user_admin: {
        Args: { target_user_id: string; make_admin: boolean };
        Returns: undefined;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
