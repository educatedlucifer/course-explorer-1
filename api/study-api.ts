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
