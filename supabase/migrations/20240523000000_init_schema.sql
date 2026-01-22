-- Users Table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role VARCHAR(20) CHECK (role IN ('anggota', 'pengurus')) DEFAULT 'anggota',
  phone VARCHAR(20),
  address TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for Users
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- Loans Table
CREATE TABLE loans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(15,2) NOT NULL,
  interest_rate DECIMAL(5,2) DEFAULT 0,
  duration_months INTEGER NOT NULL,
  status VARCHAR(20) CHECK (status IN ('active', 'paid', 'overdue', 'cancelled')) DEFAULT 'active',
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  monthly_payment DECIMAL(15,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for Loans
CREATE INDEX idx_loans_user_id ON loans(user_id);
CREATE INDEX idx_loans_status ON loans(status);

-- Payments Table
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  loan_id UUID REFERENCES loans(id) ON DELETE CASCADE,
  amount DECIMAL(15,2) NOT NULL,
  payment_type VARCHAR(20) CHECK (payment_type IN ('monthly', 'partial', 'full')),
  payment_category VARCHAR(20) CHECK (payment_category IN ('wajib', 'infaq', 'tabungan')) DEFAULT 'wajib',
  payment_date DATE NOT NULL,
  status VARCHAR(20) CHECK (status IN ('pending', 'completed', 'failed')) DEFAULT 'pending',
  payment_method VARCHAR(50),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for Payments
CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_payments_loan_id ON payments(loan_id);
CREATE INDEX idx_payments_date ON payments(payment_date);
CREATE INDEX idx_payments_category ON payments(payment_category);

-- Balance History Table
CREATE TABLE balance_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  balance_amount DECIMAL(15,2) NOT NULL,
  transaction_type VARCHAR(20) CHECK (transaction_type IN ('deposit', 'withdrawal', 'loan_payment', 'interest', 'infaq', 'tabungan')),
  payment_category VARCHAR(20) CHECK (payment_category IN ('wajib', 'infaq', 'tabungan')),
  description TEXT,
  transaction_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for Balance History
CREATE INDEX idx_balance_user_id ON balance_history(user_id);
CREATE INDEX idx_balance_date ON balance_history(transaction_date);
CREATE INDEX idx_balance_category ON balance_history(payment_category);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE balance_history ENABLE ROW LEVEL SECURITY;

-- Grant public read access
GRANT SELECT ON users TO anon;
GRANT SELECT ON loans TO anon;
GRANT SELECT ON payments TO anon;
GRANT SELECT ON balance_history TO anon;

-- Users policies
CREATE POLICY "Public can view basic user data" ON users
  FOR SELECT USING (is_active = true);

CREATE POLICY "Users can view their own data" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Pengurus can view all users" ON users
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'pengurus'
  ));
  
CREATE POLICY "Pengurus can insert users" ON users
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'pengurus'
  ));
  
CREATE POLICY "Pengurus can update users" ON users
  FOR UPDATE USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'pengurus'
  ));

-- Loans policies
CREATE POLICY "Public can view active loans summary" ON loans
  FOR SELECT USING (status = 'active');

CREATE POLICY "Users can view their own loans" ON loans
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Pengurus can manage all loans" ON loans
  FOR ALL USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'pengurus'
  ));

-- Payments policies
CREATE POLICY "Public can view payments" ON payments
  FOR SELECT USING (true); -- Simplified for public dashboard stats, or maybe restrict? 
  -- Tech doc says: "Get Public Dashboard Statistics (No Auth Required)"
  -- So anon needs select access.
  
CREATE POLICY "Users can view their own payments" ON payments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Pengurus can manage all payments" ON payments
  FOR ALL USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'pengurus'
  ));

-- Balance History policies
CREATE POLICY "Public can view balance history" ON balance_history
  FOR SELECT USING (true); -- For charts

CREATE POLICY "Users can view their own balance" ON balance_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Pengurus can manage balance history" ON balance_history
  FOR ALL USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'pengurus'
  ));
