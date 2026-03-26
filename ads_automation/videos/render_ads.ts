import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';
import { AdScript, ScriptCollection } from '../scripts/generate_ad_scripts.js';

// Load environment variables
dotenv.config({ path: '.ads.env.local' });

interface RenderRequest {
  script_id: string;
  template_id?: string;
  variables: {
    logo_image: string;
    demo_scan_video: string;
    demo_report_video: string;
    demo_results_video: string;
    voiceover_audio: string;
    hook_text: string;
    problem_text: string;
    proof_text: string;
    demo_text: string;
    cta_text: string;
  };
}

interface RenderResult {
  script_id: string;
  render_id: string;
  status: 'queued' | 'rendering' | 'completed' | 'failed';
  video_url?: string;
  error?: string;
  created_at: string;
}

class CreatomateVideoRenderer {
  private apiKey: string;
  private baseUrl = 'https://api.creatomate.com/v1';
  private templateId: string = ''; // Will be set after template upload

  constructor() {
    this.apiKey = process.env.CREATOMATE_API_KEY || '';
    if (!this.apiKey) {
      throw new Error('CREATOMATE_API_KEY not found in environment variables');
    }
  }

  private async uploadTemplate(): Promise<string> {
    console.log('📤 Uploading video template to Creatomate...');
    
    try {
      const templatePath = path.join(process.cwd(), 'ads_automation', 'templates', 'ad_template.json');
      const templateData = JSON.parse(await fs.readFile(templatePath, 'utf-8'));
      
      const response = await axios.post(
        `${this.baseUrl}/templates`,
        {
          name: '605b.ai Meta Ad Template',
          template: templateData.template
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );
      
      this.templateId = response.data.id;
      console.log(`✅ Template uploaded: ${this.templateId}`);
      return this.templateId;
    } catch (error) {
      console.error('Failed to upload template:', error);
      throw error;
    }
  }

  private async uploadAssets(): Promise<{ [key: string]: string }> {
    console.log('📤 Uploading assets to Creatomate...');
    
    const assetsDir = path.join(process.cwd(), 'ads_automation', 'assets');
    const assetUrls: { [key: string]: string } = {};
    
    const assetFiles = [
      'logo.png',
      'screen_scan.mp4',
      'screen_report.mp4', 
      'screen_results.mp4'
    ];
    
    for (const filename of assetFiles) {
      try {
        const filePath = path.join(assetsDir, filename);
        
        // Check if file exists
        await fs.access(filePath);
        
        const formData = new FormData();
        const fileBuffer = await fs.readFile(filePath);
        const blob = new Blob([fileBuffer]);
        formData.append('file', blob, filename);
        
        const response = await axios.post(
          `${this.baseUrl}/assets`,
          formData,
          {
            headers: {
              'Authorization': `Bearer ${this.apiKey}`,
            },
          }
        );
        
        assetUrls[filename] = response.data.url;
        console.log(`✅ Uploaded: ${filename}`);
      } catch (error) {
        console.warn(`⚠️  Asset not found: ${filename}, using placeholder`);
        assetUrls[filename] = `placeholder_${filename}`;
      }
    }
    
    return assetUrls;
  }

  private createRenderRequest(script: AdScript, voiceFile: string, assetUrls: { [key: string]: string }): RenderRequest {
    const voiceDir = path.join(process.cwd(), 'ads_automation', 'voice');
    const voiceUrl = path.join(voiceDir, voiceFile); // In production, this should be a URL
    
    return {
      script_id: script.id,
      template_id: this.templateId,
      variables: {
        logo_image: assetUrls['logo.png'] || '',
        demo_scan_video: assetUrls['screen_scan.mp4'] || '',
        demo_report_video: assetUrls['screen_report.mp4'] || '',
        demo_results_video: assetUrls['screen_results.mp4'] || '',
        voiceover_audio: voiceUrl,
        hook_text: script.hook,
        problem_text: script.problem,
        proof_text: script.proof,
        demo_text: script.product_demo,
        cta_text: script.cta
      }
    };
  }

  async renderVideo(renderRequest: RenderRequest): Promise<RenderResult> {
    console.log(`🎬 Rendering video for: ${renderRequest.script_id}`);
    
    try {
      const response = await axios.post(
        `${this.baseUrl}/renders`,
        {
          template_id: this.templateId,
          modifications: renderRequest.variables
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );
      
      const result: RenderResult = {
        script_id: renderRequest.script_id,
        render_id: response.data.id,
        status: response.data.status,
        created_at: new Date().toISOString()
      };
      
      console.log(`✅ Render queued: ${result.render_id}`);
      return result;
      
    } catch (error) {
      console.error(`❌ Render failed for ${renderRequest.script_id}:`, error);
      return {
        script_id: renderRequest.script_id,
        render_id: '',
        status: 'failed',
        error: error instanceof Error ? error.message : 'Render error',
        created_at: new Date().toISOString()
      };
    }
  }

  async checkRenderStatus(renderId: string): Promise<RenderResult> {
    try {
      const response = await axios.get(`${this.baseUrl}/renders/${renderId}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });
      
      return {
        script_id: response.data.metadata?.script_id || '',
        render_id: renderId,
        status: response.data.status,
        video_url: response.data.url,
        created_at: response.data.created
      };
    } catch (error) {
      throw new Error(`Failed to check render status: ${error}`);
    }
  }

  async renderAllAds(): Promise<RenderResult[]> {
    console.log('\n🎬 Starting Creatomate video rendering pipeline...');
    
    // Load scripts and voice results
    const scriptsPath = path.join(process.cwd(), 'ads_automation', 'scripts', 'generated_scripts.json');
    const voiceResultsPath = path.join(process.cwd(), 'ads_automation', 'voice', 'voice_generation_results.json');
    
    let scriptCollection: ScriptCollection;
    let voiceResults: any;
    
    try {
      scriptCollection = JSON.parse(await fs.readFile(scriptsPath, 'utf-8'));
      voiceResults = JSON.parse(await fs.readFile(voiceResultsPath, 'utf-8'));
    } catch (error) {
      throw new Error('Failed to load scripts or voice results. Run previous pipeline steps first.');
    }
    
    // Upload template and assets
    await this.uploadTemplate();
    const assetUrls = await this.uploadAssets();
    
    console.log(`📋 Processing ${scriptCollection.total_scripts} video renders...`);
    
    const results: RenderResult[] = [];
    
    // Create render requests for each script with successful voice generation
    for (const script of scriptCollection.scripts) {
      const voiceResult = voiceResults.results.find((r: any) => r.script_id === script.id);
      
      if (!voiceResult || !voiceResult.success) {
        console.warn(`⚠️  Skipping ${script.id} - no voice file available`);
        continue;
      }
      
      try {
        const renderRequest = this.createRenderRequest(script, voiceResult.audio_file, assetUrls);
        const result = await this.renderVideo(renderRequest);
        results.push(result);
        
        // Delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        console.error(`Error rendering ${script.id}:`, error);
      }
    }
    
    // Save render results
    const outputDir = path.join(process.cwd(), 'ads_automation', 'output');
    await fs.mkdir(outputDir, { recursive: true });
    
    const resultsPath = path.join(outputDir, 'render_results.json');
    await fs.writeFile(resultsPath, JSON.stringify({
      generated_at: new Date().toISOString(),
      template_id: this.templateId,
      total_renders: results.length,
      queued: results.filter(r => r.status === 'queued').length,
      failed: results.filter(r => r.status === 'failed').length,
      results: results
    }, null, 2));
    
    console.log(`\n✅ Video rendering pipeline complete!`);
    console.log(`🎬 Queued renders: ${results.filter(r => r.status === 'queued').length}`);
    console.log(`❌ Failed renders: ${results.filter(r => r.status === 'failed').length}`);
    console.log(`📊 Results saved to: ${resultsPath}`);
    console.log(`\n💡 Use 'npm run check-renders' to monitor render progress`);
    
    return results;
  }

  async checkAllRenders(): Promise<void> {
    console.log('\n🔍 Checking render status...');
    
    const resultsPath = path.join(process.cwd(), 'ads_automation', 'output', 'render_results.json');
    const renderData = JSON.parse(await fs.readFile(resultsPath, 'utf-8'));
    
    const updatedResults: RenderResult[] = [];
    
    for (const result of renderData.results) {
      if (result.status === 'queued' || result.status === 'rendering') {
        try {
          const updated = await this.checkRenderStatus(result.render_id);
          updatedResults.push(updated);
          
          if (updated.status === 'completed') {
            console.log(`✅ ${result.script_id}: ${updated.video_url}`);
          } else {
            console.log(`⏳ ${result.script_id}: ${updated.status}`);
          }
        } catch (error) {
          console.error(`Error checking ${result.render_id}:`, error);
          updatedResults.push(result);
        }
      } else {
        updatedResults.push(result);
      }
    }
    
    // Update results file
    renderData.results = updatedResults;
    renderData.last_checked = new Date().toISOString();
    renderData.completed = updatedResults.filter(r => r.status === 'completed').length;
    
    await fs.writeFile(resultsPath, JSON.stringify(renderData, null, 2));
    
    const completed = updatedResults.filter(r => r.status === 'completed').length;
    console.log(`\n📊 Render Status Summary:`);
    console.log(`✅ Completed: ${completed}`);
    console.log(`⏳ In Progress: ${updatedResults.filter(r => r.status === 'rendering').length}`);
    console.log(`🔄 Queued: ${updatedResults.filter(r => r.status === 'queued').length}`);
    console.log(`❌ Failed: ${updatedResults.filter(r => r.status === 'failed').length}`);
  }
}

// CLI execution
if (require.main === module) {
  const renderer = new CreatomateVideoRenderer();
  
  const command = process.argv[2] || 'render';
  
  if (command === 'check') {
    renderer.checkAllRenders()
      .then(() => console.log('✅ Render status check complete'))
      .catch((error) => {
        console.error('Render check failed:', error);
        process.exit(1);
      });
  } else {
    renderer.renderAllAds()
      .then((results) => {
        console.log(`\n🎉 Render pipeline complete!`);
        console.log(`Total renders queued: ${results.length}`);
      })
      .catch((error) => {
        console.error('Render pipeline failed:', error);
        process.exit(1);
      });
  }
}

export { CreatomateVideoRenderer, RenderResult };