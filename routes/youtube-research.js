const express = require('express');
const router = express.Router();
const axios = require('axios');

// Helper function to parse ISO 8601 duration to minutes
function parseDuration(durationStr) {
    if (!durationStr) return 0;

    const match = durationStr.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return 0;

    const hours = parseInt(match[1] || 0);
    const minutes = parseInt(match[2] || 0);
    const seconds = parseInt(match[3] || 0);

    return Math.round((hours * 60 + minutes + seconds / 60) * 100) / 100;
}

// Helper function to get channel ID from various input formats
async function getChannelId(identifier, apiKey) {
    identifier = identifier.trim();

    // If already a channel ID (starts with UC and 24 chars)
    if (identifier.startsWith('UC') && identifier.length === 24) {
        return identifier;
    }

    // Extract handle from URL patterns
    const patterns = [
        /(?:youtube\.com|youtu\.be)\/(?:channel|c)\/([a-zA-Z0-9_-]+)/,
        /(?:youtube\.com|youtu\.be)\/@([a-zA-Z0-9_.-]+)/
    ];

    let handle = null;
    for (const pattern of patterns) {
        const match = identifier.match(pattern);
        if (match) {
            handle = match[1];
            break;
        }
    }

    if (!handle) {
        handle = identifier;
    }

    // Search for channel by handle
    try {
        const response = await axios.get('https://www.googleapis.com/youtube/v3/search', {
            params: {
                part: 'id',
                q: handle,
                type: 'channel',
                key: apiKey
            }
        });

        if (response.data.items && response.data.items.length > 0) {
            return response.data.items[0].id.channelId;
        }
    } catch (error) {
        console.error('Error searching for channel:', error.message);
    }

    return null;
}

// Helper function to get stats for last 30 days
async function getStatsForLast30Days(channelId, apiKey) {
    const allVideoIds = [];
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    let nextPageToken = null;

    try {
        do {
            const params = {
                part: 'id',
                channelId: channelId,
                publishedAfter: thirtyDaysAgo,
                type: 'video',
                maxResults: 50,
                key: apiKey
            };

            if (nextPageToken) {
                params.pageToken = nextPageToken;
            }

            const response = await axios.get('https://www.googleapis.com/youtube/v3/search', { params });
            const items = response.data.items || [];

            allVideoIds.push(...items.map(item => item.id.videoId));
            nextPageToken = response.data.nextPageToken;
        } while (nextPageToken);

        // Get view counts for all videos
        let totalViews = 0;
        for (let i = 0; i < allVideoIds.length; i += 50) {
            const batchIds = allVideoIds.slice(i, i + 50);
            const response = await axios.get('https://www.googleapis.com/youtube/v3/videos', {
                params: {
                    part: 'statistics',
                    id: batchIds.join(','),
                    key: apiKey
                }
            });

            const items = response.data.items || [];
            for (const item of items) {
                totalViews += parseInt(item.statistics.viewCount || 0);
            }
        }

        return { videoCount: allVideoIds.length, totalViews };
    } catch (error) {
        console.error('Error getting 30-day stats:', error.message);
        return { videoCount: 0, totalViews: 0 };
    }
}

// Helper function to get basic channel info (for filtering)
async function getBasicChannelInfo(channelId, apiKey) {
    try {
        const response = await axios.get('https://www.googleapis.com/youtube/v3/channels', {
            params: {
                part: 'snippet,statistics',
                id: channelId,
                key: apiKey
            }
        });

        if (!response.data.items || response.data.items.length === 0) {
            return null;
        }

        const channel = response.data.items[0];
        const snippet = channel.snippet;
        const stats = channel.statistics;

        const creationDate = new Date(snippet.publishedAt);
        const channelAgeMonths = Math.round((Date.now() - creationDate.getTime()) / (30.44 * 24 * 60 * 60 * 1000));

        return {
            'Channel Name': snippet.title,
            'Channel Link': `https://www.youtube.com/channel/${channelId}`,
            'Channel Tags': snippet.customUrl || 'Không có',
            'Channel Description': snippet.description || '',
            'Subscribers': parseInt(stats.subscriberCount || 0),
            'Total Views': parseInt(stats.viewCount || 0),
            'Total Videos': parseInt(stats.videoCount || 0),
            'Country': snippet.country || 'Không rõ',
            'Channel Creation Date': creationDate.toISOString().split('T')[0],
            'Channel Age (Months)': channelAgeMonths
        };
    } catch (error) {
        console.error('Error getting basic channel info:', error.message);
        return null;
    }
}

