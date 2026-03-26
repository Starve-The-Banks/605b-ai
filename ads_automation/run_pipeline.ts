#!/usr/bin/env ts-node

import { AdScriptGenerator } from './scripts/generate_ad_scripts.js';
import { ElevenLabsVoiceGenerator } from './voice/generate_voice.js';
import { CreatomateVideoRenderer } from './videos/render_ads.js';
import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.ads.env.local' });

interface PipelineConfig {
  scriptCount: number;
  skipScripts?: boolean;
  skipVoice?: boolean;
  skipRender?: boolean;
  checkRenders?: boolean;
}

class AdGenerationPipeline {
  private config: PipelineConfig;

  constructor(config: PipelineConfig) {
    this.config = config;
  }

  private async validateEnvironment(): Promise<void> {
    console.log('🔍 Validating environment...');
    
    const requiredVars = [];
    
    if (!this.config.skipScripts && !process.env.OPENAI_API_KEY) {
      requiredVars.push('OPENAI_API_KEY');
    }
    
    if (!this.config.skipVoice && !process.env.ELEVENLABS_API_KEY) {
      requiredVars.push('ELEVENLABS_API_KEY');  
    }
    
    if (!this.config.skipRender && !process.env.CREATOMATE_API_KEY) {
      requiredVars.push('CREATOMATE_API_KEY');
    }
    
    if (requiredVars.length > 0) {
      console.error('❌ Missing required environment variables:');
      requiredVars.forEach(varName => {
        console.error(`   - ${varName}`);
      });
      console.error('\n📝 Add these to .ads.env.local file');
      throw new Error('Environment validation failed');
    }
    
    console.log('✅ Environment validated');
  }

  private async validateAssets(): Promise<void> {
    console.log('🎨 Validating assets...');
    
    const assetsDir = path.join(process.cwd(), 'ads_automation', 'assets');
    const requiredAssets = ['logo.png', 'screen_scan.mp4', 'screen_report.mp4', 'screen_results.mp4'];
    
    const missingAssets = [];
    
    for (const asset of requiredAssets) {
      try {
        const assetPath = path.join(assetsDir, asset);
        const stats = await fs.stat(assetPath);
        
        // Check if it's a placeholder file (very small)
        if (stats.size < 100) {
          missingAssets.push(`${asset} (placeholder)`);
        }
      } catch (error) {
        missingAssets.push(`${asset} (missing)`);
      }
    }
    
    if (missingAssets.length > 0) {
      console.warn('⚠️  Asset warnings:');
      missingAssets.forEach(asset => {
        console.warn(`   - ${asset}`);
      });
      console.warn('\n📖 See ads_automation/assets/README.md for guidance');
      console.warn('🎬 Videos will render with placeholders');
    } else {
      console.log('✅ All assets available');
    }
  }

  async runStep1_GenerateScripts(): Promise<boolean> {
    if (this.config.skipScripts) {
      console.log('⏭️  Skipping script generation (existing scripts will be used)');
      return true;
    }
    
    try {
      console.log('\n🎬 STEP 1: Generating Ad Scripts');
      console.log('=' .repeat(50));
      
      const generator = new AdScriptGenerator();
      await generator.generateMultipleScripts(this.config.scriptCount);
      
      console.log('✅ Script generation complete');
      return true;
    } catch (error) {
      console.error('❌ Script generation failed:', error);
      return false;
    }
  }

  async runStep2_GenerateVoice(): Promise<boolean> {
    if (this.config.skipVoice) {
      console.log('⏭️  Skipping voice generation (existing audio will be used)');
      return true;
    }
    
    try {
      console.log('\n🎤 STEP 2: Generating Voiceovers');
      console.log('=' .repeat(50));
      
      const generator = new ElevenLabsVoiceGenerator();
      await generator.generateAllVoiceovers();
      
      console.log('✅ Voice generation complete');
      return true;
    } catch (error) {
      console.error('❌ Voice generation failed:', error);
      return false;
    }
  }

  async runStep3_RenderVideos(): Promise<boolean> {
    if (this.config.skipRender) {
      console.log('⏭️  Skipping video rendering');
      return true;
    }
    
    try {
      console.log('\n🎬 STEP 3: Rendering Videos'); 
      console.log('=' .repeat(50));
      
      const renderer = new CreatomateVideoRenderer();
      await renderer.renderAllAds();
      
      console.log('✅ Video rendering pipeline complete');
      return true;
    } catch (error) {
      console.error('❌ Video rendering failed:', error);
      return false;
    }
  }

