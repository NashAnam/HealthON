-- Reward Points System for HealthON

-- Create reward_points table
CREATE TABLE IF NOT EXISTS reward_points (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    points INTEGER NOT NULL DEFAULT 0,
    total_earned INTEGER NOT NULL DEFAULT 0,
    total_redeemed INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(patient_id)
);

-- Create points_transactions table to track all point activities
CREATE TABLE IF NOT EXISTS points_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    points INTEGER NOT NULL,
    transaction_type VARCHAR(50) NOT NULL, -- 'earned' or 'redeemed'
    source VARCHAR(100) NOT NULL, -- 'vitals_log', 'diet_log', 'med_log', 'discount_claimed'
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create rewards_catalog table for available discounts
CREATE TABLE IF NOT EXISTS rewards_catalog (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    discount_type VARCHAR(50) NOT NULL, -- 'percentage' or 'fixed'
    discount_value INTEGER NOT NULL,
    points_required INTEGER NOT NULL,
    category VARCHAR(100) NOT NULL, -- 'lab_test', 'consultation', 'pharmacy'
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default rewards
INSERT INTO rewards_catalog (title, description, discount_type, discount_value, points_required, category) VALUES
('10% OFF Lab Tests', 'Get 10% discount on any diagnostic lab test', 'percentage', 10, 100, 'lab_test'),
('15% OFF Lab Tests', 'Get 15% discount on any diagnostic lab test', 'percentage', 15, 250, 'lab_test'),
('20% OFF Lab Tests', 'Get 20% discount on any diagnostic lab test', 'percentage', 20, 500, 'lab_test'),
('₹100 OFF Consultation', 'Get ₹100 off on doctor video consultation', 'fixed', 100, 200, 'consultation'),
('₹200 OFF Consultation', 'Get ₹200 off on doctor video consultation', 'fixed', 200, 400, 'consultation'),
('Free Basic Health Checkup', 'Complimentary basic health checkup package', 'percentage', 100, 1000, 'lab_test')
ON CONFLICT DO NOTHING;

-- Function to award points
CREATE OR REPLACE FUNCTION award_points(
    p_patient_id UUID,
    p_points INTEGER,
    p_source VARCHAR(100),
    p_description TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    -- Insert or update reward_points
    INSERT INTO reward_points (patient_id, points, total_earned)
    VALUES (p_patient_id, p_points, p_points)
    ON CONFLICT (patient_id)
    DO UPDATE SET
        points = reward_points.points + p_points,
        total_earned = reward_points.total_earned + p_points,
        updated_at = NOW();
    
    -- Record transaction
    INSERT INTO points_transactions (patient_id, points, transaction_type, source, description)
    VALUES (p_patient_id, p_points, 'earned', p_source, p_description);
END;
$$ LANGUAGE plpgsql;

-- Function to redeem points
CREATE OR REPLACE FUNCTION redeem_points(
    p_patient_id UUID,
    p_points INTEGER,
    p_description TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    current_points INTEGER;
BEGIN
    -- Get current points
    SELECT points INTO current_points
    FROM reward_points
    WHERE patient_id = p_patient_id;
    
    -- Check if enough points
    IF current_points IS NULL OR current_points < p_points THEN
        RETURN FALSE;
    END IF;
    
    -- Deduct points
    UPDATE reward_points
    SET points = points - p_points,
        total_redeemed = total_redeemed + p_points,
        updated_at = NOW()
    WHERE patient_id = p_patient_id;
    
    -- Record transaction
    INSERT INTO points_transactions (patient_id, points, transaction_type, source, description)
    VALUES (p_patient_id, -p_points, 'redeemed', 'discount_claimed', p_description);
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_reward_points_patient ON reward_points(patient_id);
CREATE INDEX IF NOT EXISTS idx_points_transactions_patient ON points_transactions(patient_id);
CREATE INDEX IF NOT EXISTS idx_points_transactions_created ON points_transactions(created_at DESC);

COMMENT ON TABLE reward_points IS 'Stores cumulative reward points for each patient';
COMMENT ON TABLE points_transactions IS 'Tracks all point earning and redemption activities';
COMMENT ON TABLE rewards_catalog IS 'Available rewards that can be claimed with points';
