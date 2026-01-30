import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const BATCHES_API = 'https://utk-batches-apih-45a803b3037e.herokuapp.com/api';
const CONTENT_API = 'https://utk-web-api-5163e92c9014.herokuapp.com/api';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const endpoint = url.searchParams.get('endpoint');
    
    if (!endpoint) {
      return new Response(
        JSON.stringify({ error: 'Missing endpoint parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let apiUrl = '';
    
    // Route to correct API based on endpoint
    switch (endpoint) {
      case 'master-categories':
        apiUrl = `${BATCHES_API}/master-categories`;
        break;
      case 'subcategories':
        const masterId = url.searchParams.get('master_id');
        apiUrl = `${BATCHES_API}/subcategories?master_id=${masterId}`;
        break;
      case 'final-categories':
        const subcatId = url.searchParams.get('subcat_id');
        apiUrl = `${BATCHES_API}/final-categories?subcat_id=${subcatId}`;
        break;
      case 'courses':
        const mId = url.searchParams.get('master_id');
        const catId = url.searchParams.get('cat_id');
        const subCatId = url.searchParams.get('sub_cat_id');
        apiUrl = `${BATCHES_API}/courses?master_id=${mId}&cat_id=${catId}&sub_cat_id=${subCatId}`;
        break;
      case 'batch':
        const batchId = url.searchParams.get('batch_id');
        apiUrl = `${CONTENT_API}/batch/${batchId}`;
        break;
      case 'subjects':
        const courseId = url.searchParams.get('course_id');
        apiUrl = `${CONTENT_API}/course/${courseId}/subjects`;
        break;
      case 'topics':
        const cId = url.searchParams.get('course_id');
        const subjectId = url.searchParams.get('subject_id');
        apiUrl = `${CONTENT_API}/course/${cId}/subject/${subjectId}/topics`;
        break;
      case 'content':
        const courseIdC = url.searchParams.get('course_id');
        const subjectIdC = url.searchParams.get('subject_id');
        const topicId = url.searchParams.get('topic_id');
        apiUrl = `${CONTENT_API}/course/${courseIdC}/subject/${subjectIdC}/topic/${topicId}/content`;
        break;

      case 'course-content': {
        // Full course hierarchy: subjects → topics → content (like Python server)
        const ccCourseId = url.searchParams.get('course_id');
        if (!ccCourseId) {
          return new Response(
            JSON.stringify({ error: 'Missing course_id' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        console.log(`Fetching full course content for: ${ccCourseId}`);

        // Step 1: Fetch subjects
        const subjectsRes = await fetch(`${CONTENT_API}/course/${ccCourseId}/subjects`, {
          headers: { 'Accept': 'application/json', 'User-Agent': 'StudyPro/1.0' },
        });
        if (!subjectsRes.ok) {
          return new Response(
            JSON.stringify({ error: 'Failed to fetch subjects' }),
            { status: subjectsRes.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
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

        // Step 2 & 3: For each subject, fetch topics; for each topic, fetch content
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

        console.log(
          `Course ${ccCourseId}: ${courseStructure.subjects.length} subjects, ` +
          `${courseStructure.subjects.reduce((a, s) => a + s.topics.length, 0)} topics, ` +
          `${courseStructure.subjects.reduce((a, s) => a + s.topics.reduce((b, t) => b + t.contents.length, 0), 0)} contents`
        );

        return new Response(
          JSON.stringify({ status: 'success', data: courseStructure }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Unknown endpoint' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    console.log(`Fetching from: ${apiUrl}`);
    
    const response = await fetch(apiUrl, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'StudyPro/1.0',
      },
    });

    if (!response.ok) {
      console.error(`API Error: ${response.status} ${response.statusText}`);
      return new Response(
        JSON.stringify({ error: `API returned ${response.status}` }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    console.log(`Successfully fetched ${endpoint}, data count: ${data.count || data.data?.length || 'N/A'}`);

    return new Response(
      JSON.stringify(data),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in study-api function:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
