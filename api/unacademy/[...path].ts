import type { VercelRequest, VercelResponse } from '@vercel/node';
import path from 'path';
import { promises as fs } from 'fs';

const DATA_DIR = path.join('/tmp', 'unacademy-data');
const BATCHES_FILE = path.join(DATA_DIR, 'batches.json');
const REQUESTS_FILE = path.join(DATA_DIR, 'requests.json');

const ADMIN_USER = 'admin';
const ADMIN_PASS = 'admin123';

const headers = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  'Accept': 'text/html,application/json',
};

type RequestEntry = {
  id: string;
  batchId: string;
  batchName: string;
  batchImage?: string;
  goalName?: string;
  type?: string;
  status: string;
  createdAt: string;
  processedAt?: string;
  result?: { newLessons: number; duplicatesSkipped: number; totalLessons: number };
  error?: string;
};

type LessonEntry = {
  id: string;
  title: string;
  date: string;
  videoUrl: string;
  pdfUrl?: string;
  author?: string;
};

type BatchEntry = {
  courseId: string;
  batchName: string;
  batchImage?: string;
  goalName?: string;
  lessons: LessonEntry[];
  totalLessons: number;
  savedAt?: string;
  updatedAt?: string;
};

type RequestData = { requests: RequestEntry[] };
type BatchData = { batches: BatchEntry[] };

async function ensureDataDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

