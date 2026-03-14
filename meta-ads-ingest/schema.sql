-- Campaigns table
CREATE TABLE IF NOT EXISTS campaigns (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    status VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Adsets table
CREATE TABLE IF NOT EXISTS adsets (
    id VARCHAR(255) PRIMARY KEY,
    campaign_id VARCHAR(255) REFERENCES campaigns(id),
    name VARCHAR(255) NOT NULL,
    status VARCHAR(50),
    daily_budget INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Ads table
CREATE TABLE IF NOT EXISTS ads (
    id VARCHAR(255) PRIMARY KEY,
    adset_id VARCHAR(255) REFERENCES adsets(id),
    campaign_id VARCHAR(255) REFERENCES campaigns(id),
    name VARCHAR(255) NOT NULL,
    status VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insights table (daily performance data)
CREATE TABLE IF NOT EXISTS insights (
    id SERIAL PRIMARY KEY,
    date_start DATE NOT NULL,
    date_stop DATE NOT NULL,
    campaign_id VARCHAR(255) REFERENCES campaigns(id),
    adset_id VARCHAR(255) REFERENCES adsets(id),
    ad_id VARCHAR(255) REFERENCES ads(id),
    spend DECIMAL(10, 2),
    impressions INTEGER,
    clicks INTEGER,
    cpc DECIMAL(10, 4),
    ctr DECIMAL(10, 4),
    reach INTEGER,
    actions JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(date_start, ad_id) -- Prevent duplicate entries for the same day and ad
);

-- Indexes for faster querying
CREATE INDEX IF NOT EXISTS idx_insights_date ON insights(date_start);
CREATE INDEX IF NOT EXISTS idx_insights_campaign_id ON insights(campaign_id);
CREATE INDEX IF NOT EXISTS idx_insights_adset_id ON insights(adset_id);
CREATE INDEX IF NOT EXISTS idx_insights_ad_id ON insights(ad_id);
