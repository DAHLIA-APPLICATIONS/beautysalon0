// Complete mock implementation - no real Supabase client used

// Query builder type definitions
interface QueryFilter {
  type: 'eq' | 'gte' | 'lte';
  column: string;
  value: any;
}

interface OrderBy {
  column: string;
  ascending: boolean;
}

interface QueryBuilder {
  eq: (column: string, value: any) => QueryBuilder;
  gte: (column: string, value: any) => QueryBuilder;
  lte: (column: string, value: any) => QueryBuilder;
  order: (column: string, options?: { ascending?: boolean }) => QueryBuilder;
  single: () => Promise<{ data: any; error: any }>;
  then: (resolve: any) => Promise<{ data: any[]; error: any }>;
}

interface MockUser {
  id: string;
  email: string;
}

interface MockSession {
  user: MockUser;
}

interface AuthResponse {
  data: { user: MockUser | null; session?: MockSession | null };
  error: { message: string } | null;
}

interface SessionResponse {
  data: { session: MockSession | null };
  error: any;
}

const createMockSupabaseClient = () => {
  // Mock data storage
  const mockData: any = {
    users: [
      {
        id: 'mock-admin-id',
        email: 'admin@salon.com',
        name: '管理者',
        role: 'admin',
        active: true,
        created_at: '2024-01-01T00:00:00Z'
      },
      {
        id: 'mock-staff-id',
        email: 'staff@salon.com',
        name: 'スタッフ',
        role: 'staff',
        active: true,
        created_at: '2024-01-01T00:00:00Z'
      }
    ],
    clients: [
      {
        id: 'client-1',
        name: '田中 花子',
        contact: '090-1234-5678',
        notes: 'アレルギー: なし\n希望施術: 痩身・ボディケア\n目標: ウエスト-5cm',
        primary_staff_id: 'mock-staff-id',
        created_at: '2024-01-15T00:00:00Z',
        staff: { name: 'スタッフ' }
      },
      {
        id: 'client-2',
        name: '佐藤 美咲',
        contact: 'misaki@example.com',
        notes: '下半身のむくみが気になる\n希望施術: リンパドレナージュ中心',
        primary_staff_id: 'mock-admin-id',
        created_at: '2024-01-20T00:00:00Z',
        staff: { name: '管理者' }
      }
    ],
    visits: [
      {
        id: 'visit-1',
        client_id: 'client-1',
        visit_date: '2024-01-25',
        service_menu: '痩身施術',
        notes: '体重測定後、キャビテーションとリンパドレナージュを実施。むくみが改善され、ウエスト周りがスッキリした様子。次回も同じメニューで継続予定。',
        created_by: 'mock-staff-id',
        created_at: '2024-01-25T10:00:00Z',
        client: { name: '田中 花子' },
        staff: { name: 'スタッフ' }
      },
      {
        id: 'visit-2',
        client_id: 'client-2',
        visit_date: '2024-01-28',
        service_menu: 'ボディマッサージ',
        notes: 'リラックス効果抜群。肩こりが改善。',
        created_by: 'mock-admin-id',
        created_at: '2024-01-28T14:00:00Z',
        client: { name: '佐藤 美咲' },
        staff: { name: '管理者' }
      }
    ],
    measurements: [
      {
        id: 'measurement-1',
        client_id: 'client-1',
        type: 'weight',
        value: 55.5,
        measured_at: '2024-01-15T00:00:00Z',
        created_by: 'mock-staff-id',
        client: { name: '田中 花子' }
      },
      {
        id: 'measurement-2',
        client_id: 'client-1',
        type: 'weight',
        value: 54.8,
        measured_at: '2024-01-22T00:00:00Z',
        created_by: 'mock-staff-id',
        client: { name: '田中 花子' }
      },
      {
        id: 'measurement-3',
        client_id: 'client-1',
        type: 'weight',
        value: 54.2,
        measured_at: '2024-01-29T00:00:00Z',
        created_by: 'mock-staff-id',
        client: { name: '田中 花子' }
      }
    ]
  };

  // Helper function to get mock data
  const getMockData = (table: string, filters: QueryFilter[] = [], single = false, orderBy?: OrderBy) => {
    let result = [...(mockData[table] || [])];
    
    // Apply filters
    filters.forEach(filter => {
      if (filter.type === 'eq') {
        result = result.filter((item: any) => item[filter.column] === filter.value);
      } else if (filter.type === 'gte') {
        result = result.filter((item: any) => item[filter.column] >= filter.value);
      } else if (filter.type === 'lte') {
        result = result.filter((item: any) => item[filter.column] <= filter.value);
      }
    });
    
    // Apply ordering
    if (orderBy) {
      result.sort((a, b) => {
        const aVal = a[orderBy.column];
        const bVal = b[orderBy.column];
        if (orderBy.ascending) {
          return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
        } else {
          return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
        }
      });
    }
    
    if (single) {
      return Promise.resolve({ data: result[0] || null, error: null });
    }
    
    return Promise.resolve({ data: result, error: null });
  };

  // Mock auth state management
  let authStateCallback: ((event: string, session: MockSession | null) => void) | null = null;
  let currentSession: MockSession | null = null;

  // Check for existing session on initialization
  if (typeof window !== 'undefined') {
    const mockUser = localStorage.getItem('mockUser');
    if (mockUser) {
      currentSession = { user: JSON.parse(mockUser) as MockUser };
    }
  }

  // Query builder for method chaining
  const createQueryBuilder = (table: string, filters: QueryFilter[] = [], orderBy?: OrderBy): QueryBuilder => ({
    eq: (column: string, value: any) => createQueryBuilder(table, [...filters, { type: 'eq' as const, column, value }], orderBy),
    gte: (column: string, value: any) => createQueryBuilder(table, [...filters, { type: 'gte' as const, column, value }], orderBy),
    lte: (column: string, value: any) => createQueryBuilder(table, [...filters, { type: 'lte' as const, column, value }], orderBy),
    order: (column: string, options?: { ascending?: boolean }) => createQueryBuilder(table, filters, { column, ascending: options?.ascending !== false }),
    single: () => getMockData(table, filters, true, orderBy),
    then: (resolve: any) => getMockData(table, filters, false, orderBy).then(resolve)
  });

  return {
    auth: {
      getSession: (): Promise<SessionResponse> => {
        return Promise.resolve({ 
          data: { session: currentSession }, 
          error: null 
        });
      },
      onAuthStateChange: (callback: (event: string, session: MockSession | null) => void) => {
        authStateCallback = callback;
        // Immediately call with current session
        if (currentSession) {
          setTimeout(() => callback('SIGNED_IN', currentSession), 0);
        }
        return { data: { subscription: { unsubscribe: () => {} } } };
      },
      signInWithPassword: ({ email, password }: { email: string; password: string }): Promise<AuthResponse> => {
        let user: MockUser | null = null;
        
        if (email === 'admin@salon.com' && password === 'admin123') {
          user = { id: 'mock-admin-id', email };
        } else if (email === 'staff@salon.com' && password === 'staff123') {
          user = { id: 'mock-staff-id', email };
        }
        
        if (user) {
          currentSession = { user } as MockSession;
          if (typeof window !== 'undefined') {
            localStorage.setItem('mockUser', JSON.stringify(user));
          }
          // Trigger auth state change
          if (authStateCallback) {
            setTimeout(() => authStateCallback('SIGNED_IN', currentSession), 0);
          }
          return Promise.resolve({ data: { user }, error: null });
        }
        
        return Promise.resolve({ 
          data: { user: null }, 
          error: { message: 'Invalid credentials' } 
        });
      },
      signUp: ({ email, password }: { email: string; password: string }): Promise<AuthResponse> => {
        const user: MockUser = { id: 'mock-new-user-id', email };
        currentSession = { user };
        if (typeof window !== 'undefined') {
          localStorage.setItem('mockUser', JSON.stringify(user));
        }
        // Trigger auth state change
        if (authStateCallback) {
          setTimeout(() => authStateCallback('SIGNED_IN', currentSession), 0);
        }
        return Promise.resolve({ data: { user }, error: null });
      },
      signOut: (): Promise<{ error: any }> => {
        currentSession = null;
        if (typeof window !== 'undefined') {
          localStorage.removeItem('mockUser');
        }
        // Trigger auth state change
        if (authStateCallback) {
          setTimeout(() => authStateCallback('SIGNED_OUT', null), 0);
        }
        return Promise.resolve({ error: null });
      },
    },
    from: (table: string) => ({
      select: (columns?: string) => ({
        eq: (column: string, value: any) => createQueryBuilder(table, [{ type: 'eq' as const, column, value }]),
        gte: (column: string, value: any) => createQueryBuilder(table, [{ type: 'gte' as const, column, value }]),
        lte: (column: string, value: any) => createQueryBuilder(table, [{ type: 'lte' as const, column, value }]),
        order: (column: string, options?: any) => createQueryBuilder(table, [], { column, ascending: options?.ascending !== false }),
        then: (resolve: any) => getMockData(table).then(resolve)
      }),
      insert: (data: any) => {
        // Add to mock data with generated ID
        const newItem = Array.isArray(data) ? data[0] : data;
        newItem.id = `mock-${Date.now()}`;
        newItem.created_at = new Date().toISOString();
        mockData[table] = mockData[table] || [];
        mockData[table].push(newItem);
        return Promise.resolve({ data: newItem, error: null });
      },
      update: (data: any) => ({
        eq: (column: string, value: any) => {
          // Update mock data
          const items = mockData[table] || [];
          const index = items.findIndex((item: any) => item[column] === value);
          if (index !== -1) {
            mockData[table][index] = { ...mockData[table][index], ...data };
          }
          return Promise.resolve({ data, error: null });
        }
      })
    })
  };
};

