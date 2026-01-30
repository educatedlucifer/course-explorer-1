import type { VercelRequest, VercelResponse } from '@vercel/node';

const BATCHES_API = 'https://utk-batches-apih-45a803b3037e.herokuapp.com/api';
const CONTENT_API = 'https://utk-web-api-5163e92c9014.herokuapp.com/api';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'authorization, x-client-info, apikey, content-type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const endpoint = req.query.endpoint as string;
    
    if (!endpoint) {
      return res.status(400).json({ error: 'Missing endpoint parameter' });
    }

    let apiUrl = '';
    
    switch (endpoint) {
      case 'master-categories':
        apiUrl = `${BATCHES_API}/master-categories`;
        break;
      case 'subcategories':
        apiUrl = `${BATCHES_API}/subcategories?master_id=${req.query.master_id}`;
        break;
      case 'final-categories':
        apiUrl = `${BATCHES_API}/final-categories?subcat_id=${req.query.subcat_id}`;
        break;
      case 'courses':
        apiUrl = `${BATCHES_API}/courses?master_id=${req.query.master_id}&cat_id=${req.query.cat_id}&sub_cat_id=${req.query.sub_cat_id}`;
        break;
      case 'batch':
        apiUrl = `${CONTENT_API}/batch/${req.query.batch_id}`;
        break;
      case 'subjects':
        apiUrl = `${CONTENT_API}/course/${req.query.course_id}/subjects`;
        break;
      case 'topics':
        apiUrl = `${CONTENT_API}/course/${req.query.course_id}/subject/${req.query.subject_id}/topics`;
        break;
      case 'content':
        apiUrl = `${CONTENT_API}/course/${req.query.course_id}/subject/${req.query.subject_id}/topic/${req.query.topic_id}/content`;
        break;

      // Unacademy endpoints
      case 'unacademy-goals': {
        console.log('Fetching Unacademy goals...');
        const goalsRes = await fetch('https://unknownkil.github.io/Goal_unad-json/goals.json', {
          headers: { 'Accept': 'application/json', 'User-Agent': 'StudyPro/1.0' },
        });
        if (!goalsRes.ok) {
          return res.status(goalsRes.status).json({ error: 'Failed to fetch goals' });
        }
        const goalsData = await goalsRes.json();
        return res.status(200).json({ status: 'success', data: goalsData });
      }

      case 'unacademy-batches': {
        const goalId = req.query.goal_id as string;
        const offset = req.query.offset || '0';
        const limit = req.query.limit || '20';
        if (!goalId) {
          return res.status(400).json({ error: 'Missing goal_id' });
        }
        const batchesUrl = `https://api-frontend.unacademy.com/api/v1/batch/lists/filter/?goal_uid=${goalId}&limit=${limit}&offset=${offset}&type=0`;
        const batchesRes = await fetch(batchesUrl, {
          headers: { 
            'Accept': 'application/json', 
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' 
          },
        });
        if (!batchesRes.ok) {
          return res.status(batchesRes.status).json({ error: 'Failed to fetch batches' });
        }
        const batchesData = await batchesRes.json();
        return res.status(200).json({ status: 'success', data: batchesData });
      }

      case 'unacademy-batch-info': {
        const batchId = req.query.batch_id as string;
        if (!batchId) {
          return res.status(400).json({ error: 'Missing batch_id' });
        }
        const infoUrl = `https://api-frontend.unacademy.com/api/v1/batch/${batchId}/`;
        const infoRes = await fetch(infoUrl, {
          headers: { 
            'Accept': 'application/json', 
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' 
          },
        });
        if (!infoRes.ok) {
          return res.status(infoRes.status).json({ error: 'Failed to fetch batch info' });
        }
        const infoData = await infoRes.json();
        return res.status(200).json({ status: 'success', data: infoData });
      }

      case 'unacademy-schedule': {
        const batchIdS = req.query.batch_id as string;
        if (!batchIdS) {
          return res.status(400).json({ error: 'Missing batch_id' });
        }
        const scheduleUrl = `https://api.unacademy.com/api/v1/batch/${batchIdS}/schedule/?limit=1000&offset=None&past=False&rank=1&timezone_difference=330`;
        const scheduleRes = await fetch(scheduleUrl, {
          headers: { 
            'Accept': 'application/json', 
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' 
          },
        });
        if (!scheduleRes.ok) {
          return res.status(scheduleRes.status).json({ error: 'Failed to fetch schedule' });
        }
        const scheduleData = await scheduleRes.json();
        
        interface LessonItem {
          id: string;
          title: string;
          date: string;
          videoUrl: string;
          pdfUrl: string;
          author: string;
        }
        const lessons: LessonItem[] = [];
        const processedIds = new Set<string>();
        
        for (const item of (scheduleData.results || [])) {
          try {
            const liveClass = item?.properties?.liveClass;
            if (liveClass) {
              const lessonId = liveClass.uid || item.uid;
              if (processedIds.has(lessonId)) continue;
              processedIds.add(lessonId);
              
              const slidesPdf = liveClass.slidesPdf;
              let videoUrl = '';
              let pdfUrl = '';
              
              if (slidesPdf?.withAnnotation) {
                pdfUrl = slidesPdf.withAnnotation;
                const parts = pdfUrl.split('/');
                const videoId = parts[parts.length - 2] || parts[parts.length - 1]?.split('.')[0];
                if (videoId) {
                  videoUrl = `https://uamedia.uacdn.net/lesson-raw/${videoId}/output.webm`;
                }
              }
              
              let formattedDate = 'Unknown';
              if (liveClass.liveAt) {
                const d = new Date(liveClass.liveAt);
                formattedDate = `${d.getDate().toString().padStart(2,'0')}-${(d.getMonth()+1).toString().padStart(2,'0')}-${d.getFullYear()}`;
              }
              
              const author = ((liveClass.author?.firstName || '') + ' ' + (liveClass.author?.lastName || '')).trim();
              
              lessons.push({
                id: lessonId,
                title: item.properties?.title || liveClass.title || 'Untitled',
                date: formattedDate,
                videoUrl,
                pdfUrl,
                author: author || 'Unknown',
              });
            }
          } catch (e) {
            console.warn('Error processing lesson:', e);
          }
        }
        
        return res.status(200).json({ status: 'success', data: { lessons, total: lessons.length } });
      }

      case 'course-content': {
        const ccCourseId = req.query.course_id as string;
        if (!ccCourseId) {
          return res.status(400).json({ error: 'Missing course_id' });
        }

        // Fetch subjects
        const subjectsRes = await fetch(`${CONTENT_API}/course/${ccCourseId}/subjects`, {
          headers: { 'Accept': 'application/json', 'User-Agent': 'StudyPro/1.0' },
        });
        if (!subjectsRes.ok) {
          return res.status(subjectsRes.status).json({ error: 'Failed to fetch subjects' });
        }
        const subjectsData = await subjectsRes.json();
        const subjects: { id: string; title?: string; name?: string }[] = subjectsData.data || subjectsData.result || [];

        interface ContentItem { id: string; title: string; url: string; }
        interface TopicEntry { id: string; name: string; contents: ContentItem[]; }
        interface SubjectEntry { id: string; name: string; topics: TopicEntry[]; }

        const courseStructure: { course_id: string; subjects: SubjectEntry[] } = {
          course_id: ccCourseId,
          subjects: [],
        };

        for (const subj of subjects) {
          const subjId = String(subj.id);
          const subjName = subj.title || subj.name || `Subject ${subjId}`;
          const subjectEntry: SubjectEntry = { id: subjId, name: subjName, topics: [] };

          try {
            const topicsRes = await fetch(
              `${CONTENT_API}/course/${ccCourseId}/subject/${subjId}/topics`,
              { headers: { 'Accept': 'application/json', 'User-Agent': 'StudyPro/1.0' } }
            );
            if (topicsRes.ok) {
              const topicsData = await topicsRes.json();
              const topics: { id: string; title?: string; name?: string }[] = topicsData.data || topicsData.result || [];

              for (const topic of topics) {
                const topicId = String(topic.id);
                const topicName = topic.title || topic.name || `Topic ${topicId}`;
                const topicEntry: TopicEntry = { id: topicId, name: topicName, contents: [] };

                try {
                  const contentRes = await fetch(
                    `${CONTENT_API}/course/${ccCourseId}/subject/${subjId}/topic/${topicId}/content`,
                    { headers: { 'Accept': 'application/json', 'User-Agent': 'StudyPro/1.0' } }
                  );
                  if (contentRes.ok) {
                    const contentData = await contentRes.json();
                    const contents: { id: string; title?: string; name?: string; url?: string }[] =
                      contentData.data || contentData.result || [];

                    for (const c of contents) {
                      topicEntry.contents.push({
                        id: String(c.id),
                        title: c.title || c.name || `Content ${c.id}`,
                        url: c.url || '',
                      });
                    }
                  }
                } catch (e) {
                  console.warn(`Error fetching content for topic ${topicId}:`, e);
                }

                subjectEntry.topics.push(topicEntry);
              }
            }
          } catch (e) {
            console.warn(`Error fetching topics for subject ${subjId}:`, e);
          }

          courseStructure.subjects.push(subjectEntry);
        }

        return res.status(200).json({ status: 'success', data: courseStructure });
      }

      default:
        return res.status(400).json({ error: 'Unknown endpoint' });
    }

    const response = await fetch(apiUrl, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'StudyPro/1.0',
      },
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: `API returned ${response.status}` });
    }

    const data = await response.json();
    return res.status(200).json(data);

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in study-api function:', errorMessage);
    return res.status(500).json({ error: errorMessage });
  }
}
