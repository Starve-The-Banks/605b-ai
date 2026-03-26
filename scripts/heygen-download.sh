#!/bin/bash

# HeyGen Video Download Script
# Usage: ./scripts/heygen-download.sh [API_KEY]

API_KEY="${1:-$HEYGEN_API_KEY}"
OUTPUT_DIR="public/ads/meta-launch"

if [ -z "$API_KEY" ]; then
    echo "Error: HeyGen API key required"
    echo "Usage: $0 [API_KEY]"
    echo "Or set HEYGEN_API_KEY environment variable"
    exit 1
fi

# Video IDs and filenames (using arrays instead of associative arrays for compatibility)
VIDEO_IDS=("acd3b717b02848a1afdf6bf1958221f5" "ee2cddd66b75499288c6968b18835c63" "6a17fafbc2204f6b9ccc040207e74e44" "edc204de40ff49f1a4bff44680b937da")
FILENAMES=("605b_report_analysis_v2.mp4" "605b_business_ad_v2.mp4" "605b_error_detection_v2.mp4" "605b_process_control_v2.mp4")

# Create output directory
mkdir -p "$OUTPUT_DIR"

echo "Downloading HeyGen videos to $OUTPUT_DIR/"

for i in "${!VIDEO_IDS[@]}"; do
    VIDEO_ID="${VIDEO_IDS[$i]}"
    FILENAME="${FILENAMES[$i]}"
    echo "Processing video $VIDEO_ID -> $FILENAME"
    
    # Try different HeyGen API endpoints
    for ENDPOINT in "https://api.heygen.com/v1/video" "https://api.heygen.com/v2/video" "https://api.heygen.com/v1/video_status" "https://api.heygen.com/v1/videos"; do
        echo "Trying endpoint: $ENDPOINT/$VIDEO_ID"
        RESPONSE=$(curl -s -H "X-API-KEY: $API_KEY" -H "Content-Type: application/json" "$ENDPOINT/$VIDEO_ID")
        
        if echo "$RESPONSE" | grep -q "video_url\|download_url\|url"; then
            echo "✅ Found response at $ENDPOINT"
            break
        fi
    done
    
    echo "API Response: $RESPONSE"
    
    # Extract video URL (try multiple possible field names)
    VIDEO_URL=$(echo "$RESPONSE" | jq -r '.data.video_url // .video_url // .data.download_url // .download_url // .data.url // .url // empty' 2>/dev/null)
    
    if [ -n "$VIDEO_URL" ] && [ "$VIDEO_URL" != "null" ]; then
        echo "Found URL for $VIDEO_ID: $VIDEO_URL"
        
        # Download the video
        curl -L -o "$OUTPUT_DIR/$FILENAME" "$VIDEO_URL"
        
        # Check if download was successful
        if [ -f "$OUTPUT_DIR/$FILENAME" ]; then
            FILE_SIZE=$(stat -c%s "$OUTPUT_DIR/$FILENAME" 2>/dev/null || stat -f%z "$OUTPUT_DIR/$FILENAME")
            echo "✅ Downloaded $FILENAME (${FILE_SIZE} bytes)"
        else
            echo "❌ Failed to download $FILENAME"
        fi
    else
        echo "❌ No video URL found for $VIDEO_ID"
    fi
    
    echo "---"
done

echo "Download complete. Files saved to $OUTPUT_DIR/"
ls -la "$OUTPUT_DIR"/*.mp4 2>/dev/null || echo "No MP4 files found"