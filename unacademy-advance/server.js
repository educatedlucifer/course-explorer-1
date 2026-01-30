const express = require('express');
const cors = require('cors');
const axios = require('axios');
const cheerio = require('cheerio');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
};

// Data files
const DATA_DIR = path.join(__dirname, 'data');
const BATCHES_FILE = path.join(DATA_DIR, 'batches.json');
const REQUESTS_FILE = path.join(DATA_DIR, 'requests.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);

// Admin credentials
const ADMIN_USER = 'admin';
const ADMIN_PASS = 'admin123';

// Helper functions
function loadData(file) {
    try {
        if (fs.existsSync(file)) return JSON.parse(fs.readFileSync(file, 'utf8'));
    } catch (e) { console.error('Load error:', e.message); }
    return file.includes('requests') ? { requests: [] } : { batches: [] };
}

function saveData(file, data) {
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

// ============== ADMIN AUTH ==============
app.post('/api/admin/login', (req, res) => {
    const { username, password } = req.body;
    if (username === ADMIN_USER && password === ADMIN_PASS) {
        res.json({ success: true, token: 'admin-token-' + Date.now() });
    } else {
        res.status(401).json({ error: 'Invalid credentials' });
    }
});

// ============== REQUEST MANAGEMENT ==============

// Submit batch request (from user)
app.post('/api/requests', (req, res) => {
    const { batchId, batchName, batchImage, goalName, type } = req.body;
    
    if (!batchId || !batchName) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const data = loadData(REQUESTS_FILE);
    
    // Check if pending request already exists
    const existing = data.requests.find(r => r.batchId === batchId && r.status === 'pending');
    if (existing) {
        return res.json({ success: true, message: 'Request already pending', requestId: existing.id });
    }
    
    const request = {
        id: 'REQ-' + Date.now(),
        batchId,
        batchName,
        batchImage: batchImage || '',
        goalName: goalName || '',
        type: type || 'NEW',
        status: 'pending',
        createdAt: new Date().toISOString()
    };
    
    data.requests.push(request);
    saveData(REQUESTS_FILE, data);
    
    res.json({ success: true, message: 'Request submitted', requestId: request.id });
});

// Get all requests (admin)
app.get('/api/admin/requests', (req, res) => {
    const data = loadData(REQUESTS_FILE);
    res.json(data.requests.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
});

// Get request stats (admin)
app.get('/api/admin/stats', (req, res) => {
    const requests = loadData(REQUESTS_FILE).requests;
    const batches = loadData(BATCHES_FILE).batches;
    
    res.json({
        totalRequests: requests.length,
        pendingRequests: requests.filter(r => r.status === 'pending').length,
        processingRequests: requests.filter(r => r.status === 'processing').length,
        approvedBatches: batches.length,
        totalLessons: batches.reduce((sum, b) => sum + (b.totalLessons || 0), 0)
    });
});

// Reject request (admin)
app.post('/api/admin/requests/:id/reject', (req, res) => {
    const { id } = req.params;
    const data = loadData(REQUESTS_FILE);
    
    const request = data.requests.find(r => r.id === id);
    if (!request) return res.status(404).json({ error: 'Request not found' });
    
    request.status = 'rejected';
    request.processedAt = new Date().toISOString();
    saveData(REQUESTS_FILE, data);
    
    res.json({ success: true, message: 'Request rejected' });
});

// Approve request (admin) - triggers extraction
app.post('/api/admin/requests/:id/approve', async (req, res) => {
    const { id } = req.params;
    const requestsData = loadData(REQUESTS_FILE);
    
    const request = requestsData.requests.find(r => r.id === id);
    if (!request) return res.status(404).json({ error: 'Request not found' });
    
    // Update status to processing
    request.status = 'processing';
    saveData(REQUESTS_FILE, requestsData);
    
    // Start extraction in background
    res.json({ success: true, message: 'Processing started' });
    
    try {
        const extractedData = await extractCourse(request.batchId);
        
        if (extractedData && extractedData.lessons && extractedData.lessons.length > 0) {
            const batchesData = loadData(BATCHES_FILE);
            const existingIndex = batchesData.batches.findIndex(b => b.courseId === request.batchId);
            
            let newLessons = 0;
            let duplicatesSkipped = 0;
            
            if (existingIndex >= 0 && request.type === 'UPDATE') {
                // Update existing - only add new lessons
                const existing = batchesData.batches[existingIndex];
                const existingIds = new Set(existing.lessons.map(l => l.id || l.videoUrl));
                
                // Update batch name if extracted name is valid
                if (extractedData.batchName && extractedData.batchName !== 'Unknown Batch') {
                    existing.batchName = extractedData.batchName;
                }
                
                for (const lesson of extractedData.lessons) {
                    const lessonId = lesson.id || lesson.videoUrl;
                    if (!existingIds.has(lessonId)) {
                        existing.lessons.push(lesson);
                        newLessons++;
                    } else {
                        duplicatesSkipped++;
                    }
                }
                existing.totalLessons = existing.lessons.length;
                existing.updatedAt = new Date().toISOString();
            } else {
                // New batch
                batchesData.batches.push({
                    courseId: request.batchId,
                    batchName: extractedData.batchName || request.batchName,
                    batchImage: request.batchImage,
                    goalName: request.goalName,
                    lessons: extractedData.lessons,
                    totalLessons: extractedData.lessons.length,
                    savedAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                });
                newLessons = extractedData.lessons.length;
            }
            
            saveData(BATCHES_FILE, batchesData);
            
            // Update request status
            request.status = 'approved';
            request.processedAt = new Date().toISOString();
            request.result = { newLessons, duplicatesSkipped, totalLessons: extractedData.lessons.length };
            saveData(REQUESTS_FILE, requestsData);
        } else {
            request.status = 'failed';
            request.error = 'No lessons found';
            request.processedAt = new Date().toISOString();
            saveData(REQUESTS_FILE, requestsData);
        }
    } catch (error) {
        request.status = 'failed';
        request.error = error.message;
        request.processedAt = new Date().toISOString();
        saveData(REQUESTS_FILE, requestsData);
    }
});

// Delete request (admin)
app.delete('/api/admin/requests/:id', (req, res) => {
    const { id } = req.params;
    const data = loadData(REQUESTS_FILE);
    
    const index = data.requests.findIndex(r => r.id === id);
    if (index >= 0) {
        data.requests.splice(index, 1);
        saveData(REQUESTS_FILE, data);
        res.json({ success: true });
    } else {
        res.status(404).json({ error: 'Request not found' });
    }
});

// ============== EXTRACTION LOGIC ==============
async function getBuildId() {
    const response = await axios.get('https://unacademy.com', { headers, timeout: 60000 });
    const $ = cheerio.load(response.data);
    let buildId = null;
    
    $('script[type="application/json"]').each((i, el) => {
        const text = $(el).html();
        if (text && text.includes('"props":')) {
            try {
                const data = JSON.parse(text);
                if (data.buildId) { buildId = data.buildId; return false; }
            } catch (e) {}
        }
    });
    return buildId;
}

async function extractCourse(courseId) {
    const buildId = await getBuildId();
    
    // Get batch name
    let batchName = 'Unknown Batch';
    try {
        const directUrl = `https://api-frontend.unacademy.com/api/v1/batch/${courseId}/`;
        const directResponse = await axios.get(directUrl, { headers, timeout: 30000 });
        if (directResponse.data?.name) batchName = directResponse.data.name;
    } catch (e) {}
    
    // Get schedule
    const scheduleUrl = `https://api.unacademy.com/api/v1/batch/${courseId}/schedule/?limit=1000&offset=None&past=False&rank=1&timezone_difference=330`;
    const scheduleResponse = await axios.get(scheduleUrl, { headers, timeout: 60000 });
    
    const lessonLinks = new Set();
    for (const item of (scheduleResponse.data?.results || [])) {
        const permalink = item?.properties?.permalink;
        if (permalink) lessonLinks.add(permalink.split('?liveclass=')[0]);
    }
    
    if (lessonLinks.size === 0) return { batchName, lessons: [] };
    
    // Process lessons
    const results = [];
    const processedIds = new Set();
    
    for (const link of lessonLinks) {
        try {
            const lessonPage = await axios.get(link, { headers, timeout: 30000 });
            const $ = cheerio.load(lessonPage.data);
            
            $('script[type="application/json"]').each((i, el) => {
                const text = $(el).html();
                if (text && text.includes('"props":')) {
                    try {
                        const data = JSON.parse(text);
                        const lessonData = data?.props?.pageProps?.lessonListFallbackData;
                        
                        for (const lesson of (lessonData?.results || [])) {
                            if (lesson?.value?.liveClass) {
                                const lessonId = lesson.value.uid || lesson.value.id;
                                if (processedIds.has(lessonId)) continue;
                                processedIds.add(lessonId);
                                
                                const title = lesson.value.title?.replace(/[:|\\/]/g, '') || 'Untitled';
                                const liveAt = lesson.value.liveClass.liveAt;
                                const author = ((lesson.value.author?.firstName || '') + ' ' + (lesson.value.author?.lastName || '')).trim();
                                
                                let formattedDate = 'Unknown';
                                if (liveAt) {
                                    const d = new Date(liveAt);
                                    formattedDate = `${d.getDate().toString().padStart(2,'0')}-${(d.getMonth()+1).toString().padStart(2,'0')}-${d.getFullYear()}`;
                                }
                                
                                const slidesPdf = lesson.value.liveClass.slidesPdf;
                                if (slidesPdf?.withAnnotation) {
                                    const pdfUrl = slidesPdf.withAnnotation;
                                    const videoId = pdfUrl.split('/').slice(-2, -1)[0];
                                    const videoUrl = `https://uamedia.uacdn.net/lesson-raw/${videoId}/output.webm`;
                                    
                                    results.push({ id: lessonId || videoId, title, date: formattedDate, videoUrl, pdfUrl, author: author || 'Unknown' });
                                }
                            }
                        }
                    } catch (e) {}
                }
            });
        } catch (e) {}
    }
    
    return { batchName, courseId, lessons: results, totalLessons: results.length };
}

// ============== PUBLIC APIs ==============

// Get all goals
app.get('/api/goals', async (req, res) => {
    try {
        const response = await axios.get('https://unknownkil.github.io/Goal_unad-json/goals.json', { headers, timeout: 30000 });
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch goals' });
    }
});

// Get batches for a goal
app.get('/api/batches/:goalId', async (req, res) => {
    const { goalId } = req.params;
    const offset = parseInt(req.query.offset) || 0;
    const limit = parseInt(req.query.limit) || 20;
    
    try {
        const url = `https://api-frontend.unacademy.com/api/v1/batch/lists/filter/?goal_uid=${goalId}&limit=${limit}&offset=${offset}&type=0`;
        const response = await axios.get(url, { headers, timeout: 30000 });
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch batches' });
    }
});

// Get approved batches (public)
app.get('/api/courses', (req, res) => {
    const data = loadData(BATCHES_FILE);
    res.json(data.batches);
});

// Get single course
app.get('/api/courses/:id', (req, res) => {
    const data = loadData(BATCHES_FILE);
    const course = data.batches.find(b => b.courseId === req.params.id);
    if (course) res.json(course);
    else res.status(404).json({ error: 'Course not found' });
});

// Check request status for a batch
app.get('/api/requests/status/:batchId', (req, res) => {
    const data = loadData(REQUESTS_FILE);
    const request = data.requests.find(r => r.batchId === req.params.batchId);
    const batches = loadData(BATCHES_FILE);
    const isApproved = batches.batches.some(b => b.courseId === req.params.batchId);
    
    res.json({
        hasRequest: !!request,
        status: request?.status || null,
        isApproved
    });
});

// Delete course (admin)
app.delete('/api/admin/courses/:id', (req, res) => {
    const data = loadData(BATCHES_FILE);
    const index = data.batches.findIndex(b => b.courseId === req.params.id);
    if (index >= 0) {
        data.batches.splice(index, 1);
        saveData(BATCHES_FILE, data);
        res.json({ success: true });
    } else {
        res.status(404).json({ error: 'Course not found' });
    }
});

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Serve admin panel
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'public', 'admin.html')));

// Serve frontend (fallback for all other routes)
app.use((req, res) => {
    if (req.path.startsWith('/admin')) {
        res.sendFile(path.join(__dirname, 'public', 'admin.html'));
    } else {
        res.sendFile(path.join(__dirname, 'public', 'index.html'));
    }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
