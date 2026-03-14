const { Pool } = require('pg'); // FIXED: Use connection pool
const fs = require('fs').promises;
require('dotenv').config();

const log = (level, message, data = {}) => {
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    message,
    ...data
  }));
};

// FIXED: Connection pool
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

async function exportDashboard() {
  log('INFO', 'Exporting dashboard data');
  
  const client = await pool.connect();

  try {
    // FIXED: Use parameterized date ranges
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    // Daily spend chart data (last 14 days) - FIXED: Handle missing data
    const dailySpend = await client.query(`
      SELECT 
        date_start as date,
        COALESCE(spend, 0) as spend,
        COALESCE(impressions, 0) as impressions,
        COALESCE(clicks, 0) as clicks,
        COALESCE(ctr, 0) as ctr,
        COALESCE(cpc, 0) as cpc
      FROM daily_account_metrics
      WHERE date_start >= $1::date
      ORDER BY date_start ASC
    `, [fourteenDaysAgo.toISOString().split('T')[0]]);
    
    // Campaign performance pie chart - FIXED: Better aggregation
    const campaignSpend = await client.query(`
      SELECT 
        campaign_name as name,
        COALESCE(SUM(spend), 0) as value,
        campaign_status as status
      FROM daily_campaign_metrics
      WHERE date_start >= $1::date
      GROUP BY campaign_name, campaign_status
      HAVING SUM(spend) > 0  -- FIXED: Only include campaigns with spend
      ORDER BY value DESC
      LIMIT 10
    `, [sevenDaysAgo.toISOString().split('T')[0]]);
    
    // Performance grade distribution - FIXED: Handle missing grades
    const gradeDistribution = await client.query(`
      SELECT 
        COALESCE(overall_grade, 'N/A') as grade,
        COUNT(*) as count,
        COALESCE(ROUND(AVG(performance_score), 1), 0) as avg_score
      FROM ad_performance_scores
      WHERE date_start >= $1::date
      GROUP BY overall_grade
      ORDER BY 
        CASE COALESCE(overall_grade, 'N/A')
          WHEN 'A+' THEN 1
          WHEN 'A' THEN 2
          WHEN 'B+' THEN 3
          WHEN 'B' THEN 4
          WHEN 'C+' THEN 5
          WHEN 'C' THEN 6
          WHEN 'D' THEN 7
          ELSE 8
        END
    `, [sevenDaysAgo.toISOString().split('T')[0]]);
    
    // Anomaly timeline - FIXED: Better categorization and handling
    const anomalyTimeline = await client.query(`
      SELECT 
        event_date as date,
        anomaly_type,
        severity,
        COUNT(*) as count
      FROM anomaly_events
      WHERE event_date >= $1::date
      GROUP BY event_date, anomaly_type, severity
      ORDER BY event_date ASC
    `, [fourteenDaysAgo.toISOString().split('T')[0]]);
    
    // Top spending adsets with performance - FIXED: Better metrics
    const adsetPerformance = await client.query(`
      SELECT 
        adset_name as name,
        COALESCE(SUM(spend), 0) as spend,
        COALESCE(SUM(clicks), 0) as clicks,
        COALESCE(ROUND(AVG(NULLIF(ctr, 0)), 2), 0) as ctr,
        COALESCE(ROUND(AVG(NULLIF(cpc, 0)), 2), 0) as cpc,
        adset_status as status
      FROM daily_adset_metrics
      WHERE date_start >= $1::date
      GROUP BY adset_name, adset_status
      HAVING SUM(spend) > 0  -- FIXED: Only show adsets with spend
      ORDER BY spend DESC
      LIMIT 10
    `, [sevenDaysAgo.toISOString().split('T')[0]]);
    
    // Key metrics summary - FIXED: Better calculations
    const keyMetrics = await client.query(`
      SELECT 
        COALESCE(ROUND(SUM(spend), 2), 0) as total_spend,
        COALESCE(SUM(impressions), 0) as total_impressions,
        COALESCE(SUM(clicks), 0) as total_clicks,
        COALESCE(ROUND(
          CASE WHEN SUM(impressions) > 0 
               THEN (SUM(clicks)::decimal / SUM(impressions)) * 100 
               ELSE 0 END, 2), 0) as avg_ctr,
        COALESCE(ROUND(
          CASE WHEN SUM(clicks) > 0 
               THEN SUM(spend)::decimal / SUM(clicks) 
               ELSE 0 END, 2), 0) as avg_cpc,
        COALESCE(ROUND(
          CASE WHEN SUM(impressions) > 0 
               THEN (SUM(spend)::decimal / SUM(impressions)) * 1000 
               ELSE 0 END, 2), 0) as avg_cpm
      FROM daily_account_metrics
      WHERE date_start >= $1::date
    `, [sevenDaysAgo.toISOString().split('T')[0]]);
    
    // Alert summary - FIXED: Better categorization
    const alerts = await client.query(`
      SELECT 
        severity,
        COUNT(*) as count,
        MAX(event_date) as latest_event,
        string_agg(DISTINCT anomaly_type, ', ' ORDER BY anomaly_type) as types
      FROM anomaly_events
      WHERE event_date >= $1::date
      GROUP BY severity
      ORDER BY CASE severity 
                 WHEN 'critical' THEN 1
                 WHEN 'high' THEN 2
                 WHEN 'medium' THEN 3
                 ELSE 4
               END
    `, [sevenDaysAgo.toISOString().split('T')[0]]);

    // FIXED: Calculate performance trends
    const performanceTrends = await client.query(`
      SELECT 
        date_start,
        COALESCE(COUNT(*), 0) as total_ads,
        COALESCE(COUNT(*) FILTER (WHERE performance_score >= 80), 0) as high_performing,
        COALESCE(ROUND(AVG(performance_score), 1), 0) as avg_score
      FROM ad_performance_scores
      WHERE date_start >= $1::date
      GROUP BY date_start
      ORDER BY date_start ASC
    `, [sevenDaysAgo.toISOString().split('T')[0]]);

    // Build dashboard data structure
    const dashboard = {
      generated_at: new Date().toISOString(),
      period: 'Last 7 days',
      
      // KPI Cards - FIXED: Handle null values
      kpis: {
        total_spend: parseFloat(keyMetrics.rows[0]?.total_spend || 0),
        total_impressions: parseInt(keyMetrics.rows[0]?.total_impressions || 0),
        total_clicks: parseInt(keyMetrics.rows[0]?.total_clicks || 0),
        avg_ctr: parseFloat(keyMetrics.rows[0]?.avg_ctr || 0),
        avg_cpc: parseFloat(keyMetrics.rows[0]?.avg_cpc || 0),
        avg_cpm: parseFloat(keyMetrics.rows[0]?.avg_cpm || 0)
      },
      
      // Charts data
      charts: {
        daily_spend: {
          type: 'line',
          title: 'Daily Spend Trend',
          data: dailySpend.rows.map(row => ({
            date: row.date,
            spend: parseFloat(row.spend || 0),
            clicks: parseInt(row.clicks || 0),
            ctr: parseFloat(row.ctr || 0)
          })),
          // FIXED: Add summary stats
          summary: {
            total_days: dailySpend.rows.length,
            avg_daily_spend: dailySpend.rows.length > 0 ? 
              (dailySpend.rows.reduce((sum, row) => sum + parseFloat(row.spend || 0), 0) / dailySpend.rows.length).toFixed(2) : 0
          }
        },
        
        campaign_distribution: {
          type: 'pie',
          title: 'Campaign Spend Distribution',
          data: campaignSpend.rows.map(row => ({
            name: row.name || 'Unknown Campaign',
            value: parseFloat(row.value || 0),
            status: row.status || 'UNKNOWN'
          })),
          summary: {
            total_campaigns: campaignSpend.rows.length,
            active_campaigns: campaignSpend.rows.filter(c => c.status === 'ACTIVE').length
          }
        },
        
        grade_distribution: {
          type: 'bar',
          title: 'Ad Performance Grades',
          data: gradeDistribution.rows.map(row => ({
            grade: row.grade || 'N/A',
            count: parseInt(row.count || 0),
            avg_score: parseFloat(row.avg_score || 0)
          })),
          summary: {
            total_ads: gradeDistribution.rows.reduce((sum, row) => sum + parseInt(row.count || 0), 0),
            high_performers: gradeDistribution.rows.filter(row => ['A+', 'A'].includes(row.grade)).reduce((sum, row) => sum + parseInt(row.count || 0), 0)
          }
        },
        
        anomaly_timeline: {
          type: 'scatter',
          title: 'Anomaly Events Timeline',
          data: anomalyTimeline.rows.map(row => ({
            date: row.date,
            type: row.anomaly_type || 'unknown',
            severity: row.severity || 'low',
            count: parseInt(row.count || 0)
          })),
          summary: {
            total_anomalies: anomalyTimeline.rows.reduce((sum, row) => sum + parseInt(row.count || 0), 0),
            days_with_anomalies: new Set(anomalyTimeline.rows.map(row => row.date)).size
          }
        },

        // FIXED: Add performance trends chart
        performance_trends: {
          type: 'line',
          title: 'Daily Performance Trends',
          data: performanceTrends.rows.map(row => ({
            date: row.date_start,
            total_ads: parseInt(row.total_ads || 0),
            high_performing: parseInt(row.high_performing || 0),
            avg_score: parseFloat(row.avg_score || 0)
          }))
        }
      },
      
      // Data tables
      tables: {
        adset_performance: {
          title: 'Top Adsets by Spend',
          columns: ['name', 'spend', 'clicks', 'ctr', 'cpc', 'status'],
          data: adsetPerformance.rows.map(row => ({
            name: row.name || 'Unknown Adset',
            spend: parseFloat(row.spend || 0),
            clicks: parseInt(row.clicks || 0),
            ctr: parseFloat(row.ctr || 0),
            cpc: parseFloat(row.cpc || 0),
            status: row.status || 'UNKNOWN'
          }))
        }
      },
      
      // Alert summary - FIXED: Better structure
      alerts: {
        total: alerts.rows.reduce((sum, row) => sum + parseInt(row.count || 0), 0),
        by_severity: alerts.rows.reduce((acc, row) => {
          acc[row.severity || 'unknown'] = {
            count: parseInt(row.count || 0),
            types: row.types || '',
            latest_event: row.latest_event
          };
          return acc;
        }, {}),
        latest_event: alerts.rows.length > 0 ? 
          alerts.rows.reduce((latest, row) => 
            new Date(row.latest_event || 0) > new Date(latest || 0) ? row.latest_event : latest, 
            alerts.rows[0].latest_event) : null
      },
      
      // FIXED: Enhanced metadata
      meta: {
        data_freshness: new Date().toISOString(),
        refresh_interval: '1 hour',
        version: '2.0.0',
        data_quality: {
          campaigns_with_data: campaignSpend.rows.length,
          adsets_with_data: adsetPerformance.rows.length,
          ads_with_scores: gradeDistribution.rows.reduce((sum, row) => sum + parseInt(row.count || 0), 0),
          anomalies_detected: anomalyTimeline.rows.reduce((sum, row) => sum + parseInt(row.count || 0), 0)
        }
      }
    };
    
    // FIXED: Ensure output directory exists
    await fs.mkdir('output', { recursive: true });
    
    // Write dashboard to file
    await fs.writeFile('output/dashboard.json', JSON.stringify(dashboard, null, 2));
    log('INFO', 'Dashboard exported', { 
      output_file: 'output/dashboard.json',
      chart_types: Object.keys(dashboard.charts).length,
      total_alerts: dashboard.alerts.total,
      file_size_kb: Math.round((JSON.stringify(dashboard).length / 1024) * 100) / 100
    });
    
    return dashboard;
    
  } catch (error) {
    log('ERROR', 'Dashboard export failed', { error: error.message, stack: error.stack });
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
  exportDashboard().catch(error => {
    log('FATAL', 'Dashboard export failed', { error: error.message });
    process.exit(1);
  });
}

module.exports = { exportDashboard };