// Helper function to search channels by keyword
async function searchChannelsByKeyword(keyword, apiKey, maxResults = 100, minSubscribers = 1000, minVideos = 10, country = 'US', language = '') {
    const allChannels = [];
    const seenChannelIds = new Set();
    let nextPageToken = null;
    let totalFetched = 0;

    try {
        while (totalFetched < maxResults) {
            const params = {
                part: 'snippet',
                type: 'channel',
                q: keyword,
                maxResults: 50,
                key: apiKey
            };

            if (nextPageToken) {
                params.pageToken = nextPageToken;
            }

            if (country && country !== 'ALL') {
                params.regionCode = country;
            }

            if (language) {
                params.relevanceLanguage = language;
            }

            const response = await axios.get('https://www.googleapis.com/youtube/v3/search', { params });
            const items = response.data.items || [];

            if (items.length === 0) break;

            for (const item of items) {
                if (totalFetched >= maxResults) break;

                const channelId = item.id.channelId;
                if (seenChannelIds.has(channelId)) continue;

                const channelInfo = await getBasicChannelInfo(channelId, apiKey);

                // Filter channels based on criteria
                if (channelInfo &&
                    channelInfo['Subscribers'] >= minSubscribers &&
                    channelInfo['Total Videos'] >= minVideos) {

                    // Check country filter
                    const countryMatch = country === 'ALL' || channelInfo['Country'] === country;

                    if (countryMatch) {
                        allChannels.push(channelInfo);
                        seenChannelIds.add(channelId);
                        totalFetched++;
                    }
                }

                // Small delay to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 100));
            }

            nextPageToken = response.data.nextPageToken;
            if (!nextPageToken) break;
        }
    } catch (error) {
        console.error('Error searching channels:', error.message);
    }

    return allChannels;
}

// Helper function to get full channel and video data
async function getChannelAndVideoData(channelId, apiKey) {
    try {
        // 1. Get channel data
        const channelResponse = await axios.get('https://www.googleapis.com/youtube/v3/channels', {
            params: {
                part: 'snippet,statistics',
                id: channelId,
                key: apiKey
            }
        });

        if (!channelResponse.data.items || channelResponse.data.items.length === 0) {
            return { channelInfo: null, videos: [] };
        }

        const channel = channelResponse.data.items[0];
        const snippet = channel.snippet;
        const stats = channel.statistics;

        // 2. Get 30-day stats
        const { videoCount: uploads30Days, totalViews: views30Days } = await getStatsForLast30Days(channelId, apiKey);

        // 3. Prepare channel info
        const subscribers = parseInt(stats.subscriberCount || 0);
        const totalVideos = parseInt(stats.videoCount || 0);
        const totalViews = parseInt(stats.viewCount || 0);
        const creationDate = new Date(snippet.publishedAt);
        const channelAgeMonths = Math.round((Date.now() - creationDate.getTime()) / (30.44 * 24 * 60 * 60 * 1000));

        const channelInfo = {
            'Channel Name': snippet.title,
            'Channel Link': `https://www.youtube.com/channel/${channelId}`,
            'Channel Tags': snippet.customUrl || 'Không có',
            'Channel Description': snippet.description || '',
            'Subscribers': subscribers,
            'Total Views': totalViews,
            'Total Videos': totalVideos,
            'Video uploads in last 30 days': uploads30Days,
            'Total Views in Last 30 Days': views30Days,
            'Views Per Sub': subscribers > 0 ? Math.round((totalViews / subscribers) * 100) / 100 : 0,
            'Country': snippet.country || 'Không rõ',
            'Channel Creation Date': creationDate.toISOString().split('T')[0],
            'Channel Age (Months)': channelAgeMonths
        };

        // 4. Get top 15 videos from last 90 days
        const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
        const searchResponse = await axios.get('https://www.googleapis.com/youtube/v3/search', {
            params: {
                part: 'snippet',
                channelId: channelId,
                order: 'viewCount',
                type: 'video',
                publishedAfter: ninetyDaysAgo,
                maxResults: 15,
                key: apiKey
            }
        });

        const searchItems = searchResponse.data.items || [];
        if (searchItems.length === 0) {
            return { channelInfo, videos: [] };
        }

        const videoIds = searchItems.map(item => item.id.videoId);
        const videosResponse = await axios.get('https://www.googleapis.com/youtube/v3/videos', {
            params: {
                part: 'snippet,statistics,contentDetails',
                id: videoIds.join(','),
                key: apiKey
            }
        });

        const videoDetails = videosResponse.data.items || [];

        // 5. Process video data
        const videos = videoDetails.map((video, index) => {
            const vidSnippet = video.snippet;
            const vidStats = video.statistics;
            const vidContent = video.contentDetails;

            const publishedAt = new Date(vidSnippet.publishedAt);
            const hoursSincePublished = (Date.now() - publishedAt.getTime()) / (1000 * 60 * 60);
            const views = parseInt(vidStats.viewCount || 0);
            const videoAgeInDays = Math.floor((Date.now() - publishedAt.getTime()) / (1000 * 60 * 60 * 24));

            return {
                'Channel Name': channelInfo['Channel Name'],
                'Tổng Sub Kênh': subscribers,
                'Tổng Video Kênh': totalVideos,
                'View 30 Ngày Của Kênh': views30Days,
                'Phân loại top video': `Top ${index + 1}`,
                'Title': vidSnippet.title,
                'View': views,
                'View Per Hour': hoursSincePublished > 0 ? Math.round((views / hoursSincePublished) * 100) / 100 : 0,
                'Published date of video': publishedAt.toISOString().replace('T', ' ').split('.')[0],
                'Tháng đăng video': publishedAt.getMonth() + 1,
                'Tuổi của video (ngày)': videoAgeInDays,
                'Tags': (vidSnippet.tags || []).join(', ') || 'Không có',
                'Video Description': vidSnippet.description || '',
                'Link video': `https://www.youtube.com/watch?v=${video.id}`,
                'Duration (Minutes)': parseDuration(vidContent.duration),
                'Link Thumbnail': vidSnippet.thumbnails?.high?.url || ''
            };
        });

        return { channelInfo, videos };
    } catch (error) {
        console.error('Error getting channel and video data:', error.message);
        return { channelInfo: null, videos: [] };
    }
}

