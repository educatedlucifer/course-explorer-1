import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const BATCHES_API = 'https://utk-batches-apih-45a803b3037e.herokuapp.com/api';
const WEB_API = 'https://utk-web-api-5163e92c9014.herokuapp.com/api';

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
        apiUrl = `${WEB_API}/batch/${batchId}`;
        break;
      case 'subjects':
        const courseId = url.searchParams.get('course_id');
        apiUrl = `${WEB_API}/course/${courseId}/subjects`;
        break;
      case 'topics':
        const cId = url.searchParams.get('course_id');
        const subjectId = url.searchParams.get('subject_id');
        apiUrl = `${WEB_API}/course/${cId}/subject/${subjectId}/topics`;
        break;
      case 'content':
        const courseIdC = url.searchParams.get('course_id');
        const subjectIdC = url.searchParams.get('subject_id');
        const topicId = url.searchParams.get('topic_id');
        apiUrl = `${WEB_API}/course/${courseIdC}/subject/${subjectIdC}/topic/${topicId}/content`;
        break;
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
