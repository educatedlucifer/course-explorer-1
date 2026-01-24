import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  BookOpen, 
  GraduationCap, 
  Sparkles,
  ChevronRight,
  Video,
  FileText,
  Clock,
  Star,
  Play,
  Layers,
  Target
} from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { 
  fetchMasterCategories, 
  fetchSubCategories, 
  fetchFinalCategories, 
  fetchCourses,
  fetchSubjects,
  fetchTopics,
  fetchContent
} from '@/services/api';
import { 
  MasterCategory, 
  SubCategory, 
  FinalCategory, 
  Course,
  Subject,
  Topic,
  Content
} from '@/types/api';

type Step = 'master' | 'sub' | 'final' | 'courses' | 'subjects' | 'topics' | 'content';

interface BreadcrumbItem {
  step: Step;
  label: string;
  id?: string | number;
}

export function StudyApp() {
  const [currentStep, setCurrentStep] = useState<Step>('master');
  const [loading, setLoading] = useState(false);
  
  // Data states
  const [masterCategories, setMasterCategories] = useState<MasterCategory[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [finalCategories, setFinalCategories] = useState<FinalCategory[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [contents, setContents] = useState<Content[]>([]);
  
  // Selected items
  const [selectedMaster, setSelectedMaster] = useState<MasterCategory | null>(null);
  const [selectedSub, setSelectedSub] = useState<SubCategory | null>(null);
  const [selectedFinal, setSelectedFinal] = useState<FinalCategory | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [selectedContent, setSelectedContent] = useState<Content | null>(null);

  // Breadcrumb
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([{ step: 'master', label: 'Categories' }]);

  useEffect(() => {
    setLoading(true);
    fetchMasterCategories()
      .then(setMasterCategories)
      .finally(() => setLoading(false));
  }, []);

  const handleMasterSelect = async (cat: MasterCategory) => {
    setLoading(true);
    setSelectedMaster(cat);
    const data = await fetchSubCategories(cat.id);
    setSubCategories(data);
    setCurrentStep('sub');
    setBreadcrumbs([
      { step: 'master', label: 'Categories' },
      { step: 'sub', label: cat.name, id: cat.id }
    ]);
    setLoading(false);
  };

  const handleSubSelect = async (cat: SubCategory) => {
    if (!selectedMaster) return;
    setLoading(true);
    setSelectedSub(cat);
    const data = await fetchFinalCategories(cat.id);
    setFinalCategories(data);
    setCurrentStep('final');
    setBreadcrumbs(prev => [...prev.slice(0, 2), { step: 'final', label: cat.name, id: cat.id }]);
    setLoading(false);
  };

  const handleFinalSelect = async (cat: FinalCategory) => {
    if (!selectedMaster || !selectedSub) return;
    setLoading(true);
    setSelectedFinal(cat);
    const data = await fetchCourses(selectedMaster.id, selectedSub.id, cat.id);
    setCourses(data);
    setCurrentStep('courses');
    setBreadcrumbs(prev => [...prev.slice(0, 3), { step: 'courses', label: cat.name, id: cat.id }]);
    setLoading(false);
  };

  const handleCourseSelect = async (course: Course) => {
    setLoading(true);
    setSelectedCourse(course);
    const data = await fetchSubjects(course.id);
    setSubjects(data);
    setCurrentStep('subjects');
    setBreadcrumbs(prev => [...prev.slice(0, 4), { step: 'subjects', label: course.title, id: course.id }]);
    setLoading(false);
  };

  const handleSubjectSelect = async (subject: Subject) => {
    if (!selectedCourse) return;
    setLoading(true);
    setSelectedSubject(subject);
    const data = await fetchTopics(selectedCourse.id, subject.id);
    setTopics(data);
    setCurrentStep('topics');
    setBreadcrumbs(prev => [...prev.slice(0, 5), { step: 'topics', label: subject.title, id: subject.id }]);
    setLoading(false);
  };

  const handleTopicSelect = async (topic: Topic) => {
    if (!selectedCourse || !selectedSubject) return;
    setLoading(true);
    setSelectedTopic(topic);
    const data = await fetchContent(selectedCourse.id, selectedSubject.id, topic.id);
    setContents(data);
    setCurrentStep('content');
    setBreadcrumbs(prev => [...prev.slice(0, 6), { step: 'content', label: topic.title, id: topic.id }]);
    setLoading(false);
  };

  const handleContentSelect = (content: Content) => {
    setSelectedContent(content);
  };

  const goBack = () => {
    if (currentStep === 'sub') {
      setCurrentStep('master');
      setBreadcrumbs([{ step: 'master', label: 'Categories' }]);
    } else if (currentStep === 'final') {
      setCurrentStep('sub');
      setBreadcrumbs(prev => prev.slice(0, 2));
    } else if (currentStep === 'courses') {
      setCurrentStep('final');
      setBreadcrumbs(prev => prev.slice(0, 3));
    } else if (currentStep === 'subjects') {
      setCurrentStep('courses');
      setBreadcrumbs(prev => prev.slice(0, 4));
    } else if (currentStep === 'topics') {
      setCurrentStep('subjects');
      setBreadcrumbs(prev => prev.slice(0, 5));
    } else if (currentStep === 'content') {
      setCurrentStep('topics');
      setBreadcrumbs(prev => prev.slice(0, 6));
      setSelectedContent(null);
    }
  };

  const goToStep = (step: Step, index: number) => {
    setCurrentStep(step);
    setBreadcrumbs(prev => prev.slice(0, index + 1));
    if (step === 'master') {
      setSelectedMaster(null);
      setSelectedSub(null);
      setSelectedFinal(null);
      setSelectedCourse(null);
      setSelectedSubject(null);
      setSelectedTopic(null);
      setSelectedContent(null);
    }
  };

  const getCategoryIcon = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('teaching') || lower.includes('teacher')) return '📚';
    if (lower.includes('civil') || lower.includes('upsc')) return '⚖️';
    if (lower.includes('nursing') || lower.includes('health')) return '🏥';
    if (lower.includes('agriculture')) return '🌾';
    if (lower.includes('school')) return '🎓';
    if (lower.includes('college') || lower.includes('university')) return '🏛️';
    if (lower.includes('bank') || lower.includes('finance')) return '🏦';
    if (lower.includes('railway') || lower.includes('rrb')) return '🚂';
    if (lower.includes('ssc') || lower.includes('staff')) return '📋';
    if (lower.includes('police') || lower.includes('defence')) return '🛡️';
    return '📖';
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 'master': return 'Choose Your Exam Category';
      case 'sub': return 'Select Region / Stream';
      case 'final': return 'Select Your Exam';
      case 'courses': return 'Available Courses';
      case 'subjects': return 'Course Subjects';
      case 'topics': return 'Topics';
      case 'content': return 'Study Materials';
      default: return '';
    }
  };

  const getStepDescription = () => {
    switch (currentStep) {
      case 'master': return 'Start your preparation journey by selecting your target examination category';
      case 'sub': return 'Choose your preferred region or exam stream';
      case 'final': return 'Select the specific exam you want to prepare for';
      case 'courses': return 'Browse through our comprehensive course catalog';
      case 'subjects': return 'Explore subjects in this course';
      case 'topics': return 'Select a topic to start learning';
      case 'content': return 'Access video lectures and study materials';
      default: return '';
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    },
    exit: { opacity: 0, x: -50 }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: { type: 'spring' as const, stiffness: 300, damping: 24 }
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 bg-mesh-gradient pointer-events-none" />
      <div className="fixed top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-1/4 right-1/4 w-[400px] h-[400px] bg-accent/10 rounded-full blur-[100px] pointer-events-none" />
      
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 glass-strong border-b border-border/50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <motion.div 
              className="flex items-center gap-3"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-display text-xl font-bold text-gradient">StudyHub</span>
            </motion.div>
            
            <motion.div 
              className="flex items-center gap-2 text-sm text-muted-foreground"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <Sparkles className="w-4 h-4 text-accent" />
              <span>India's #1 Learning Platform</span>
            </motion.div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 pt-24 pb-12 min-h-screen">
        <div className="container mx-auto px-4">
          {/* Breadcrumbs */}
          <motion.div 
            className="flex items-center gap-2 mb-8 flex-wrap"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {breadcrumbs.map((crumb, index) => (
              <div key={index} className="flex items-center gap-2">
                {index > 0 && <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                <button
                  onClick={() => goToStep(crumb.step, index)}
                  className={`text-sm transition-colors ${
                    index === breadcrumbs.length - 1 
                      ? 'text-primary font-medium' 
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {crumb.label}
                </button>
              </div>
            ))}
          </motion.div>

          {/* Back Button & Title */}
          <div className="mb-10">
            {currentStep !== 'master' && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <Button 
                  variant="ghost" 
                  onClick={goBack}
                  className="mb-4 -ml-2 text-muted-foreground hover:text-foreground"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              </motion.div>
            )}
            
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-3">
                {getStepTitle()}
              </h1>
              <p className="text-muted-foreground text-lg max-w-2xl">
                {getStepDescription()}
              </p>
            </motion.div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-20">
              <motion.div 
                className="flex flex-col items-center gap-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <div className="w-12 h-12 border-3 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-muted-foreground">Loading...</p>
              </motion.div>
            </div>
          )}

          {/* Content */}
          {!loading && (
            <AnimatePresence mode="wait">
              {/* Master Categories */}
              {currentStep === 'master' && (
                <motion.div
                  key="master"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
                >
                  {masterCategories.map((cat) => (
                    <motion.div key={cat.id} variants={itemVariants}>
                      <Card 
                        variant="interactive"
                        className="group cursor-pointer h-full"
                        onClick={() => handleMasterSelect(cat)}
                      >
                        <CardContent className="p-6 flex flex-col items-center text-center">
                          <motion.div 
                            className="text-5xl mb-4"
                            whileHover={{ scale: 1.2, rotate: [0, -10, 10, 0] }}
                            transition={{ duration: 0.4 }}
                          >
                            {getCategoryIcon(cat.name)}
                          </motion.div>
                          <h3 className="font-semibold text-sm group-hover:text-primary transition-colors">
                            {cat.name}
                          </h3>
                          <ChevronRight className="w-4 h-4 mt-3 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </motion.div>
              )}

              {/* Sub Categories */}
              {currentStep === 'sub' && (
                <motion.div
                  key="sub"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
                >
                  {subCategories.map((cat) => (
                    <motion.div key={cat.id} variants={itemVariants}>
                      <Card 
                        variant="interactive"
                        className="group cursor-pointer"
                        onClick={() => handleSubSelect(cat)}
                      >
                        <CardContent className="p-5 flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0">
                            <Target className="w-6 h-6 text-accent" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-sm group-hover:text-primary transition-colors truncate">
                              {cat.name}
                            </h3>
                          </div>
                          <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all flex-shrink-0" />
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </motion.div>
              )}

              {/* Final Categories */}
              {currentStep === 'final' && (
                <motion.div
                  key="final"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
                >
                  {finalCategories.map((cat) => (
                    <motion.div key={cat.id} variants={itemVariants}>
                      <Card 
                        variant="interactive"
                        className="group cursor-pointer"
                        onClick={() => handleFinalSelect(cat)}
                      >
                        <CardContent className="p-5 flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <Layers className="w-6 h-6 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-sm group-hover:text-primary transition-colors truncate">
                              {cat.name}
                            </h3>
                          </div>
                          <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all flex-shrink-0" />
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </motion.div>
              )}

              {/* Courses */}
              {currentStep === 'courses' && (
                <motion.div
                  key="courses"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                  {courses.map((course) => (
                    <motion.div key={course.id} variants={itemVariants}>
                      <Card 
                        variant="interactive"
                        className="group cursor-pointer overflow-hidden h-full"
                        onClick={() => handleCourseSelect(course)}
                      >
                        {/* Course Image */}
                        <div className="relative h-48 overflow-hidden">
                          {course.cover_image ? (
                            <img
                              src={course.cover_image}
                              alt={course.title}
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                              <BookOpen className="w-16 h-16 text-primary/30" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-card via-card/20 to-transparent" />
                        </div>

                        <CardContent className="p-5 space-y-4">
                          <h3 className="font-semibold text-lg line-clamp-2 group-hover:text-primary transition-colors">
                            {course.title}
                          </h3>

                          {/* Stats */}
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1.5">
                              <Video className="w-4 h-4 text-primary" />
                              <span>HD Videos</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <FileText className="w-4 h-4 text-accent" />
                              <span>PDF Notes</span>
                            </div>
                          </div>

                          {/* Rating */}
                          <div className="flex items-center gap-2">
                            <div className="flex">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star key={star} className="w-4 h-4 text-accent fill-accent" />
                              ))}
                            </div>
                            <span className="text-sm text-muted-foreground">(4.8)</span>
                          </div>

                          {/* Price */}
                          <div className="flex items-center justify-between pt-4 border-t border-border">
                            <div>
                              {course.selling_price && (
                                <div className="flex items-center gap-2">
                                  <span className="text-xl font-bold text-primary">₹{course.selling_price}</span>
                                  {course.mrp && course.mrp > course.selling_price && (
                                    <span className="text-sm text-muted-foreground line-through">₹{course.mrp}</span>
                                  )}
                                </div>
                              )}
                              {course.validity && (
                                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                                  <Clock className="w-3 h-3" />
                                  <span>{course.validity} days validity</span>
                                </div>
                              )}
                            </div>
                            <Button variant="hero" size="sm">
                              Explore
                              <ChevronRight className="w-4 h-4 ml-1" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </motion.div>
              )}

              {/* Subjects */}
              {currentStep === 'subjects' && (
                <motion.div
                  key="subjects"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
                >
                  {subjects.map((subject, index) => (
                    <motion.div key={subject.id} variants={itemVariants}>
                      <Card 
                        variant="interactive"
                        className="group cursor-pointer"
                        onClick={() => handleSubjectSelect(subject)}
                      >
                        <CardContent className="p-5">
                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center flex-shrink-0">
                              <span className="font-bold text-primary">{index + 1}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold group-hover:text-primary transition-colors line-clamp-2">
                                {subject.title}
                              </h3>
                            </div>
                          </div>
                          <div className="flex items-center justify-end mt-4">
                            <span className="text-sm text-muted-foreground group-hover:text-primary transition-colors flex items-center gap-1">
                              View Topics
                              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </motion.div>
              )}

              {/* Topics */}
              {currentStep === 'topics' && (
                <motion.div
                  key="topics"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="space-y-3"
                >
                  {topics.map((topic, index) => (
                    <motion.div key={topic.id} variants={itemVariants}>
                      <Card 
                        variant="interactive"
                        className="group cursor-pointer"
                        onClick={() => handleTopicSelect(topic)}
                      >
                        <CardContent className="p-4 flex items-center gap-4">
                          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 text-sm font-medium">
                            {index + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium group-hover:text-primary transition-colors truncate">
                              {topic.title}
                            </h3>
                          </div>
                          <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all flex-shrink-0" />
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </motion.div>
              )}

              {/* Content */}
              {currentStep === 'content' && (
                <div className="grid lg:grid-cols-3 gap-6">
                  {/* Content List */}
                  <motion.div
                    key="content-list"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className={`space-y-3 ${selectedContent ? 'lg:col-span-1' : 'lg:col-span-3'}`}
                  >
                    {contents.map((content, index) => (
                      <motion.div key={content.id} variants={itemVariants}>
                        <Card 
                          variant="interactive"
                          className={`group cursor-pointer ${selectedContent?.id === content.id ? 'border-primary bg-primary/5' : ''}`}
                          onClick={() => handleContentSelect(content)}
                        >
                          <CardContent className="p-4 flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                              selectedContent?.id === content.id 
                                ? 'bg-primary text-primary-foreground' 
                                : 'bg-primary/10'
                            }`}>
                              <Play className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className={`font-medium truncate ${
                                selectedContent?.id === content.id ? 'text-primary' : 'group-hover:text-primary'
                              } transition-colors`}>
                                {content.title}
                              </h3>
                              <p className="text-xs text-muted-foreground">Video Lecture</p>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </motion.div>

                  {/* Video Player */}
                  {selectedContent && (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="lg:col-span-2 lg:sticky lg:top-24 h-fit"
                    >
                      <Card className="overflow-hidden">
                        <div className="aspect-video bg-black">
                          <iframe
                            src={selectedContent.url}
                            title={selectedContent.title}
                            className="w-full h-full"
                            allowFullScreen
                          />
                        </div>
                        <CardContent className="p-4">
                          <h2 className="font-semibold text-lg">{selectedContent.title}</h2>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )}
                </div>
              )}

              {/* Empty State */}
              {!loading && ((currentStep === 'courses' && courses.length === 0) ||
                (currentStep === 'subjects' && subjects.length === 0) ||
                (currentStep === 'topics' && topics.length === 0) ||
                (currentStep === 'content' && contents.length === 0)) && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-20"
                >
                  <BookOpen className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
                  <h3 className="font-semibold text-xl mb-2">No Content Available</h3>
                  <p className="text-muted-foreground">Try selecting a different option.</p>
                  <Button variant="outline" className="mt-6" onClick={goBack}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Go Back
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>
      </main>
    </div>
  );
}