// Convert array of objects to CSV string
function arrayToCSV(data) {
    if (!data || data.length === 0) return '';

    const headers = Object.keys(data[0]);
    const csvRows = [
        headers.join(','),
        ...data.map(row =>
            headers.map(header => {
                const value = row[header];
                // Escape quotes and wrap in quotes if contains comma or newline
                if (value === null || value === undefined) return '';
                const stringValue = String(value);
                if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) {
                    return `"${stringValue.replace(/"/g, '""')}"`;
                }
                return stringValue;
            }).join(',')
        )
    ];

    return csvRows.join('\n');
}

// Route: Display the YouTube Research page
router.get('/', (req, res) => {
    res.render('pages/research-youtube', {
        title: 'Research Youtube'
    });
});

// API Route: Analyze channels
router.post('/api/analyze', async (req, res) => {
    try {
        const { apiKey, channels } = req.body;

        if (!apiKey) {
            return res.status(400).json({ error: 'Vui lòng nhập API Key' });
        }

        const channelInputs = channels.split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0);

        if (channelInputs.length === 0) {
            return res.status(400).json({ error: 'Vui lòng nhập danh sách kênh' });
        }

        const allChannelsData = [];
        const allVideosData = [];

        for (const identifier of channelInputs) {
            const channelId = await getChannelId(identifier, apiKey);
            if (!channelId) continue;

            const { channelInfo, videos } = await getChannelAndVideoData(channelId, apiKey);

            if (channelInfo) {
                allChannelsData.push(channelInfo);
            }
            if (videos && videos.length > 0) {
                allVideosData.push(...videos);
            }

            // Small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        if (allChannelsData.length === 0) {
            return res.status(400).json({
                error: 'Không thể lấy dữ liệu cho bất kỳ kênh nào. Vui lòng kiểm tra lại URL/ID và API Key.'
            });
        }

        // Convert to CSV
        const channelCsv = arrayToCSV(allChannelsData);
        const videoCsv = allVideosData.length > 0 ? arrayToCSV(allVideosData) : '';

        res.json({
            channelCsv,
            videoCsv
        });

    } catch (error) {
        console.error('Error in analyze endpoint:', error);
        res.status(500).json({ error: `Đã xảy ra lỗi máy chủ: ${error.message}` });
    }
});

// API Route: Filter channels
router.post('/api/run-filter', async (req, res) => {
    try {
        const { apiKey, keywords, minSubscribers, minVideos, country, language } = req.body;

        if (!apiKey) {
            return res.status(400).json({ error: 'Vui lòng nhập API Key' });
        }

        if (!keywords) {
            return res.status(400).json({ error: 'Vui lòng nhập từ khóa tìm kiếm' });
        }

        // Parse keywords
        const keywordsList = keywords.replace(/\n/g, ',')
            .split(',')
            .map(k => k.trim())
            .filter(k => k.length > 0);

        if (keywordsList.length === 0) {
            return res.status(400).json({ error: 'Vui lòng nhập từ khóa tìm kiếm' });
        }

        const allChannels = [];
        const seenChannelLinks = new Set();

        // Search for each keyword
        for (const keyword of keywordsList) {
            const channels = await searchChannelsByKeyword(
                keyword,
                apiKey,
                100,
                parseInt(minSubscribers) || 1000,
                parseInt(minVideos) || 10,
                country || 'US',
                language || ''
            );

            // Remove duplicates
            for (const channel of channels) {
                const channelLink = channel['Channel Link'];
                if (!seenChannelLinks.has(channelLink)) {
                    seenChannelLinks.add(channelLink);
                    allChannels.push(channel);
                }
            }

            // Limit total channels
            if (allChannels.length >= 100) {
                break;
            }
        }

        if (allChannels.length === 0) {
            return res.status(400).json({
                error: 'Không tìm thấy kênh nào phù hợp với tiêu chí lọc. Vui lòng thử lại với các tiêu chí khác.'
            });
        }

        // Convert to CSV
        const channelCsv = arrayToCSV(allChannels.slice(0, 100));

        res.json({
            channelCsv,
            totalChannels: allChannels.length
        });

    } catch (error) {
        console.error('Error in filter endpoint:', error);
        res.status(500).json({ error: `Đã xảy ra lỗi máy chủ: ${error.message}` });
    }
});

module.exports = router;
