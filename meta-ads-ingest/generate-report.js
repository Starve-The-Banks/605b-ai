const { Pool } = require('pg'); // FIXED: Use connection pool
const fs = require('fs').promises;
const ss = require('simple-statistics');
require('dotenv').config();

const log = (level, message, data = {}) => {
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    message,
    ...data
  }));
};

// FIXED: Connection pool for better performance
const pool = new Pool({
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  host: process.env.POSTGRES_HOST,
  port: process.env.POSTGRES_PORT,
  database: process.env.POSTGRES_DB,
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

async function generateReport() {
  log('INFO', 'Generating intelligence report');
  
  const client = await pool.connect();

  try {
    // FIXED: Use parameterized queries for date ranges
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    // Account summary (last 30 days) - FIXED: Better error handling
    const accountSummary = await client.query(`
      SELECT 
        COUNT(DISTINCT date_start) as active_days,
        COALESCE(SUM(spend), 0) as total_spend,
        COALESCE(SUM(impressions), 0) as total_impressions,
        COALESCE(SUM(clicks), 0) as total_clicks,
        COALESCE(ROUND(AVG(ctr), 2), 0) as avg_ctr,
        COALESCE(ROUND(AVG(cpc), 2), 0) as avg_cpc,
        COALESCE(ROUND(AVG(cpm), 2), 0) as avg_cpm,
        COALESCE(SUM(reach), 0) as total_reach
      FROM daily_account_metrics
      WHERE date_start >= $1::date
    `, [thirtyDaysAgo.toISOString().split('T')[0]]);
    
    // Campaign performance (last 7 days) - FIXED: Handle empty results
    const campaignSummary = await client.query(`
      SELECT 
        campaign_id,
        campaign_name,
        campaign_status,
        COALESCE(SUM(spend), 0) as total_spend,
        COALESCE(SUM(impressions), 0) as total_impressions,
        COALESCE(SUM(clicks), 0) as total_clicks,
        COALESCE(ROUND(AVG(ctr), 2), 0) as avg_ctr,
        COALESCE(ROUND(AVG(cpc), 2), 0) as avg_cpc,
        COALESCE(SUM(reach), 0) as total_reach
      FROM daily_campaign_metrics
      WHERE date_start >= $1::date
      GROUP BY campaign_id, campaign_name, campaign_status
      ORDER BY total_spend DESC
      LIMIT 10
    `, [sevenDaysAgo.toISOString().split('T')[0]]);
    
    // Adset performance (last 7 days) - FIXED: Handle null daily_budget  
    const adsetSummary = await client.query(`
      SELECT 
        adset_id,
        adset_name,
        campaign_id,
        adset_status,
        COALESCE(SUM(spend), 0) as total_spend,
        COALESCE(SUM(impressions), 0) as total_impressions,
        COALESCE(SUM(clicks), 0) as total_clicks,
        COALESCE(ROUND(AVG(ctr), 2), 0) as avg_ctr,
        COALESCE(ROUND(AVG(cpc), 2), 0) as avg_cpc,
        COALESCE(MAX(daily_budget), 0) as daily_budget
      FROM daily_adset_metrics
      WHERE date_start >= $1::date
      GROUP BY adset_id, adset_name, campaign_id, adset_status
      ORDER BY total_spend DESC
      LIMIT 10
    `, [sevenDaysAgo.toISOString().split('T')[0]]);
    
    // Top performers - FIXED: Better handling of missing ads
    const topPerformers = await client.query(`
      SELECT 
        aps.ad_id,
        COALESCE(a.name, 'Ad ID: ' || aps.ad_id) as ad_name,
        COALESCE(aps.ad_id, 'unknown') as campaign_id,
        COALESCE(performance_score, 0) as performance_score,
        COALESCE(overall_grade, 'N/A') as overall_grade,
        COALESCE(engagement_rate, 0) as ctr,
        COALESCE(spend_efficiency, 0) as cpc
      FROM ad_performance_scores aps
      LEFT JOIN ads a ON aps.ad_id = a.id
      WHERE date_start >= $1::date
      ORDER BY performance_score DESC NULLS LAST
      LIMIT 5
    `, [sevenDaysAgo.toISOString().split('T')[0]]);
    
    // Worst performers - FIXED: Handle nulls properly
    const worstPerformers = await client.query(`
      SELECT 
        aps.ad_id,
        COALESCE(a.name, 'Ad ID: ' || aps.ad_id) as ad_name,
        COALESCE(aps.ad_id, 'unknown') as campaign_id,
        COALESCE(performance_score, 0) as performance_score,
        COALESCE(overall_grade, 'N/A') as overall_grade,
        COALESCE(engagement_rate, 0) as ctr,
        COALESCE(spend_efficiency, 999) as cpc
      FROM ad_performance_scores aps
      LEFT JOIN ads a ON aps.ad_id = a.id
      WHERE date_start >= $1::date
      ORDER BY performance_score ASC NULLS LAST
      LIMIT 5
    `, [sevenDaysAgo.toISOString().split('T')[0]]);
    
    // Recent anomalies - FIXED: Better categorization
    const anomalies = await client.query(`
      SELECT 
        event_date,
        entity_type,
        entity_id,
        anomaly_type,
        severity,
        COALESCE(current_value, 0) as current_value,
        COALESCE(previous_value, 0) as previous_value,
        COALESCE(percentage_change, 0) as percentage_change,
        COALESCE(description, 'No description') as description
      FROM anomaly_events
      WHERE event_date >= $1::date
      ORDER BY event_date DESC, 
               CASE severity 
                 WHEN 'critical' THEN 1
                 WHEN 'high' THEN 2
                 WHEN 'medium' THEN 3
                 ELSE 4
               END ASC
      LIMIT 20
    `, [sevenDaysAgo.toISOString().split('T')[0]]);

    // Calculate trends and statistics - FIXED: Handle empty data
    const spendTrend = await client.query(`
      SELECT date_start, COALESCE(spend, 0) as spend 
      FROM daily_account_metrics 
      WHERE date_start >= $1::date
      ORDER BY date_start
    `, [sevenDaysAgo.toISOString().split('T')[0]]);

    const spendValues = spendTrend.rows.map(r => parseFloat(r.spend) || 0);
    let spendTrendDirection = 'stable';
    let volatility = 0;
    
    if (spendValues.length >= 2) {
      const firstHalf = spendValues.slice(0, Math.floor(spendValues.length / 2));
      const secondHalf = spendValues.slice(Math.floor(spendValues.length / 2));
      const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
      
      spendTrendDirection = secondAvg > firstAvg * 1.1 ? 'increasing' : 
                           secondAvg < firstAvg * 0.9 ? 'decreasing' : 'stable';
      volatility = spendValues.length >= 2 ? ss.standardDeviation(spendValues) : 0;
    }
    
    // FIXED: Better budget utilization calculation
    const budgetUtilization = adsetSummary.rows.length > 0 ? 
      (() => {
        const totalSpend = adsetSummary.rows.reduce((sum, a) => sum + parseFloat(a.total_spend || 0), 0);
        const totalBudget = adsetSummary.rows.reduce((sum, a) => sum + parseFloat(a.daily_budget || 0), 0) * 7; // 7 days
        return totalBudget > 0 ? ((totalSpend / totalBudget) * 100).toFixed(1) : 0;
      })() : 0;
    
    // Build comprehensive report
    const report = {
      generated_at: new Date().toISOString(),
      period: {
        account_summary: 'Last 30 days',
        performance_data: 'Last 7 days'
      },
      account_summary: {
        ...accountSummary.rows[0],
        spend_trend: spendTrendDirection,
        spend_volatility: volatility.toFixed(2)
      },
      campaign_performance: campaignSummary.rows,
      adset_performance: adsetSummary.rows,
      top_performers: topPerformers.rows,
      worst_performers: worstPerformers.rows,
      anomalies: {
        total_count: anomalies.rows.length,
        critical: anomalies.rows.filter(a => a.severity === 'critical').length,
        high: anomalies.rows.filter(a => a.severity === 'high').length,
        medium: anomalies.rows.filter(a => a.severity === 'medium').length,
        low: anomalies.rows.filter(a => a.severity === 'low').length,
        recent_events: anomalies.rows
      },
      insights: {
        total_campaigns: campaignSummary.rows.length,
        total_adsets: adsetSummary.rows.length,
        active_campaigns: campaignSummary.rows.filter(c => c.campaign_status === 'ACTIVE').length,
        budget_utilization: budgetUtilization,
        // FIXED: Add performance insights
        avg_performance_score: topPerformers.rows.length > 0 ? 
          (topPerformers.rows.reduce((sum, ad) => sum + parseFloat(ad.performance_score || 0), 0) / topPerformers.rows.length).toFixed(1) : 0,
        high_performing_ads: topPerformers.rows.filter(ad => parseFloat(ad.performance_score || 0) > 80).length
      },
      // FIXED: Add data quality metrics
      data_quality: {
        campaigns_with_data: campaignSummary.rows.filter(c => parseFloat(c.total_spend || 0) > 0).length,
        adsets_with_data: adsetSummary.rows.filter(a => parseFloat(a.total_spend || 0) > 0).length,
        data_freshness: spendTrend.rows.length > 0 ? spendTrend.rows[spendTrend.rows.length - 1].date_start : null
      }
    };
    
    // FIXED: Ensure output directory exists
    await fs.mkdir('output', { recursive: true });
    
    // Write report to file with better formatting
    await fs.writeFile('output/report.json', JSON.stringify(report, null, 2));
    log('INFO', 'Report generated', { 
      output_file: 'output/report.json',
      campaigns: report.campaign_performance.length,
      anomalies: report.anomalies.total_count,
      file_size_kb: Math.round((JSON.stringify(report).length / 1024) * 100) / 100
    });
    
    return report;
    
  } catch (error) {
    log('ERROR', 'Report generation failed', { error: error.message, stack: error.stack });
    throw error;
  } finally {
    client.release();
  }
}

// FIXED: Graceful shutdown
process.on('SIGINT', async () => {
  await pool.end();
  process.exit(0);
});

if (require.main === module) {
  generateReport().catch(error => {
    log('FATAL', 'Report generation failed', { error: error.message });
    process.exit(1);
  });
}

module.exports = { generateReport };