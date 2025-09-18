/*
  # エステサロン顧客管理アプリ - データベース設計

  ## 新規テーブル
  1. **users** - スタッフ情報
     - id (uuid, primary key)
     - email (text, unique)
     - name (text)
     - role (enum: admin/staff)
     - active (boolean, default true)
     - created_at (timestamp)

  2. **clients** - 顧客情報
     - id (uuid, primary key)
     - name (text)
     - contact (text) - 電話番号やメールアドレス
     - notes (text) - 顧客に関するメモ
     - primary_staff_id (uuid, foreign key to users)
     - created_at (timestamp)

  3. **visits** - 来店履歴
     - id (uuid, primary key)
     - client_id (uuid, foreign key to clients)
     - visit_date (date)
     - service_menu (text) - 施術内容
     - notes (text) - 施術に関するメモ
     - created_by (uuid, foreign key to users)
     - created_at (timestamp)

  4. **measurements** - 計測記録
     - id (uuid, primary key)
     - client_id (uuid, foreign key to clients)
     - type (text) - 'weight' など
     - value (decimal)
     - measured_at (timestamp)
     - created_by (uuid, foreign key to users)

  ## セキュリティ
  - 全てのテーブルでRLSを有効化
  - adminは全データアクセス可能
  - staffは担当顧客のみアクセス可能
  - active=falseのユーザーはアクセス不可
*/

-- Create enum type for user roles
CREATE TYPE user_role AS ENUM ('admin', 'staff');

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  role user_role NOT NULL DEFAULT 'staff',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create clients table
CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  contact text,
  notes text DEFAULT '',
  primary_staff_id uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- Create visits table
CREATE TABLE IF NOT EXISTS visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  visit_date date NOT NULL DEFAULT CURRENT_DATE,
  service_menu text NOT NULL,
  notes text DEFAULT '',
  created_by uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Create measurements table
CREATE TABLE IF NOT EXISTS measurements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'weight',
  value decimal(5,2) NOT NULL,
  measured_at timestamptz DEFAULT now(),
  created_by uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE
);

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE measurements ENABLE ROW LEVEL SECURITY;

-- RLS policies for users table
CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id OR EXISTS (
    SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin' AND users.active = true
  ));

CREATE POLICY "Admin can manage all users"
  ON users
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin' AND users.active = true
  ));

-- RLS policies for clients table
CREATE POLICY "Staff can read assigned clients, admin can read all"
  ON clients
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.active = true
      AND (
        users.role = 'admin' 
        OR users.id = clients.primary_staff_id
      )
    )
  );

CREATE POLICY "Staff can manage assigned clients, admin can manage all"
  ON clients
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.active = true
      AND (
        users.role = 'admin' 
        OR users.id = clients.primary_staff_id
      )
    )
  );

-- RLS policies for visits table
CREATE POLICY "Staff can read visits for assigned clients, admin can read all"
  ON visits
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      JOIN clients c ON (u.role = 'admin' OR c.primary_staff_id = u.id)
      WHERE u.id = auth.uid() 
      AND u.active = true
      AND c.id = visits.client_id
    )
  );

CREATE POLICY "Staff can manage visits for assigned clients, admin can manage all"
  ON visits
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      JOIN clients c ON (u.role = 'admin' OR c.primary_staff_id = u.id)
      WHERE u.id = auth.uid() 
      AND u.active = true
      AND c.id = visits.client_id
    )
  );

-- RLS policies for measurements table
CREATE POLICY "Staff can read measurements for assigned clients, admin can read all"
  ON measurements
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      JOIN clients c ON (u.role = 'admin' OR c.primary_staff_id = u.id)
      WHERE u.id = auth.uid() 
      AND u.active = true
      AND c.id = measurements.client_id
    )
  );

CREATE POLICY "Staff can manage measurements for assigned clients, admin can manage all"
  ON measurements
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      JOIN clients c ON (u.role = 'admin' OR c.primary_staff_id = u.id)
      WHERE u.id = auth.uid() 
      AND u.active = true
      AND c.id = measurements.client_id
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS clients_primary_staff_id_idx ON clients(primary_staff_id);
CREATE INDEX IF NOT EXISTS visits_client_id_idx ON visits(client_id);
CREATE INDEX IF NOT EXISTS visits_visit_date_idx ON visits(visit_date);
CREATE INDEX IF NOT EXISTS measurements_client_id_idx ON measurements(client_id);
CREATE INDEX IF NOT EXISTS measurements_measured_at_idx ON measurements(measured_at);