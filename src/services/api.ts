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

const BATCHES_API = 'https://utk-batches-apih-45a803b3037e.herokuapp.com/api';
const WEB_API = 'https://utk-web-api-5163e92c9014.herokuapp.com/api';

export async function fetchMasterCategories(): Promise<MasterCategory[]> {
  const response = await fetch(`${BATCHES_API}/master-categories`);
  const data: ApiResponse<MasterCategory[]> = await response.json();
  return data.data;
}

export async function fetchSubCategories(masterId: number): Promise<SubCategory[]> {
  const response = await fetch(`${BATCHES_API}/subcategories?master_id=${masterId}`);
  const data: ApiResponse<SubCategory[]> = await response.json();
  return data.data;
}

export async function fetchFinalCategories(subcatId: string): Promise<FinalCategory[]> {
  const response = await fetch(`${BATCHES_API}/final-categories?subcat_id=${subcatId}`);
  const data: ApiResponse<FinalCategory[]> = await response.json();
  return data.data;
}

export async function fetchCourses(masterId: number, catId: string, subCatId: string): Promise<Course[]> {
  const response = await fetch(
    `${BATCHES_API}/courses?master_id=${masterId}&cat_id=${catId}&sub_cat_id=${subCatId}`
  );
  const data: ApiResponse<Course[]> = await response.json();
  return data.data;
}

export async function fetchBatch(batchId: string): Promise<BatchData> {
  const response = await fetch(`${WEB_API}/batch/${batchId}`);
  const data: ApiResponse<BatchData> = await response.json();
  return data.data;
}

export async function fetchSubjects(courseId: string): Promise<Subject[]> {
  const response = await fetch(`${WEB_API}/course/${courseId}/subjects`);
  const data: ApiResponse<Subject[]> = await response.json();
  return data.data;
}

export async function fetchTopics(courseId: string, subjectId: string): Promise<Topic[]> {
  const response = await fetch(`${WEB_API}/course/${courseId}/subject/${subjectId}/topics`);
  const data: ApiResponse<Topic[]> = await response.json();
  return data.data;
}

export async function fetchContent(courseId: string, subjectId: string, topicId: string): Promise<Content[]> {
  const response = await fetch(
    `${WEB_API}/course/${courseId}/subject/${subjectId}/topic/${topicId}/content`
  );
  const data: ApiResponse<Content[]> = await response.json();
  return data.data;
}
