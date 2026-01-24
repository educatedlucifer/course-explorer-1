import { supabase } from '@/integrations/supabase/client';
import { 
  MasterCategory, 
  SubCategory, 
  FinalCategory, 
  Course, 
  BatchData, 
  Subject, 
  Topic, 
  Content,
  ApiResponse 
} from '@/types/api';

async function callApi<T>(params: Record<string, string>): Promise<T> {
  const queryString = new URLSearchParams(params).toString();
  
  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/study-api?${queryString}`,
    {
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        'Content-Type': 'application/json',
      },
    }
  );
  
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
