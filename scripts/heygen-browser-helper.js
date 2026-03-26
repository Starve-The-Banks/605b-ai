// HeyGen Browser Helper - Run this in your browser console on app.heygen.com
// This script will help you find video download URLs

const VIDEO_IDS = [
  'acd3b717b02848a1afdf6bf1958221f5',
  'ee2cddd66b75499288c6968b18835c63', 
  '6a17fafbc2204f6b9ccc040207e74e44',
  'edc204de40ff49f1a4bff44680b937da'
];

const FILENAMES = [
  '605b_report_analysis_v2.mp4',
  '605b_business_ad_v2.mp4',
  '605b_error_detection_v2.mp4', 
  '605b_process_control_v2.mp4'
];

console.log('HeyGen Video URL Helper');
console.log('======================');
console.log('');
console.log('Video IDs to find:');
VIDEO_IDS.forEach((id, i) => {
  console.log(`${i+1}. ${id} -> ${FILENAMES[i]}`);
});
console.log('');

// Function to search for video elements
function findVideoElements() {
  console.log('Searching for video elements on page...');
  
  // Find all video elements
  const videos = document.querySelectorAll('video');
  console.log(`Found ${videos.length} video element(s)`);
  
  videos.forEach((video, i) => {
    if (video.src) {
      console.log(`Video ${i+1}: ${video.src}`);
    }
    if (video.currentSrc) {
      console.log(`Video ${i+1} current src: ${video.currentSrc}`);
    }
  });
  
  // Find download links
  const downloadLinks = document.querySelectorAll('a[href*=".mp4"], a[href*="download"], button:contains("download"), [class*="download"]');
  console.log(`Found ${downloadLinks.length} potential download link(s)`);
  
  downloadLinks.forEach((link, i) => {
    if (link.href) {
      console.log(`Download link ${i+1}: ${link.href}`);
    }
  });
  
  return { videos, downloadLinks };
}

// Function to extract URLs from network requests
function monitorNetworkRequests() {
  console.log('Monitoring network requests for video URLs...');
  console.log('Navigate to your videos and click on each one.');
  console.log('Video URLs will be logged here.');
  
  // Override fetch to capture video URLs
  const originalFetch = window.fetch;
  window.fetch = function(...args) {
    const url = args[0];
    if (typeof url === 'string' && (url.includes('.mp4') || url.includes('video') || url.includes('heygen'))) {
      console.log('🎥 Video-related request:', url);
    }
    return originalFetch.apply(this, args);
  };
  
  // Override XMLHttpRequest
  const originalOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function(method, url) {
    if (url.includes('.mp4') || url.includes('video') || url.includes('heygen')) {
      console.log('🎥 Video-related XHR:', url);
    }
    return originalOpen.apply(this, arguments);
  };
}

// Search current page
findVideoElements();

// Start monitoring
monitorNetworkRequests();

console.log('');
console.log('Instructions:');
console.log('1. Navigate to each video in your HeyGen dashboard');
console.log('2. Look for download buttons or right-click videos to get URLs');
console.log('3. Copy the MP4 URLs that appear in this console');
console.log('4. Run: ./scripts/manual-heygen-download.sh URL1 URL2 URL3 URL4');
console.log('');

// Function to help copy all found URLs
window.copyVideoURLs = function() {
  const videos = document.querySelectorAll('video');
  const urls = Array.from(videos).map(v => v.src || v.currentSrc).filter(Boolean);
  
  if (urls.length > 0) {
    const command = `./scripts/manual-heygen-download.sh ${urls.join(' ')}`;
    navigator.clipboard.writeText(command);
    console.log('✅ Command copied to clipboard:', command);
    return command;
  } else {
    console.log('❌ No video URLs found');
    return null;
  }
};

console.log('💡 Tip: Run copyVideoURLs() to copy download command to clipboard');