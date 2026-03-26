#!/bin/bash

# Manual HeyGen Video Download Helper
# Usage: ./scripts/manual-heygen-download.sh [URL1] [URL2] [URL3] [URL4]

OUTPUT_DIR="public/ads/meta-launch"
FILENAMES=("605b_report_analysis_v2.mp4" "605b_business_ad_v2.mp4" "605b_error_detection_v2.mp4" "605b_process_control_v2.mp4")

# Create output directory
mkdir -p "$OUTPUT_DIR"

if [ $# -eq 0 ]; then
    echo "Manual HeyGen Video Download Helper"
    echo "====================================="
    echo ""
    echo "To use this script, you need to:"
    echo ""
    echo "1. Go to https://app.heygen.com in your browser"
    echo "2. Navigate to your videos/dashboard"
    echo "3. For each of these video IDs:"
    echo "   - acd3b717b02848a1afdf6bf1958221f5"
    echo "   - ee2cddd66b75499288c6968b18835c63"
    echo "   - 6a17fafbc2204f6b9ccc040207e74e44"
    echo "   - edc204de40ff49f1a4bff44680b937da"
    echo ""
    echo "4. Click on each video, find the download/share link"
    echo "5. Right-click the video and 'Copy video address' or use developer tools to find the MP4 URL"
    echo "6. Run this script with the URLs:"
    echo ""
    echo "   ./scripts/manual-heygen-download.sh URL1 URL2 URL3 URL4"
    echo ""
    echo "Expected filenames will be:"
    for i in "${!FILENAMES[@]}"; do
        echo "   Video $((i+1)): ${FILENAMES[$i]}"
    done
    echo ""
    echo "Files will be saved to: $OUTPUT_DIR/"
    exit 0
fi

echo "Downloading HeyGen videos to $OUTPUT_DIR/"

for i in "${!FILENAMES[@]}"; do
    if [ $# -gt $i ]; then
        URL="${!#[$((i+1))]}"  # Get the i-th argument
        URL=$(eval echo \$$(($i + 1)))
        FILENAME="${FILENAMES[$i]}"
        
        echo "Downloading video $((i+1)): $URL -> $FILENAME"
        
        # Download the video
        curl -L -o "$OUTPUT_DIR/$FILENAME" "$URL"
        
        # Check if download was successful
        if [ -f "$OUTPUT_DIR/$FILENAME" ]; then
            FILE_SIZE=$(stat -c%s "$OUTPUT_DIR/$FILENAME" 2>/dev/null || stat -f%z "$OUTPUT_DIR/$FILENAME")
            if [ "$FILE_SIZE" -gt 1024 ]; then
                echo "✅ Downloaded $FILENAME (${FILE_SIZE} bytes)"
            else
                echo "❌ Download failed or file too small: $FILENAME (${FILE_SIZE} bytes)"
            fi
        else
            echo "❌ Failed to download $FILENAME"
        fi
        echo "---"
    fi
done

echo "Download complete. Files in $OUTPUT_DIR/:"
ls -la "$OUTPUT_DIR"/*.mp4 2>/dev/null || echo "No MP4 files found"

# Verify downloads
echo ""
echo "Verification:"
for filename in "${FILENAMES[@]}"; do
    if [ -f "$OUTPUT_DIR/$filename" ]; then
        FILE_SIZE=$(stat -c%s "$OUTPUT_DIR/$filename" 2>/dev/null || stat -f%z "$OUTPUT_DIR/$filename")
        if [ "$FILE_SIZE" -gt 1048576 ]; then  # > 1MB
            echo "✅ $filename: ${FILE_SIZE} bytes (looks good)"
        else
            echo "⚠️  $filename: ${FILE_SIZE} bytes (may be too small)"
        fi
    else
        echo "❌ $filename: Missing"
    fi
done