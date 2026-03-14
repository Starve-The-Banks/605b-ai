-- FIXED: Meta Ads Intelligence Schema with proper constraints and indexes

-- Drop existing views to recreate with better NULL handling
DROP VIEW IF EXISTS daily_account_metrics;
DROP VIEW IF EXISTS daily_campaign_metrics;  
DROP VIEW IF EXISTS daily_adset_metrics;
DROP VIEW IF EXISTS daily_ad_metrics;

-- FIXED: Daily account-level metrics with NULL handling
CREATE VIEW daily_account_metrics AS
SELECT 
    date_start,
    COALESCE(SUM(spend), 0) as spend,
    COALESCE(SUM(impressions), 0) as impressions,
    COALESCE(SUM(clicks), 0) as clicks,
    CASE WHEN SUM(impressions) > 0 THEN ROUND((SUM(clicks)::decimal / SUM(impressions)) * 100, 2) ELSE 0 END as ctr,
    CASE WHEN SUM(clicks) > 0 THEN ROUND(SUM(spend)::decimal / SUM(clicks), 4) ELSE 0 END as cpc,
    CASE WHEN SUM(impressions) > 0 THEN ROUND((SUM(spend)::decimal / SUM(impressions)) * 1000, 2) ELSE 0 END as cpm,
    COALESCE(SUM(reach), 0) as reach
FROM insights 
WHERE date_start >= CURRENT_DATE - INTERVAL '90 days' -- Extended for better analysis
GROUP BY date_start
ORDER BY date_start DESC;

-- FIXED: Daily campaign-level metrics with proper joins and NULL handling
CREATE VIEW daily_campaign_metrics AS
SELECT 
    i.date_start,
    i.campaign_id,
    COALESCE(c.name, 'Unknown Campaign') as campaign_name,
    COALESCE(c.status, 'UNKNOWN') as campaign_status,
    COALESCE(SUM(i.spend), 0) as spend,
    COALESCE(SUM(i.impressions), 0) as impressions,
    COALESCE(SUM(i.clicks), 0) as clicks,
    CASE WHEN SUM(i.impressions) > 0 THEN ROUND((SUM(i.clicks)::decimal / SUM(i.impressions)) * 100, 2) ELSE 0 END as ctr,
    CASE WHEN SUM(i.clicks) > 0 THEN ROUND(SUM(i.spend)::decimal / SUM(i.clicks), 4) ELSE 0 END as cpc,
    CASE WHEN SUM(i.impressions) > 0 THEN ROUND((SUM(i.spend)::decimal / SUM(i.impressions)) * 1000, 2) ELSE 0 END as cpm,
    COALESCE(SUM(i.reach), 0) as reach
FROM insights i
LEFT JOIN campaigns c ON i.campaign_id = c.id  -- FIXED: Use LEFT JOIN to handle orphaned data
WHERE i.date_start >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY i.date_start, i.campaign_id, c.name, c.status
ORDER BY i.date_start DESC, spend DESC;

-- FIXED: Daily adset-level metrics
CREATE VIEW daily_adset_metrics AS
SELECT 
    i.date_start,
    i.adset_id,
    i.campaign_id,
    COALESCE(a.name, 'Unknown Adset') as adset_name,
    COALESCE(a.status, 'UNKNOWN') as adset_status,
    a.daily_budget,
    COALESCE(SUM(i.spend), 0) as spend,
    COALESCE(SUM(i.impressions), 0) as impressions,
    COALESCE(SUM(i.clicks), 0) as clicks,
    CASE WHEN SUM(i.impressions) > 0 THEN ROUND((SUM(i.clicks)::decimal / SUM(i.impressions)) * 100, 2) ELSE 0 END as ctr,
    CASE WHEN SUM(i.clicks) > 0 THEN ROUND(SUM(i.spend)::decimal / SUM(i.clicks), 4) ELSE 0 END as cpc,
    CASE WHEN SUM(i.impressions) > 0 THEN ROUND((SUM(i.spend)::decimal / SUM(i.impressions)) * 1000, 2) ELSE 0 END as cpm,
    COALESCE(SUM(i.reach), 0) as reach
FROM insights i
LEFT JOIN adsets a ON i.adset_id = a.id  -- FIXED: Use LEFT JOIN
WHERE i.date_start >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY i.date_start, i.adset_id, i.campaign_id, a.name, a.status, a.daily_budget
ORDER BY i.date_start DESC, spend DESC;

-- FIXED: Daily ad-level metrics
CREATE VIEW daily_ad_metrics AS
SELECT 
    i.date_start,
    i.ad_id,
    i.adset_id,
    i.campaign_id,
    COALESCE(a.name, 'Unknown Ad') as ad_name,
    COALESCE(a.status, 'UNKNOWN') as ad_status,
    COALESCE(i.spend, 0) as spend,
    COALESCE(i.impressions, 0) as impressions,
    COALESCE(i.clicks, 0) as clicks,
    COALESCE(i.ctr, 0) as ctr,
    COALESCE(i.cpc, 0) as cpc,
    CASE WHEN i.impressions > 0 THEN ROUND((i.spend / i.impressions) * 1000, 2) ELSE 0 END as cpm,
    COALESCE(i.reach, 0) as reach,
    i.actions
