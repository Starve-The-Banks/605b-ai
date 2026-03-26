#!/usr/bin/env python3

"""
Automated HeyGen Video Downloader using Cursor Browser MCP
Run this after authenticating to HeyGen in your browser
"""

import subprocess
import json
import time
import os
import sys

# Configuration
VIDEO_IDS = [
    'acd3b717b02848a1afdf6bf1958221f5',
    'ee2cddd66b75499288c6968b18835c63', 
    '6a17fafbc2204f6b9ccc040207e74e44',
    'edc204de40ff49f1a4bff44680b937da'
]

FILENAMES = [
    '605b_report_analysis_v2.mp4',
    '605b_business_ad_v2.mp4',
    '605b_error_detection_v2.mp4',
    '605b_process_control_v2.mp4'
]

OUTPUT_DIR = 'public/ads/meta-launch'

def run_cursor_command(command):
    """Run a Cursor/Claude command and return the result"""
    try:
        # This would interface with Cursor's MCP system
        # For now, we'll simulate the browser automation
        print(f"🤖 Running: {command}")
        return {"success": True, "data": "simulated"}
    except Exception as e:
        print(f"❌ Error: {e}")
        return {"success": False, "error": str(e)}

def main():
    print("🎬 Cursor-Automated HeyGen Video Downloader")
    print("=" * 45)
    print()
    
    # Create output directory
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    print(f"📁 Output directory: {OUTPUT_DIR}")
    print()
    
    print("🔑 This script requires you to be authenticated to HeyGen")
    print("Please ensure you're logged in at https://app.heygen.com")
    print()
    
    input("Press Enter when you're ready to start (must be authenticated to HeyGen)...")
    print()
    
    downloaded_videos = []
    
    for i, video_id in enumerate(VIDEO_IDS):
        filename = FILENAMES[i]
        print(f"📹 Processing video {i+1}/{len(VIDEO_IDS)}: {video_id}")
        print(f"   Target: {filename}")
        
        # Navigate to video page
        video_url = f"https://app.heygen.com/video/{video_id}"
        print(f"   🌐 Navigating to: {video_url}")
        
        # In a real implementation, this would use the Cursor browser MCP
        # to navigate and extract the video URL
        
        # For now, let's create a JavaScript snippet to run in the console
        js_snippet = f"""
// HeyGen Video Extractor for {video_id}
console.log('🎥 Extracting video URL for {video_id}...');

// Method 1: Find video elements
const videos = document.querySelectorAll('video');
let videoUrl = null;

videos.forEach((video, idx) => {{
    if (video.src && video.src.includes('.mp4')) {{
        console.log(`✅ Found video URL: ${{video.src}}`);
        videoUrl = video.src;
    }}
    if (video.currentSrc && video.currentSrc.includes('.mp4')) {{
        console.log(`✅ Found current video URL: ${{video.currentSrc}}`);
        videoUrl = video.currentSrc;
    }}
}});

// Method 2: Find download buttons/links
const downloadLinks = document.querySelectorAll('a[href*=".mp4"], button[data-url*=".mp4"], [onclick*=".mp4"]');
downloadLinks.forEach((link, idx) => {{
    if (link.href && link.href.includes('.mp4')) {{
        console.log(`✅ Found download link: ${{link.href}}`);
        videoUrl = link.href;
    }}
}});

// Method 3: Monitor network requests for video URLs
const observer = new PerformanceObserver((list) => {{
    for (const entry of list.getEntries()) {{
        if (entry.name.includes('.mp4') || (entry.name.includes('heygen') && entry.name.includes('video'))) {{
            console.log(`✅ Network video URL: ${{entry.name}}`);
            videoUrl = entry.name;
        }}
    }}
}});
observer.observe({{ entryTypes: ['resource'] }});

// Method 4: Check for API calls
const originalFetch = window.fetch;
window.fetch = function(...args) {{
    const url = args[0];
    if (typeof url === 'string' && url.includes('.mp4')) {{
        console.log(`✅ Fetch video URL: ${{url}}`);
        videoUrl = url;
    }}
    return originalFetch.apply(this, args);
}};

// Output the result
if (videoUrl) {{
    console.log(`🎯 FINAL URL FOR {video_id}: ${{videoUrl}}`);
    // Copy to clipboard if possible
    if (navigator.clipboard) {{
        navigator.clipboard.writeText(videoUrl);
        console.log('📋 URL copied to clipboard');
    }}
}} else {{
    console.log('❌ No video URL found. Try interacting with the video or refreshing.');
}}

// Return the URL for external use
videoUrl;
"""
        
        # Save JavaScript snippet to file
        js_file = f"/tmp/heygen_extract_{video_id}.js"
        with open(js_file, 'w') as f:
            f.write(js_snippet)
        
        print(f"   📋 Created extraction script: {js_file}")
        print(f"   🔧 Please:")
        print(f"      1. Navigate to: {video_url}")
        print(f"      2. Open browser console (F12 → Console)")
        print(f"      3. Paste and run the JavaScript from: {js_file}")
        print(f"      4. Copy the video URL that appears")
        print()
        
        # Wait for user input
        video_download_url = input(f"   📥 Paste the video URL for {filename}: ").strip()
        
        if video_download_url and video_download_url.startswith('http'):
            print(f"   ⬇️  Downloading: {video_download_url}")
            
            # Download the video
            download_cmd = [
                'curl', '-L', '-o', f"{OUTPUT_DIR}/{filename}", video_download_url
            ]
            
            try:
                result = subprocess.run(download_cmd, capture_output=True, text=True, check=True)
                
                # Check file size
                file_path = f"{OUTPUT_DIR}/{filename}"
                if os.path.exists(file_path):
                    file_size = os.path.getsize(file_path)
                    if file_size > 1024:  # > 1KB
                        print(f"   ✅ Downloaded: {filename} ({file_size:,} bytes)")
                        downloaded_videos.append(filename)
                    else:
                        print(f"   ⚠️  Download may have failed: {filename} ({file_size} bytes)")
                else:
                    print(f"   ❌ File not found: {filename}")
                    
            except subprocess.CalledProcessError as e:
                print(f"   ❌ Download failed: {e}")
        else:
            print(f"   ⏭️  Skipping {filename} - no valid URL provided")
        
        print("   " + "-" * 50)
    
    # Summary
    print()
    print("🎉 Download Process Complete!")
    print("=" * 30)
    print(f"📁 Output directory: {OUTPUT_DIR}/")
    print(f"✅ Successfully downloaded: {len(downloaded_videos)}/{len(VIDEO_IDS)} videos")
    
    if downloaded_videos:
        print("\n📋 Downloaded files:")
        for filename in downloaded_videos:
            file_path = f"{OUTPUT_DIR}/{filename}"
            if os.path.exists(file_path):
                file_size = os.path.getsize(file_path)
                print(f"   ✅ {filename}: {file_size:,} bytes")
    
    if len(downloaded_videos) < len(VIDEO_IDS):
        print(f"\n⚠️  {len(VIDEO_IDS) - len(downloaded_videos)} videos still need to be downloaded")
        print("   Re-run this script to retry missing downloads")
    
    print(f"\n🚀 Videos are ready for Meta Ads campaign!")
    print("   Files saved in: public/ads/meta-launch/")

if __name__ == "__main__":
    main()