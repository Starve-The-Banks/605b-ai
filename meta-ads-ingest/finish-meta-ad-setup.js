const axios = require('axios');
require('dotenv').config();

const API_VERSION = 'v19.0';
const BASE_URL = `https://graph.facebook.com/${API_VERSION}`;
const ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;
const AD_ACCOUNT_ID = process.env.META_AD_ACCOUNT_ID;

// Known IDs from previous steps
const CAMPAIGN_ID = '6906439117737';
const ADSET_ID = '6906439770337';
const PAGE_ID = '933996326470724'; // Resolved via Business Manager API
const IMAGE_HASH = 'd4b76d0230c5a4664f19c420eaa44cbf'; // Resolved via Ad Images API

async function main() {
  try {
    console.log(JSON.stringify({ step: "Creating Ad Creative", page_id: PAGE_ID, image_hash: IMAGE_HASH }));
    
    const creativePayload = {
      name: "605b Standard Creative",
      object_story_spec: {
        page_id: PAGE_ID,
        link_data: {
          image_hash: IMAGE_HASH,
          link: "https://605b.ai",
          message: "Understand what appears on your credit report.",
          name: "Understand Your Credit Report",
          call_to_action: {
            type: "LEARN_MORE",
            value: {
              link: "https://605b.ai"
            }
          }
        }
      },
      degrees_of_freedom_spec: {
        creative_features_spec: {
          standard_enhancements: {
            enroll_status: "OPT_OUT"
          }
        }
      }
    };

    const creativeRes = await axios.post(
      `${BASE_URL}/${AD_ACCOUNT_ID}/adcreatives`,
      creativePayload,
      { params: { access_token: ACCESS_TOKEN } }
    );
    
    const creativeId = creativeRes.data.id;
    console.log(JSON.stringify({ step: "Creative Created", creative_id: creativeId }));

    console.log(JSON.stringify({ step: "Creating Ad", adset_id: ADSET_ID, creative_id: creativeId }));
    
    const adPayload = {
      name: "605b Standard Ad",
      adset_id: ADSET_ID,
      creative: { creative_id: creativeId },
      status: "PAUSED"
    };

    const adRes = await axios.post(
      `${BASE_URL}/${AD_ACCOUNT_ID}/ads`,
      adPayload,
      { params: { access_token: ACCESS_TOKEN } }
    );
    
    const adId = adRes.data.id;
    console.log(JSON.stringify({ step: "Ad Created", ad_id: adId }));
    
  } catch (error) {
    console.error(JSON.stringify({ 
      error: "Failed", 
      message: error.response?.data?.error?.message || error.message,
      details: error.response?.data?.error
    }, null, 2));
    process.exit(1);
  }
}

main();