FROM insights i
LEFT JOIN ads a ON i.ad_id = a.id  -- FIXED: Use LEFT JOIN
WHERE i.date_start >= CURRENT_DATE - INTERVAL '90 days'
ORDER BY i.date_start DESC, spend DESC;

-- FIXED: Add missing constraints and cascade deletes to existing tables
ALTER TABLE adsets DROP CONSTRAINT IF EXISTS adsets_campaign_id_fkey;
ALTER TABLE adsets ADD CONSTRAINT adsets_campaign_id_fkey 
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE;

ALTER TABLE ads DROP CONSTRAINT IF EXISTS ads_adset_id_fkey;
ALTER TABLE ads ADD CONSTRAINT ads_adset_id_fkey 
    FOREIGN KEY (adset_id) REFERENCES adsets(id) ON DELETE CASCADE;
    
ALTER TABLE ads DROP CONSTRAINT IF EXISTS ads_campaign_id_fkey;
ALTER TABLE ads ADD CONSTRAINT ads_campaign_id_fkey 
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE;

ALTER TABLE insights DROP CONSTRAINT IF EXISTS insights_campaign_id_fkey;
ALTER TABLE insights ADD CONSTRAINT insights_campaign_id_fkey 
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE;
    
ALTER TABLE insights DROP CONSTRAINT IF EXISTS insights_adset_id_fkey;
ALTER TABLE insights ADD CONSTRAINT insights_adset_id_fkey 
    FOREIGN KEY (adset_id) REFERENCES adsets(id) ON DELETE CASCADE;
    
ALTER TABLE insights DROP CONSTRAINT IF EXISTS insights_ad_id_fkey;
ALTER TABLE insights ADD CONSTRAINT insights_ad_id_fkey 
    FOREIGN KEY (ad_id) REFERENCES ads(id) ON DELETE CASCADE;

-- FIXED: Ad performance scores table with better constraints
ALTER TABLE ad_performance_scores DROP CONSTRAINT IF EXISTS ad_performance_scores_ad_id_fkey;
ALTER TABLE ad_performance_scores ADD CONSTRAINT ad_performance_scores_ad_id_fkey 
    FOREIGN KEY (ad_id) REFERENCES ads(id) ON DELETE CASCADE;

-- Add check constraints for data quality
ALTER TABLE ad_performance_scores 
    ADD CONSTRAINT chk_performance_score CHECK (performance_score >= 0 AND performance_score <= 100),
    ADD CONSTRAINT chk_spend_efficiency CHECK (spend_efficiency >= 0),
    ADD CONSTRAINT chk_engagement_rate CHECK (engagement_rate >= 0),
    ADD CONSTRAINT chk_reach_efficiency CHECK (reach_efficiency >= 0);

-- FIXED: Anomaly events table with proper unique constraint
ALTER TABLE anomaly_events 
    ADD CONSTRAINT unique_anomaly_per_entity_date_type 
    UNIQUE (entity_type, entity_id, anomaly_type, event_date);

-- Add enum constraints for better data integrity
ALTER TABLE anomaly_events 
    ADD CONSTRAINT chk_entity_type CHECK (entity_type IN ('account', 'campaign', 'adset', 'ad')),
    ADD CONSTRAINT chk_severity CHECK (severity IN ('low', 'medium', 'high', 'critical'));

-- FIXED: Better indexes for performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_insights_composite_date_campaign 
    ON insights(date_start DESC, campaign_id) WHERE date_start >= CURRENT_DATE - INTERVAL '90 days';
    
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_insights_composite_date_adset 
    ON insights(date_start DESC, adset_id) WHERE date_start >= CURRENT_DATE - INTERVAL '90 days';
    
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_insights_composite_spend_date 
    ON insights(spend DESC, date_start DESC) WHERE spend > 0;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ad_performance_composite 
    ON ad_performance_scores(date_start DESC, performance_score DESC);
    
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_anomaly_events_composite 
    ON anomaly_events(event_date DESC, severity, anomaly_type);

-- FIXED: Add updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to all tables with updated_at
DROP TRIGGER IF EXISTS update_campaigns_updated_at ON campaigns;
CREATE TRIGGER update_campaigns_updated_at 
    BEFORE UPDATE ON campaigns 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_adsets_updated_at ON adsets;
CREATE TRIGGER update_adsets_updated_at 
    BEFORE UPDATE ON adsets 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_ads_updated_at ON ads;
CREATE TRIGGER update_ads_updated_at 
    BEFORE UPDATE ON ads 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_insights_updated_at ON insights;
CREATE TRIGGER update_insights_updated_at 
    BEFORE UPDATE ON insights 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add materialized view for expensive aggregations
CREATE MATERIALIZED VIEW campaign_performance_summary AS
SELECT 
    campaign_id,
    MAX(campaign_name) as campaign_name,
    MAX(campaign_status) as campaign_status,
    COUNT(DISTINCT date_start) as active_days,
    SUM(spend) as total_spend,
    SUM(impressions) as total_impressions,
    SUM(clicks) as total_clicks,
    AVG(ctr) as avg_ctr,
    AVG(cpc) as avg_cpc,
    AVG(cpm) as avg_cpm,
    MAX(date_start) as last_active_date,
    MIN(date_start) as first_active_date
FROM daily_campaign_metrics
WHERE date_start >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY campaign_id;

CREATE UNIQUE INDEX idx_campaign_summary_id ON campaign_performance_summary(campaign_id);