// Always use mock client
export const supabase = createMockSupabaseClient();

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          name: string;
          role: 'admin' | 'staff';
          active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          name: string;
          role?: 'admin' | 'staff';
          active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string;
          role?: 'admin' | 'staff';
          active?: boolean;
          created_at?: string;
        };
      };
      clients: {
        Row: {
          id: string;
          name: string;
          contact: string | null;
          notes: string;
          primary_staff_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          contact?: string | null;
          notes?: string;
          primary_staff_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          contact?: string | null;
          notes?: string;
          primary_staff_id?: string | null;
          created_at?: string;
        };
      };
      visits: {
        Row: {
          id: string;
          client_id: string;
          visit_date: string;
          service_menu: string;
          notes: string;
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          visit_date?: string;
          service_menu: string;
          notes?: string;
          created_by: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          client_id?: string;
          visit_date?: string;
          service_menu?: string;
          notes?: string;
          created_by?: string;
          created_at?: string;
        };
      };
      measurements: {
        Row: {
          id: string;
          client_id: string;
          type: string;
          value: number;
          measured_at: string;
          created_by: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          type?: string;
          value: number;
          measured_at?: string;
          created_by: string;
        };
        Update: {
          id?: string;
          client_id?: string;
          type?: string;
          value?: number;
          measured_at?: string;
          created_by?: string;
        };
      };
    };
  };
};