async function loadData<T extends RequestData | BatchData>(file: string, fallback: T): Promise<T> {
  try {
    await ensureDataDir();
    const raw = await fs.readFile(file, 'utf8');
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function saveData<T>(file: string, data: T) {
  await ensureDataDir();
  await fs.writeFile(file, JSON.stringify(data, null, 2));
}

function parsePath(req: VercelRequest): string[] {
  const raw = req.query.path;
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  return [raw];
}

async function getBuildId(): Promise<string | null> {
  try {
    const response = await fetch('https://unacademy.com', { headers });
    const html = await response.text();
    const nextMatch = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
    if (nextMatch?.[1]) {
      const data = JSON.parse(nextMatch[1]);
      if (data?.buildId) return data.buildId as string;
    }
    const buildMatch = html.match(/"buildId"\s*:\s*"([^"]+)"/);
    return buildMatch?.[1] ?? null;
  } catch {
    return null;
  }
}

function extractLessonData(html: string) {
  const nextMatch = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
  if (!nextMatch?.[1]) return null;
  try {
    const data = JSON.parse(nextMatch[1]);
    return data?.props?.pageProps?.lessonListFallbackData ?? null;
  } catch {
    return null;
  }
}

async function extractCourse(courseId: string) {
  const buildId = await getBuildId();
  const batchNameFallback = `Unknown Batch${buildId ? ` (${buildId})` : ''}`;
  let batchName = batchNameFallback;

  try {
    const directUrl = `https://api-frontend.unacademy.com/api/v1/batch/${courseId}/`;
    const directResponse = await fetch(directUrl, { headers });
    if (directResponse.ok) {
      const data = await directResponse.json();
      if (data?.name) batchName = data.name as string;
    }
  } catch {
    // keep fallback
  }

  const scheduleUrl = `https://api.unacademy.com/api/v1/batch/${courseId}/schedule/?limit=1000&offset=None&past=False&rank=1&timezone_difference=330`;
  const scheduleResponse = await fetch(scheduleUrl, { headers });
  if (!scheduleResponse.ok) {
    throw new Error('Failed to fetch schedule');
  }

  const scheduleData = await scheduleResponse.json();
  const lessonLinks = new Set<string>();
  for (const item of scheduleData?.results || []) {
    const permalink = item?.properties?.permalink as string | undefined;
    if (permalink) lessonLinks.add(permalink.split('?liveclass=')[0]);
  }

  if (lessonLinks.size === 0) return { batchName, lessons: [] as LessonEntry[] };

  const results: LessonEntry[] = [];
  const processedIds = new Set<string>();

  for (const link of lessonLinks) {
    try {
      const lessonResponse = await fetch(link, { headers });
      if (!lessonResponse.ok) continue;
      const html = await lessonResponse.text();
      const lessonData = extractLessonData(html);

      for (const lesson of lessonData?.results || []) {
        if (!lesson?.value?.liveClass) continue;
        const lessonId = String(lesson.value.uid || lesson.value.id || '');
        if (lessonId && processedIds.has(lessonId)) continue;
        if (lessonId) processedIds.add(lessonId);

        const title = String(lesson.value.title || 'Untitled').replace(/[:|\\/]/g, '');
        const liveAt = lesson.value.liveClass.liveAt as string | undefined;
        const author = `${lesson.value.author?.firstName || ''} ${lesson.value.author?.lastName || ''}`.trim();

        let formattedDate = 'Unknown';
        if (liveAt) {
          const d = new Date(liveAt);
          formattedDate = `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
        }

        const slidesPdf = lesson.value.liveClass.slidesPdf;
        const pdfUrl = slidesPdf?.withAnnotation as string | undefined;
        if (!pdfUrl) continue;
        const videoId = pdfUrl.split('/').slice(-2, -1)[0];
        const videoUrl = `https://uamedia.uacdn.net/lesson-raw/${videoId}/output.webm`;

        results.push({
          id: lessonId || videoId,
          title,
          date: formattedDate,
          videoUrl,
          pdfUrl,
          author: author || 'Unknown',
        });
      }
    } catch {
      // skip failed lesson pages
    }
  }

  return { batchName, courseId, lessons: results, totalLessons: results.length };
}

async function approveRequest(requestId: string) {
  const requestsData = await loadData<RequestData>(REQUESTS_FILE, { requests: [] });
  const request = requestsData.requests.find((entry) => entry.id === requestId);
  if (!request) return;

  try {
    const extractedData = await extractCourse(request.batchId);
    if (extractedData && extractedData.lessons && extractedData.lessons.length > 0) {
      const batchesData = await loadData<BatchData>(BATCHES_FILE, { batches: [] });
      const existingIndex = batchesData.batches.findIndex((batch) => batch.courseId === request.batchId);

      let newLessons = 0;
      let duplicatesSkipped = 0;

      if (existingIndex >= 0 && request.type === 'UPDATE') {
        const existing = batchesData.batches[existingIndex];
        const existingIds = new Set(existing.lessons.map((lesson) => lesson.id || lesson.videoUrl));

        if (extractedData.batchName && extractedData.batchName !== 'Unknown Batch') {
          existing.batchName = extractedData.batchName;
        }

        for (const lesson of extractedData.lessons) {
          const lessonId = lesson.id || lesson.videoUrl;
          if (!existingIds.has(lessonId)) {
            existing.lessons.push(lesson);
            newLessons += 1;
          } else {
            duplicatesSkipped += 1;
          }
        }
        existing.totalLessons = existing.lessons.length;
        existing.updatedAt = new Date().toISOString();
      } else {
        batchesData.batches.push({
          courseId: request.batchId,
          batchName: extractedData.batchName || request.batchName,
          batchImage: request.batchImage || '',
          goalName: request.goalName || '',
          lessons: extractedData.lessons,
          totalLessons: extractedData.lessons.length,
          savedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        newLessons = extractedData.lessons.length;
      }

      await saveData(BATCHES_FILE, batchesData);
      request.status = 'approved';
      request.processedAt = new Date().toISOString();
      request.result = { newLessons, duplicatesSkipped, totalLessons: extractedData.lessons.length };
    } else {
      request.status = 'failed';
      request.error = 'No lessons found';
      request.processedAt = new Date().toISOString();
    }
  } catch (error) {
    request.status = 'failed';
    request.error = error instanceof Error ? error.message : 'Unknown error';
    request.processedAt = new Date().toISOString();
  }

  await saveData(REQUESTS_FILE, requestsData);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'authorization, x-client-info, apikey, content-type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const segments = parsePath(req);
  const [first, second, third, fourth] = segments;

  if (first === 'health' && req.method === 'GET') {
    return res.status(200).json({ status: 'ok' });
  }

  if (first === 'admin' && second === 'login' && req.method === 'POST') {
    const { username, password } = req.body || {};
    if (username === ADMIN_USER && password === ADMIN_PASS) {
      return res.status(200).json({ success: true, token: `admin-token-${Date.now()}` });
    }
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  if (first === 'requests' && req.method === 'POST') {
    const { batchId, batchName, batchImage, goalName, type } = req.body || {};
    if (!batchId || !batchName) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const data = await loadData<RequestData>(REQUESTS_FILE, { requests: [] });
    const existing = data.requests.find((entry) => entry.batchId === batchId && entry.status === 'pending');
    if (existing) {
      return res.status(200).json({ success: true, message: 'Request already pending', requestId: existing.id });
    }
    const request: RequestEntry = {
      id: `REQ-${Date.now()}`,
      batchId,
      batchName,
      batchImage: batchImage || '',
      goalName: goalName || '',
      type: type || 'NEW',
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    data.requests.push(request);
    await saveData(REQUESTS_FILE, data);
    return res.status(200).json({ success: true, message: 'Request submitted', requestId: request.id });
  }

  if (first === 'admin' && second === 'requests' && req.method === 'GET') {
    const data = await loadData<RequestData>(REQUESTS_FILE, { requests: [] });
    return res.status(200).json(
      data.requests.sort((a, b) => new Date(b.createdAt).valueOf() - new Date(a.createdAt).valueOf())
    );
  }

  if (first === 'admin' && second === 'stats' && req.method === 'GET') {
    const requests = await loadData<RequestData>(REQUESTS_FILE, { requests: [] });
    const batches = await loadData<BatchData>(BATCHES_FILE, { batches: [] });
    return res.status(200).json({
      totalRequests: requests.requests.length,
      pendingRequests: requests.requests.filter((entry) => entry.status === 'pending').length,
      processingRequests: requests.requests.filter((entry) => entry.status === 'processing').length,
      approvedBatches: batches.batches.length,
      totalLessons: batches.batches.reduce((sum, batch) => sum + (batch.totalLessons || 0), 0),
    });
  }

  if (first === 'admin' && second === 'requests' && third && req.method === 'POST') {
    if (fourth === 'reject') {
      const data = await loadData<RequestData>(REQUESTS_FILE, { requests: [] });
      const request = data.requests.find((entry) => entry.id === third);
      if (!request) return res.status(404).json({ error: 'Request not found' });
      request.status = 'rejected';
      request.processedAt = new Date().toISOString();
      await saveData(REQUESTS_FILE, data);
      return res.status(200).json({ success: true, message: 'Request rejected' });
    }
    if (fourth === 'approve') {
      const data = await loadData<RequestData>(REQUESTS_FILE, { requests: [] });
      const request = data.requests.find((entry) => entry.id === third);
      if (!request) return res.status(404).json({ error: 'Request not found' });
      request.status = 'processing';
      await saveData(REQUESTS_FILE, data);
      void approveRequest(request.id);
      return res.status(200).json({ success: true, message: 'Processing started' });
    }
  }

  if (first === 'admin' && second === 'requests' && third && req.method === 'DELETE') {
    const data = await loadData<RequestData>(REQUESTS_FILE, { requests: [] });
    const index = data.requests.findIndex((entry) => entry.id === third);
    if (index >= 0) {
      data.requests.splice(index, 1);
      await saveData(REQUESTS_FILE, data);
      return res.status(200).json({ success: true });
    }
    return res.status(404).json({ error: 'Request not found' });
  }

  if (first === 'admin' && second === 'courses' && third && req.method === 'DELETE') {
    const data = await loadData<BatchData>(BATCHES_FILE, { batches: [] });
    const index = data.batches.findIndex((entry) => entry.courseId === third);
    if (index >= 0) {
      data.batches.splice(index, 1);
      await saveData(BATCHES_FILE, data);
      return res.status(200).json({ success: true });
    }
    return res.status(404).json({ error: 'Course not found' });
  }

  if (first === 'goals' && req.method === 'GET') {
    try {
      const response = await fetch('https://unknownkil.github.io/Goal_unad-json/goals.json', { headers });
      if (!response.ok) {
        return res.status(500).json({ error: 'Failed to fetch goals' });
      }
      const data = await response.json();
      return res.status(200).json(data);
    } catch {
      return res.status(500).json({ error: 'Failed to fetch goals' });
    }
  }

  if (first === 'batches' && second && req.method === 'GET') {
    const goalId = second;
    const offset = Number(req.query.offset ?? 0);
    const limit = Number(req.query.limit ?? 20);
    try {
      const url = `https://api-frontend.unacademy.com/api/v1/batch/lists/filter/?goal_uid=${goalId}&limit=${limit}&offset=${offset}&type=0`;
      const response = await fetch(url, { headers });
      if (!response.ok) {
        return res.status(500).json({ error: 'Failed to fetch batches' });
      }
      const data = await response.json();
      return res.status(200).json(data);
    } catch {
      return res.status(500).json({ error: 'Failed to fetch batches' });
    }
  }

  if (first === 'courses' && req.method === 'GET') {
    const data = await loadData<BatchData>(BATCHES_FILE, { batches: [] });
    if (second) {
      const course = data.batches.find((entry) => entry.courseId === second);
      if (!course) return res.status(404).json({ error: 'Course not found' });
      return res.status(200).json(course);
    }
    return res.status(200).json(data.batches);
  }

  if (first === 'requests' && second === 'status' && third && req.method === 'GET') {
    const requests = await loadData<RequestData>(REQUESTS_FILE, { requests: [] });
    const request = requests.requests.find((entry) => entry.batchId === third);
    const batches = await loadData<BatchData>(BATCHES_FILE, { batches: [] });
    const isApproved = batches.batches.some((batch) => batch.courseId === third);
    return res.status(200).json({
      hasRequest: Boolean(request),
      status: request?.status ?? null,
      isApproved,
    });
  }

  return res.status(404).json({ error: 'Not found' });
}
