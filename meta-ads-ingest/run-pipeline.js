const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs').promises;
const { Pool } = require('pg'); // FIXED: Use connection pool instead of Client
require('dotenv').config();

const execAsync = promisify(exec);

const log = (level, message, data = {}) => {
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    message,
    ...data
  }));
};

// FIXED: Create connection pool for better performance
const pool = new Pool({
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  host: process.env.POSTGRES_HOST,
  port: process.env.POSTGRES_PORT,
  database: process.env.POSTGRES_DB,
  max: 10, // Maximum connections in pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

async function createOutputDir() {
  try {
    await fs.mkdir('output', { recursive: true });
  } catch (err) {
    // Directory might already exist, ignore
  }
}

async function runIngestion() {
  log('INFO', 'Step 1: Running Meta Ads data ingestion');
  try {
    const { stdout, stderr } = await execAsync('node fetch-meta-ads.js');
    if (stderr) log('WARN', 'Ingestion warnings', { stderr });
    log('INFO', 'Ingestion completed successfully');
    return true;
  } catch (error) {
    log('ERROR', 'Ingestion failed', { error: error.message });
    return false;
  }
}

async function updateMetrics(client) {
  log('INFO', 'Step 2: Updating performance metrics');
  
  try {
    // FIXED: Use transactions for atomicity
    await client.query('BEGIN');
    
    // Calculate ad performance scores with parameterized query
    const result = await client.query(`
      INSERT INTO ad_performance_scores (ad_id, date_start, performance_score, spend_efficiency, engagement_rate, reach_efficiency, overall_grade)
      SELECT 
        ad_id,
        date_start,
        CASE 
          WHEN ctr > $1 AND cpc < $2 THEN 95
          WHEN ctr > $3 AND cpc < $4 THEN 85
          WHEN ctr > $5 AND cpc < $6 THEN 75
          WHEN ctr > $7 AND cpc < $8 THEN 65
          WHEN ctr > $9 AND cpc < $10 THEN 55
          ELSE 45
        END as performance_score,
        CASE WHEN clicks > 0 THEN spend / clicks ELSE 999 END as spend_efficiency,
        ctr as engagement_rate,
        CASE WHEN spend > 0 THEN reach / spend ELSE 0 END as reach_efficiency,
        CASE 
          WHEN ctr > $11 AND cpc < $12 THEN 'A+'
          WHEN ctr > $13 AND cpc < $14 THEN 'A'
          WHEN ctr > $15 AND cpc < $16 THEN 'B+'
          WHEN ctr > $17 AND cpc < $18 THEN 'B'
          WHEN ctr > $19 AND cpc < $20 THEN 'C'
          ELSE 'D'
        END as overall_grade
      FROM daily_ad_metrics
      WHERE date_start >= CURRENT_DATE - INTERVAL '7 days'
      ON CONFLICT (ad_id, date_start) DO UPDATE SET
        performance_score = EXCLUDED.performance_score,
        spend_efficiency = EXCLUDED.spend_efficiency,
        engagement_rate = EXCLUDED.engagement_rate,
        reach_efficiency = EXCLUDED.reach_efficiency,
        overall_grade = EXCLUDED.overall_grade,
        created_at = CURRENT_TIMESTAMP
    `, [2.0, 1.0, 1.5, 1.5, 1.0, 2.0, 0.5, 3.0, 0.3, 5.0, 2.0, 1.0, 1.5, 1.5, 1.0, 2.0, 0.5, 3.0, 0.3, 5.0]); // FIXED: Parameterized query
    
    await client.query('COMMIT');
    log('INFO', 'Performance metrics updated', { rows_affected: result.rowCount });
    
  } catch (error) {
    await client.query('ROLLBACK');
    log('ERROR', 'Failed to update metrics', { error: error.message });
    throw error;
  }
}

async function detectAnomalies(client) {
  log('INFO', 'Step 3: Detecting anomalies');
  
  try {
    await client.query('BEGIN');
    
    // FIXED: Use parameterized queries for date handling
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const todayStr = today.toISOString().split('T')[0];
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    // Detect spend spikes >30% day-over-day
    const spendSpikes = await client.query(`
      INSERT INTO anomaly_events (event_date, entity_type, entity_id, anomaly_type, severity, current_value, previous_value, threshold_value, percentage_change, description)
      SELECT 
        $1::date as event_date,
        'ad' as entity_type,
        today.ad_id as entity_id,
        'spend_spike' as anomaly_type,
        CASE 
          WHEN ((today.spend - yesterday.spend) / NULLIF(yesterday.spend, 0)) > 1.0 THEN 'critical'
          WHEN ((today.spend - yesterday.spend) / NULLIF(yesterday.spend, 0)) > 0.5 THEN 'high'
          ELSE 'medium'
        END as severity,
        today.spend as current_value,
        yesterday.spend as previous_value,
        yesterday.spend * 1.3 as threshold_value,
        ((today.spend - yesterday.spend) / NULLIF(yesterday.spend, 0)) * 100 as percentage_change,
        'Ad spend increased by ' || ROUND(((today.spend - yesterday.spend) / NULLIF(yesterday.spend, 0)) * 100, 1) || '% from previous day' as description
      FROM 
        (SELECT ad_id, spend FROM daily_ad_metrics WHERE date_start = $2::date) today
      JOIN 
        (SELECT ad_id, spend FROM daily_ad_metrics WHERE date_start = $3::date) yesterday
        ON today.ad_id = yesterday.ad_id
      WHERE 
        yesterday.spend > 0 
        AND ((today.spend - yesterday.spend) / yesterday.spend) > 0.3
      ON CONFLICT (entity_type, entity_id, anomaly_type, event_date) DO NOTHING
    `, [todayStr, todayStr, yesterdayStr]);

    // Detect CTR drops >30%
    const ctrDrops = await client.query(`
      INSERT INTO anomaly_events (event_date, entity_type, entity_id, anomaly_type, severity, current_value, previous_value, threshold_value, percentage_change, description)
      SELECT 
        $1::date as event_date,
        'ad' as entity_type,
        today.ad_id as entity_id,
        'ctr_drop' as anomaly_type,
        CASE 
          WHEN ((yesterday.ctr - today.ctr) / NULLIF(yesterday.ctr, 0)) > 0.5 THEN 'high'
          ELSE 'medium'
        END as severity,
        today.ctr as current_value,
        yesterday.ctr as previous_value,
        yesterday.ctr * 0.7 as threshold_value,
        -((yesterday.ctr - today.ctr) / NULLIF(yesterday.ctr, 0)) * 100 as percentage_change,
        'Ad CTR dropped by ' || ROUND(((yesterday.ctr - today.ctr) / NULLIF(yesterday.ctr, 0)) * 100, 1) || '% from previous day' as description
      FROM 
        (SELECT ad_id, ctr FROM daily_ad_metrics WHERE date_start = $2::date) today
      JOIN 
        (SELECT ad_id, ctr FROM daily_ad_metrics WHERE date_start = $3::date) yesterday
        ON today.ad_id = yesterday.ad_id
      WHERE 
        yesterday.ctr > 0 
        AND ((yesterday.ctr - today.ctr) / yesterday.ctr) > 0.3
      ON CONFLICT (entity_type, entity_id, anomaly_type, event_date) DO NOTHING
    `, [todayStr, todayStr, yesterdayStr]);

    // Detect adsets with spend but no clicks (last 7 days)
    const noClicksSpend = await client.query(`
      INSERT INTO anomaly_events (event_date, entity_type, entity_id, anomaly_type, severity, current_value, previous_value, threshold_value, percentage_change, description)
      SELECT 
        date_start as event_date,
        'adset' as entity_type,
        adset_id as entity_id,
        'no_clicks_with_spend' as anomaly_type,
        CASE 
          WHEN spend > 50 THEN 'critical'
          WHEN spend > 20 THEN 'high'
          ELSE 'medium'
        END as severity,
        clicks as current_value,
        spend as previous_value,
        0 as threshold_value,
        0 as percentage_change,
        'Adset spent $' || ROUND(spend, 2) || ' with zero clicks on ' || date_start as description
      FROM daily_adset_metrics
      WHERE date_start >= CURRENT_DATE - INTERVAL '7 days'
        AND spend > 5 
        AND clicks = 0
      ON CONFLICT (entity_type, entity_id, anomaly_type, event_date) DO NOTHING
    `);
    
    // FIXED: Detect high CPC spikes
    const cpcSpikes = await client.query(`
      INSERT INTO anomaly_events (event_date, entity_type, entity_id, anomaly_type, severity, current_value, previous_value, threshold_value, percentage_change, description)
      SELECT 
        $1::date as event_date,
        'ad' as entity_type,
        today.ad_id as entity_id,
        'cpc_spike' as anomaly_type,
        CASE 
          WHEN ((today.cpc - yesterday.cpc) / NULLIF(yesterday.cpc, 0)) > 1.0 THEN 'critical'
          WHEN ((today.cpc - yesterday.cpc) / NULLIF(yesterday.cpc, 0)) > 0.6 THEN 'high'
          ELSE 'medium'
        END as severity,
        today.cpc as current_value,
        yesterday.cpc as previous_value,
        yesterday.cpc * 1.4 as threshold_value,
        ((today.cpc - yesterday.cpc) / NULLIF(yesterday.cpc, 0)) * 100 as percentage_change,
        'Ad CPC spiked by ' || ROUND(((today.cpc - yesterday.cpc) / NULLIF(yesterday.cpc, 0)) * 100, 1) || '% from previous day' as description
      FROM 
        (SELECT ad_id, cpc FROM daily_ad_metrics WHERE date_start = $2::date AND cpc > 0) today
      JOIN 
        (SELECT ad_id, cpc FROM daily_ad_metrics WHERE date_start = $3::date AND cpc > 0) yesterday
        ON today.ad_id = yesterday.ad_id
      WHERE 
        yesterday.cpc > 0 
        AND ((today.cpc - yesterday.cpc) / yesterday.cpc) > 0.4
      ON CONFLICT (entity_type, entity_id, anomaly_type, event_date) DO NOTHING
    `, [todayStr, todayStr, yesterdayStr]);

    await client.query('COMMIT');
    
    const totalAnomalies = spendSpikes.rowCount + ctrDrops.rowCount + noClicksSpend.rowCount + cpcSpikes.rowCount;
    log('INFO', 'Anomaly detection completed', { 
      spend_spikes: spendSpikes.rowCount,
      ctr_drops: ctrDrops.rowCount,
      no_clicks_spend: noClicksSpend.rowCount,
      cpc_spikes: cpcSpikes.rowCount,
      total_anomalies: totalAnomalies
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    log('ERROR', 'Anomaly detection failed', { error: error.message });
    throw error;
  }
}

async function refreshMaterializedViews(client) {
  log('INFO', 'Refreshing materialized views');
  try {
    await client.query('REFRESH MATERIALIZED VIEW CONCURRENTLY campaign_performance_summary');
    log('INFO', 'Materialized views refreshed');
  } catch (error) {
    log('WARN', 'Failed to refresh materialized views', { error: error.message });
  }
}

async function generateReports() {
  log('INFO', 'Step 4: Generating reports');
  try {
    await Promise.all([
      execAsync('node generate-report.js'),
      execAsync('node export-dashboard-json.js')
    ]); // FIXED: Run reports in parallel for better performance
    log('INFO', 'Reports generated successfully');
    return true;
  } catch (error) {
    log('ERROR', 'Report generation failed', { error: error.message });
    return false;
  }
}

async function validateDataQuality(client) {
  log('INFO', 'Validating data quality');
  
  const checks = await client.query(`
    SELECT 
      'campaigns' as table_name, COUNT(*) as row_count,
      COUNT(*) FILTER (WHERE name IS NULL OR name = '') as null_names
    FROM campaigns
    UNION ALL
    SELECT 
      'adsets', COUNT(*),
      COUNT(*) FILTER (WHERE name IS NULL OR name = '')
    FROM adsets
    UNION ALL
    SELECT 
      'insights', COUNT(*),
      COUNT(*) FILTER (WHERE spend < 0 OR impressions < 0 OR clicks < 0)
    FROM insights
  `);
  
  const qualityIssues = checks.rows.filter(row => row.null_names > 0);
  if (qualityIssues.length > 0) {
    log('WARN', 'Data quality issues detected', { issues: qualityIssues });
  } else {
    log('INFO', 'Data quality check passed', { tables: checks.rows });
  }
}

async function main() {
  log('INFO', 'Starting Meta Ads Intelligence Pipeline');
  
  const client = await pool.connect();
  
  try {
    await createOutputDir();
    
    // Step 1: Fetch Meta data
    const ingestionSuccess = await runIngestion();
    if (!ingestionSuccess) {
      log('FATAL', 'Pipeline failed at ingestion step');
      process.exit(1);
    }
    
    // Step 2: Update metrics
    await updateMetrics(client);
    
    // Step 3: Detect anomalies
    await detectAnomalies(client);
    
    // Step 3.5: Refresh materialized views
    await refreshMaterializedViews(client);
    
    // Step 3.6: Validate data quality
    await validateDataQuality(client);
    
    // Step 4: Generate reports
    const reportSuccess = await generateReports();
    if (!reportSuccess) {
      log('WARN', 'Report generation had issues but pipeline continues');
    }
    
    log('INFO', 'Meta Ads Intelligence Pipeline completed successfully');
    
  } catch (error) {
    log('FATAL', 'Pipeline failed', { error: error.message, stack: error.stack });
    process.exit(1);
  } finally {
    client.release();
  }
}

// FIXED: Graceful shutdown handling
process.on('SIGINT', async () => {
  log('INFO', 'Shutting down gracefully');
  await pool.end();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  log('INFO', 'Shutting down gracefully');
  await pool.end();
  process.exit(0);
});

if (require.main === module) {
  main().catch(error => {
    log('FATAL', 'Pipeline failed', { error: error.message, stack: error.stack });
    process.exit(1);
  });
}

module.exports = { main };