import OpenAI from 'openai';
import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.ads.env.local' });

interface AdScript {
  id: string;
  title: string;
  hook: string;
  problem: string;
  proof: string;
  product_demo: string;
  cta: string;
  total_duration: number;
  target_audience: string;
  angle: string;
}

interface ScriptCollection {
  generated_at: string;
  total_scripts: number;
  scripts: AdScript[];
}

class AdScriptGenerator {
  private openai: OpenAI;

  constructor() {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY not found in environment variables');
    }
    
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  private readonly SCRIPT_PROMPT = `
You are a Meta ads copywriter expert specializing in B2B SaaS products. Generate high-converting video ad scripts for 605b.ai.

PRODUCT: 605b.ai
- SaaS platform that analyzes credit reports 
- Identifies fraudulent, incorrect, or suspicious accounts
- Helps users create compliant dispute documentation
- Self-service software (not a service company)
- Targets people with credit report errors or identity theft

AUDIENCE: Adults 25-65 dealing with:
- Credit report errors
- Identity theft recovery  
- Suspicious accounts on credit
- Difficulty disputing items
- Lack of knowledge about credit rights

SCRIPT STRUCTURE (25 seconds total):
- HOOK (2 seconds): Attention-grabbing opening
- PROBLEM (5 seconds): Agitate pain point
- PROOF (5 seconds): Social proof or credibility
- PRODUCT_DEMO (8 seconds): How solution works
- CTA (5 seconds): Clear call-to-action

REQUIREMENTS:
- Hook must stop scrolling within 2 seconds
- Avoid "credit repair" (compliance risk)
- Use "credit dispute documentation" or "credit analysis"
- Include specific numbers/results when possible
- Professional, trustworthy tone (not salesy)
- Comply with FCRA regulations
- Focus on empowerment and transparency

Generate 1 script with the following JSON structure:
{
  "id": "unique_id",
  "title": "Brief descriptive title",
  "hook": "2-second hook text",
  "problem": "5-second problem statement",  
  "proof": "5-second social proof/credibility",
  "product_demo": "8-second product explanation",
  "cta": "5-second call-to-action",
  "total_duration": 25,
  "target_audience": "specific audience segment",
  "angle": "marketing angle/approach"
}

Make the script compelling, compliant, and conversion-focused.
`;

  async generateScript(scriptNumber: number): Promise<AdScript> {
    console.log(`Generating script ${scriptNumber}...`);
    
    try {
      const completion = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: this.SCRIPT_PROMPT
          },
          {
            role: "user", 
            content: `Generate a unique, high-converting video ad script for 605b.ai. Make it distinct from other credit-related ads with a compelling hook and clear value proposition.`
          }
        ],
        max_tokens: 800,
        temperature: 0.8,
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No content generated from OpenAI');
      }

      // Parse JSON response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in response');
      }

      const script: AdScript = JSON.parse(jsonMatch[0]);
      script.id = `script_${scriptNumber}_${Date.now()}`;
      
      return script;
    } catch (error) {
      console.error(`Error generating script ${scriptNumber}:`, error);
      throw error;
    }
  }

  async generateMultipleScripts(count: number = 20): Promise<ScriptCollection> {
    console.log(`\n🎬 Generating ${count} ad scripts for 605b.ai...`);
    
    const scripts: AdScript[] = [];
    const errors: number[] = [];

    for (let i = 1; i <= count; i++) {
      try {
        const script = await this.generateScript(i);
        scripts.push(script);
        console.log(`✅ Script ${i}: "${script.title}"`);
        
        // Add delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`❌ Failed to generate script ${i}`);
        errors.push(i);
      }
    }

    const collection: ScriptCollection = {
      generated_at: new Date().toISOString(),
      total_scripts: scripts.length,
      scripts: scripts
    };

    // Save to file
    const outputPath = path.join(process.cwd(), 'ads_automation', 'scripts', 'generated_scripts.json');
    await fs.writeFile(outputPath, JSON.stringify(collection, null, 2));
    
    console.log(`\n✅ Generated ${scripts.length} scripts successfully`);
    if (errors.length > 0) {
      console.log(`⚠️  Failed to generate ${errors.length} scripts: ${errors.join(', ')}`);
    }
    console.log(`📝 Scripts saved to: ${outputPath}`);

    return collection;
  }
}

// CLI execution
if (require.main === module) {
  const generator = new AdScriptGenerator();
  
  const count = parseInt(process.argv[2]) || 20;
  
  generator.generateMultipleScripts(count)
    .then((collection) => {
      console.log(`\n🎉 Script generation complete!`);
      console.log(`Total scripts: ${collection.total_scripts}`);
    })
    .catch((error) => {
      console.error('Script generation failed:', error);
      process.exit(1);
    });
}

export { AdScriptGenerator, AdScript, ScriptCollection };