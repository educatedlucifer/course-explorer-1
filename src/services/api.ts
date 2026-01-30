import { 
  MasterCategory, 
  SubCategory, 
  FinalCategory, 
  Course, 
  BatchData, 
  Subject, 
  Topic, 
  Content,
  FullCourseContent,
  ApiResponse 
} from '@/types/api';

// Use Vercel API route in production, Supabase edge function in development
function getApiBaseUrl(): string {
  // In production (Vercel), use relative path to Vercel serverless function
  if (import.meta.env.PROD) {
    return '/api/study-api';
  }
  // In development, use Supabase edge function
  return `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/study-api`;
}

async function callApi<T>(params: Record<string, string>): Promise<T> {
  const queryString = new URLSearchParams(params).toString();
  const baseUrl = getApiBaseUrl();
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  // Only add Supabase auth header in development
  if (!import.meta.env.PROD) {
    headers['Authorization'] = `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`;
  }
  
  const response = await fetch(`${baseUrl}?${queryString}`, { headers });
  
  if (!response.ok) {
    throw new Error(`API request failed: ${response.statusText}`);
  }
  
  return response.json();
}

export async function fetchMasterCategories(): Promise<MasterCategory[]> {
  const data: ApiResponse<MasterCategory[]> = await callApi({ endpoint: 'master-categories' });
  return data.data;
}

export async function fetchSubCategories(masterId: number): Promise<SubCategory[]> {
  const data: ApiResponse<SubCategory[]> = await callApi({ 
    endpoint: 'subcategories',
    master_id: masterId.toString()
  });
  return data.data;
}

export async function fetchFinalCategories(subcatId: string): Promise<FinalCategory[]> {
  const data: ApiResponse<FinalCategory[]> = await callApi({ 
    endpoint: 'final-categories',
    subcat_id: subcatId
  });
  return data.data;
}

export async function fetchCourses(masterId: number, catId: string, subCatId: string): Promise<Course[]> {
  const data: ApiResponse<Course[]> = await callApi({ 
    endpoint: 'courses',
    master_id: masterId.toString(),
    cat_id: catId,
    sub_cat_id: subCatId
  });
  return data.data;
}

export async function fetchBatch(batchId: string): Promise<BatchData> {
  const data: ApiResponse<BatchData> = await callApi({ 
    endpoint: 'batch',
    batch_id: batchId
  });
  return data.data;
}

export async function fetchSubjects(courseId: string): Promise<Subject[]> {
  const data: ApiResponse<Subject[]> = await callApi({ 
    endpoint: 'subjects',
    course_id: courseId
  });
  return data.data;
}

export async function fetchTopics(courseId: string, subjectId: string): Promise<Topic[]> {
  const data: ApiResponse<Topic[]> = await callApi({ 
    endpoint: 'topics',
    course_id: courseId,
    subject_id: subjectId
  });
  return data.data;
}

export async function fetchContent(courseId: string, subjectId: string, topicId: string): Promise<Content[]> {
  const data: ApiResponse<Content[]> = await callApi({ 
    endpoint: 'content',
    course_id: courseId,
    subject_id: subjectId,
    topic_id: topicId
  });
  return data.data;
}

export async function fetchFullCourseContent(courseId: string): Promise<FullCourseContent> {
  const data: ApiResponse<FullCourseContent> = await callApi({ 
    endpoint: 'course-content',
    course_id: courseId
  });
  return data.data;
}
