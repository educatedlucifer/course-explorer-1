export interface MasterCategory {
  id: number;
  name: string;
}

export interface SubCategory {
  id: string;
  name: string;
}

export interface FinalCategory {
  id: string;
  name: string;
}

export interface Course {
  id: string;
  title: string;
  cover_image?: string;
  selling_price?: number;
  mrp?: number;
  validity?: number;
  info?: string;
}

export interface BatchData {
  type: string;
  courses: Course[];
}

export interface Subject {
  id: string;
  title: string;
}

export interface Topic {
  id: string;
  title: string;
}

export interface Content {
  id: string;
  title: string;
  url: string;
}

// Full course structure returned by course-content endpoint
export interface CourseContentTopic {
  id: string;
  name: string;
  contents: Content[];
}

export interface CourseContentSubject {
  id: string;
  name: string;
  topics: CourseContentTopic[];
}

export interface FullCourseContent {
  course_id: string;
  subjects: CourseContentSubject[];
}

export interface ApiResponse<T> {
  status: string;
  data: T;
  count?: number;
}