  async checkRenderStatus(): Promise<void> {
    try {
      console.log('\n🔍 CHECKING RENDER STATUS');
      console.log('=' .repeat(50));
      
      const renderer = new CreatomateVideoRenderer();
      await renderer.checkAllRenders();
      
      console.log('✅ Render status check complete');
    } catch (error) {
      console.error('❌ Render status check failed:', error);
    }
  }

  async runFullPipeline(): Promise<void> {
    console.log('🚀 605b.ai Automated Ad Generation Pipeline');
    console.log('=' .repeat(60));
    console.log(`📊 Configuration:`);
    console.log(`   Scripts to generate: ${this.config.scriptCount}`);
    console.log(`   Skip scripts: ${this.config.skipScripts ? '✅' : '❌'}`);
    console.log(`   Skip voice: ${this.config.skipVoice ? '✅' : '❌'}`);
    console.log(`   Skip render: ${this.config.skipRender ? '✅' : '❌'}`);
    console.log('');

    const startTime = Date.now();
    
    try {
      // Environment validation
      await this.validateEnvironment();
      await this.validateAssets();
      
      // Check renders only mode
      if (this.config.checkRenders) {
        await this.checkRenderStatus();
        return;
      }
      
      // Run pipeline steps
      const step1Success = await this.runStep1_GenerateScripts();
      if (!step1Success && !this.config.skipScripts) return;
      
      const step2Success = await this.runStep2_GenerateVoice();
      if (!step2Success && !this.config.skipVoice) return;
      
      const step3Success = await this.runStep3_RenderVideos();
      if (!step3Success && !this.config.skipRender) return;
      
      // Success summary
      const duration = Math.round((Date.now() - startTime) / 1000);
      console.log('\n🎉 PIPELINE COMPLETE!');
      console.log('=' .repeat(50));
      console.log(`⏱️  Total duration: ${duration}s`);
      console.log(`📁 Check ads_automation/output/ for results`);
      console.log('');
      console.log('📋 Next Steps:');
      console.log('   1. Run "npm run check-renders" to monitor video progress');
      console.log('   2. Download completed videos when ready');
      console.log('   3. Review and approve before using in campaigns');
      console.log('');
      console.log('🚀 Your 605b.ai ad campaign assets are generating!');
      
    } catch (error) {
      console.error('\n💥 PIPELINE FAILED');
      console.error('=' .repeat(50));
      console.error('Error:', error instanceof Error ? error.message : error);
      console.error('\n🔧 Check logs above and fix issues before retrying');
      process.exit(1);
    }
  }
}

// CLI execution
if (require.main === module) {
  const args = process.argv.slice(2);
  
  // Parse command line arguments
  const config: PipelineConfig = {
    scriptCount: 20,
    skipScripts: args.includes('--skip-scripts'),
    skipVoice: args.includes('--skip-voice'),
    skipRender: args.includes('--skip-render'),
    checkRenders: args.includes('--check-renders')
  };
  
  // Custom script count
  const countArg = args.find(arg => arg.startsWith('--count='));
  if (countArg) {
    config.scriptCount = parseInt(countArg.split('=')[1]) || 20;
  }
  
  // Show help
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
🎬 605b.ai Automated Ad Generation Pipeline

Usage:
  npm run generate-ads                    # Run full pipeline (20 scripts)
  npm run generate-ads -- --count=10     # Generate 10 scripts
  npm run generate-ads -- --skip-scripts # Skip script generation
  npm run generate-ads -- --skip-voice   # Skip voice generation  
  npm run generate-ads -- --skip-render  # Skip video rendering
  npm run check-renders                   # Check render status only

Options:
  --count=N         Number of scripts to generate (default: 20)
  --skip-scripts    Use existing scripts, skip generation
  --skip-voice      Use existing audio, skip voice generation
  --skip-render     Skip video rendering step
  --check-renders   Only check render status, don't generate
  --help, -h        Show this help message

Examples:
  # Generate 5 new ads from scratch
  npm run generate-ads -- --count=5
  
  # Only render videos (scripts & voice exist)
  npm run generate-ads -- --skip-scripts --skip-voice
  
  # Check if videos are ready
  npm run check-renders
`);
    process.exit(0);
  }
  
  const pipeline = new AdGenerationPipeline(config);
  pipeline.runFullPipeline();
}

export { AdGenerationPipeline };