# YouTube Trending Videos Fetcher

A simple Node.js script to fetch and display trending videos from YouTube.

## Prerequisites

- Node.js installed on your system
- A YouTube Data API key

## How to Get a YouTube API Key

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the YouTube Data API v3 for your project
4. Create credentials (API key) for the YouTube Data API
5. Copy your API key

## Installation

1. Navigate to the youtubedownloader directory
2. Install dependencies:

```bash
npm install
```

## Usage

Run the script:

```bash
npm start
```

The script will prompt you for:
- Your YouTube API key
- Region code (e.g., US, GB, IN) - defaults to US
- Number of results to show - defaults to 10

## Example Output

```
=== TRENDING VIDEOS ===

1. Video Title
   Channel: Channel Name
   Views: 1,234,567
   Likes: 123,456
   Published: 1/1/2023
   URL: https://www.youtube.com/watch?v=VIDEO_ID

2. Another Video Title
   ...
```

## Customization

You can modify the `youtubeTrending.js` file to change how the data is displayed or to fetch additional information about the videos. 