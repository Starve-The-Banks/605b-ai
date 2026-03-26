import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';
import { AdScript, ScriptCollection } from '../scripts/generate_ad_scripts.js';

// Load environment variables
dotenv.config({ path: '.ads.env.local' });

interface VoiceGenerationResult {
  script_id: string;
  audio_file: string;
  duration_estimate: number;
  success: boolean;
  error?: string;
}

class ElevenLabsVoiceGenerator {
  private apiKey: string;
  private baseUrl = 'https://api.elevenlabs.io/v1';
  
  // Professional, trustworthy voice ID (replace with actual ElevenLabs voice ID)
  private voiceId = '21m00Tcm4TlvDq8ikWAM'; // Default voice, update with preferred voice

  constructor() {
    this.apiKey = process.env.ELEVENLABS_API_KEY || '';
    if (!this.apiKey) {
      throw new Error('ELEVENLABS_API_KEY not found in environment variables');
    }
  }

  private combineScriptText(script: AdScript): string {
    // Combine all script parts with natural pauses
    return [
      script.hook,
      script.problem,
      script.proof,
      script.product_demo,
      script.cta
    ].join(' ... '); // ElevenLabs interprets "..." as natural pause
  }

  async generateVoiceover(script: AdScript): Promise<VoiceGenerationResult> {
    console.log(`🎤 Generating voiceover for: ${script.title}`);
    
    try {
      const text = this.combineScriptText(script);
      
      const response = await axios.post(
        `${this.baseUrl}/text-to-speech/${this.voiceId}`,
        {
          text: text,
          model_id: 'eleven_monolingual_v1',
          voice_settings: {
            stability: 0.7,        // More stable, less variation
            similarity_boost: 0.8, // Stay close to original voice
            style: 0.2,           // Less dramatic styling
            use_speaker_boost: true
          }
        },
        {
          headers: {
            'Accept': 'audio/mpeg',
            'Content-Type': 'application/json',
            'xi-api-key': this.apiKey,
          },
          responseType: 'arraybuffer'
        }
      );

      // Save audio file
      const audioFileName = `${script.id}.mp3`;
      const audioFilePath = path.join(process.cwd(), 'ads_automation', 'voice', audioFileName);
      
      await fs.writeFile(audioFilePath, response.data);
      
      console.log(`✅ Generated: ${audioFileName}`);
      
      return {
        script_id: script.id,
        audio_file: audioFileName,
        duration_estimate: script.total_duration,
        success: true
      };
      
    } catch (error) {
      console.error(`❌ Failed to generate voice for ${script.id}:`, error);
      
      return {
        script_id: script.id,
        audio_file: '',
        duration_estimate: 0,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async generateAllVoiceovers(scriptsFile?: string): Promise<VoiceGenerationResult[]> {
    console.log('\n🎙️  Starting ElevenLabs voice generation...');
    
    // Load scripts
    const scriptsPath = scriptsFile || path.join(process.cwd(), 'ads_automation', 'scripts', 'generated_scripts.json');
    
    let scriptCollection: ScriptCollection;
    try {
      const scriptsData = await fs.readFile(scriptsPath, 'utf-8');
      scriptCollection = JSON.parse(scriptsData);
    } catch (error) {
      throw new Error(`Failed to load scripts from ${scriptsPath}. Run script generation first.`);
    }

    console.log(`📋 Found ${scriptCollection.total_scripts} scripts to process`);
    
    // Create voice output directory if it doesn't exist
    const voiceDir = path.join(process.cwd(), 'ads_automation', 'voice');
    await fs.mkdir(voiceDir, { recursive: true });
    
    const results: VoiceGenerationResult[] = [];
    
    for (const script of scriptCollection.scripts) {
      try {
        const result = await this.generateVoiceover(script);
        results.push(result);
        
        // Delay to respect API rate limits
        await new Promise(resolve => setTimeout(resolve, 1500));
      } catch (error) {
        console.error(`Error processing script ${script.id}:`, error);
        results.push({
          script_id: script.id,
          audio_file: '',
          duration_estimate: 0,
          success: false,
          error: error instanceof Error ? error.message : 'Processing error'
        });
      }
    }
    
    // Save results summary
    const resultsPath = path.join(voiceDir, 'voice_generation_results.json');
    await fs.writeFile(resultsPath, JSON.stringify({
      generated_at: new Date().toISOString(),
      total_processed: results.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results: results
    }, null, 2));
    
    const successful = results.filter(r => r.success).length;
    console.log(`\n✅ Voice generation complete!`);
    console.log(`🎤 Successfully generated: ${successful}/${results.length} voiceovers`);
    console.log(`📁 Audio files saved to: ${voiceDir}`);
    console.log(`📊 Results summary: ${resultsPath}`);
    
    return results;
  }

  // Utility method to list available voices
  async listAvailableVoices(): Promise<void> {
    try {
      const response = await axios.get(`${this.baseUrl}/voices`, {
        headers: {
          'xi-api-key': this.apiKey,
        },
      });
      
      console.log('Available ElevenLabs voices:');
      response.data.voices.forEach((voice: any) => {
        console.log(`- ${voice.name} (${voice.voice_id}) - ${voice.category}`);
      });
    } catch (error) {
      console.error('Error fetching voices:', error);
    }
  }
}

// CLI execution
if (require.main === module) {
  const generator = new ElevenLabsVoiceGenerator();
  
  const command = process.argv[2];
  
  if (command === 'list-voices') {
    generator.listAvailableVoices();
  } else {
    const scriptsFile = process.argv[2]; // Optional custom scripts file
    
    generator.generateAllVoiceovers(scriptsFile)
      .then((results) => {
        const successful = results.filter(r => r.success).length;
        console.log(`\n🎉 Voice generation pipeline complete!`);
        console.log(`Success rate: ${successful}/${results.length}`);
      })
      .catch((error) => {
        console.error('Voice generation failed:', error);
        process.exit(1);
      });
  }
}

export { ElevenLabsVoiceGenerator, VoiceGenerationResult };