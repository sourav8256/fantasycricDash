const axios = require('axios');
const readline = require('readline');

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Function to fetch trending videos
async function getTrendingVideos(apiKey, regionCode = 'US', maxResults = 10) {
  try {
    const response = await axios.get('https://www.googleapis.com/youtube/v3/videos', {
      params: {
        part: 'snippet,statistics',
        chart: 'mostPopular',
        regionCode: regionCode,
        maxResults: maxResults,
        key: apiKey
      }
    });

    return response.data.items;
  } catch (error) {
    console.error('Error fetching trending videos:', error.message);
    if (error.response) {
      console.error('API Error:', error.response.data);
    }
    return [];
  }
}

// Function to display trending videos
function displayTrendingVideos(videos) {
  if (videos.length === 0) {
    console.log('No trending videos found.');
    return;
  }

  console.log('\n=== TRENDING VIDEOS ===\n');
  
  videos.forEach((video, index) => {
    const { title, channelTitle, publishedAt } = video.snippet;
    const { viewCount, likeCount } = video.statistics;
    
    console.log(`${index + 1}. ${title}`);
    console.log(`   Channel: ${channelTitle}`);
    console.log(`   Views: ${viewCount.toLocaleString()}`);
    console.log(`   Likes: ${likeCount ? likeCount.toLocaleString() : 'N/A'}`);
    console.log(`   Published: ${new Date(publishedAt).toLocaleDateString()}`);
    console.log(`   URL: https://www.youtube.com/watch?v=${video.id}`);
    console.log('');
  });
}

// Main function
async function main() {
  console.log('YouTube Trending Videos Fetcher');
  console.log('==============================');
  
  rl.question('Enter your YouTube API key: ', async (apiKey) => {
    if (!apiKey) {
      console.log('API key is required. Please get one from the Google Cloud Console.');
      rl.close();
      return;
    }
    
    rl.question('Enter region code (e.g., US, GB, IN) [default: US]: ', async (regionCode) => {
      regionCode = regionCode || 'US';
      
      rl.question('Enter number of results to show [default: 10]: ', async (maxResults) => {
        maxResults = parseInt(maxResults) || 10;
        
        console.log(`\nFetching trending videos for region: ${regionCode}...`);
        const videos = await getTrendingVideos(apiKey, regionCode, maxResults);
        displayTrendingVideos(videos);
        
        rl.close();
      });
    });
  });
}

// Run the main function
main(); 