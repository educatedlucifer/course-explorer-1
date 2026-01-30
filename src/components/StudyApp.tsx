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
  Target,
  Home,
  Zap,
  Library
} from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { TopicContentView } from './TopicContentView';
import { FullCourseContentView } from './FullCourseContentView';
import { ClassPlusBrowser } from './ClassPlusBrowser';
import { UnacademyBrowser } from './UnacademyBrowser';
import { 
  fetchMasterCategories, 
  fetchSubCategories, 
  fetchFinalCategories, 
  fetchCourses,
  fetchSubjects,
  fetchTopics,
  fetchContent,
  fetchFullCourseContent
} from '@/services/api';
import { 
  MasterCategory, 
  SubCategory, 
  FinalCategory, 
  Course,
  Subject,
  Topic,
  Content,
  FullCourseContent
} from '@/types/api';

type Step = 'welcome' | 'classplus' | 'unacademy' | 'master' | 'sub' | 'final' | 'courses' | 'subjects' | 'topics' | 'content' | 'all-content';

interface BreadcrumbItem {
  step: Step;
  label: string;
  id?: string | number;
}


export function StudyApp() {
  const [currentStep, setCurrentStep] = useState<Step>('welcome');
  const [loading, setLoading] = useState(false);
  
  // Data states
  const [masterCategories, setMasterCategories] = useState<MasterCategory[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [finalCategories, setFinalCategories] = useState<FinalCategory[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [contents, setContents] = useState<Content[]>([]);
  const [fullCourseContent, setFullCourseContent] = useState<FullCourseContent | null>(null);
  
  // Selected items
  const [selectedMaster, setSelectedMaster] = useState<MasterCategory | null>(null);
  const [selectedSub, setSelectedSub] = useState<SubCategory | null>(null);
  const [selectedFinal, setSelectedFinal] = useState<FinalCategory | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [selectedContent, setSelectedContent] = useState<Content | null>(null);

  // Breadcrumb
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([{ step: 'welcome', label: 'Home' }]);

  const loadMasterCategories = async () => {
    setLoading(true);
    const data = await fetchMasterCategories();
    setMasterCategories(data);
    setLoading(false);
  };

  const handleWelcomeClick = async () => {
    await loadMasterCategories();
    setCurrentStep('master');
    setBreadcrumbs([{ step: 'welcome', label: 'Home' }, { step: 'master', label: 'Categories' }]);
  };

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
    // Prevent stale selection from the previous topic making the list look "incomplete".
    setSelectedContent(null);
    const data = await fetchContent(selectedCourse.id, selectedSubject.id, topic.id);
    setContents(data);
    setCurrentStep('content');
    setBreadcrumbs(prev => [...prev.slice(0, 6), { step: 'content', label: topic.title, id: topic.id }]);
    setLoading(false);
  };

  const handleContentSelect = (content: Content) => {
    setSelectedContent(content);
  };

  const handleViewAllContent = async () => {
    if (!selectedCourse) return;
    setLoading(true);
    setSelectedContent(null);
    try {
      const data = await fetchFullCourseContent(selectedCourse.id);
      setFullCourseContent(data);
      setCurrentStep('all-content');
      setBreadcrumbs(prev => [...prev.slice(0, 5), { step: 'all-content', label: 'All Content', id: 'all' }]);
    } catch (error) {
      console.error('Failed to fetch full course content:', error);
    }
    setLoading(false);
  };

  const goBack = () => {
    if (currentStep === 'master') {
      setCurrentStep('welcome');
      setBreadcrumbs([{ step: 'welcome', label: 'Home' }]);
    } else if (currentStep === 'sub') {
      setCurrentStep('master');
      setBreadcrumbs(prev => prev.slice(0, 2));
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
    } else if (currentStep === 'all-content') {
      setCurrentStep('subjects');
      setBreadcrumbs(prev => prev.slice(0, 5));
      setSelectedContent(null);
      setFullCourseContent(null);
    }
  };

  const goToStep = (step: Step, index: number) => {
    setCurrentStep(step);
    setBreadcrumbs(prev => prev.slice(0, index + 1));
    if (step === 'welcome') {
      setSelectedMaster(null);
      setSelectedSub(null);
      setSelectedFinal(null);
      setSelectedCourse(null);
      setSelectedSubject(null);
      setSelectedTopic(null);
      setSelectedContent(null);
    } else if (step === 'master') {
      loadMasterCategories();
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
      case 'welcome': return 'Welcome';
      case 'unacademy': return 'Unacademy';
      case 'master': return 'Choose Your Exam Category';
      case 'sub': return 'Select Region / Stream';
      case 'final': return 'Select Your Exam';
      case 'courses': return 'Available Courses';
      case 'subjects': return 'Course Subjects';
      case 'topics': return 'Topics';
      case 'content': return 'Study Materials';
      case 'all-content': return 'All Course Content';
      default: return '';
    }
  };

  const getStepDescription = () => {
    switch (currentStep) {
      case 'welcome': return '';
      case 'unacademy': return 'Explore Unacademy Advance';
      case 'master': return 'Start your preparation journey by selecting your target examination category';
      case 'sub': return 'Choose your preferred region or exam stream';
      case 'final': return 'Select the specific exam you want to prepare for';
      case 'courses': return 'Browse through our comprehensive course catalog';
      case 'subjects': return 'Explore subjects in this course';
      case 'topics': return 'Select a topic to start learning';
      case 'content': return 'Access video lectures and study materials';
      case 'all-content': return 'Browse all videos and PDFs in this course';
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
    <div className="min-h-screen bg-background relative overflow-x-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 bg-mesh-gradient pointer-events-none" />
      <div className="fixed top-1/3 left-1/4 w-[600px] h-[600px] bg-primary/15 rounded-full blur-[150px] pointer-events-none animate-pulse" />
      <div className="fixed bottom-1/3 right-1/4 w-[500px] h-[500px] bg-secondary/15 rounded-full blur-[130px] pointer-events-none animate-pulse" style={{ animationDelay: '1s' }} />
      <div className="fixed top-1/2 left-1/2 w-[400px] h-[400px] bg-accent/10 rounded-full blur-[100px] pointer-events-none animate-pulse" style={{ animationDelay: '2s' }} />
      
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 glass-strong border-b border-border/50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <motion.div 
              className="flex items-center gap-3 cursor-pointer"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={() => goToStep('welcome', 0)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary via-secondary to-accent flex items-center justify-center glow-primary">
                <GraduationCap className="w-6 h-6 text-primary-foreground" />
              </div>
              <span className="font-display text-xl font-bold text-gradient">StudyHub</span>
            </motion.div>
            
            <motion.div 
              className="flex items-center gap-2 text-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20">
                <Zap className="w-4 h-4 text-accent" />
                <span className="text-accent font-medium">India's #1 Learning Platform</span>
              </div>
            </motion.div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 pt-24 pb-12 min-h-screen">
        <div className="container mx-auto px-4">
          
          {/* Enhanced Breadcrumb Navigation - Hidden on welcome */}
          {currentStep !== 'welcome' && (
            <motion.div 
              className="mb-8"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-center gap-1 p-2 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50 overflow-x-auto">
                {/* Home Button */}
                <motion.button
                  onClick={() => goToStep('welcome', 0)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all duration-300 flex-shrink-0 text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Home className="w-4 h-4" />
                  <span className="hidden sm:inline">Home</span>
                </motion.button>

                {breadcrumbs.slice(1).map((crumb, index) => (
                  <div key={index} className="flex items-center gap-1 flex-shrink-0">
                    <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
                    <motion.button
                      onClick={() => goToStep(crumb.step, index + 1)}
                      className={`px-4 py-2.5 rounded-xl font-medium transition-all duration-300 max-w-[200px] truncate ${
                        index === breadcrumbs.length - 2
                          ? 'bg-gradient-to-r from-primary to-secondary text-primary-foreground shadow-lg'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                      }`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {crumb.label}
                    </motion.button>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Back Button & Title - Hidden on welcome */}
          {currentStep !== 'welcome' && (
            <div className="mb-10">
              <div className="flex items-center gap-4 mb-4">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                >
                  <motion.button 
                    onClick={goBack}
                    className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-muted/80 to-muted/50 border border-border/50 text-foreground font-medium hover:from-primary/20 hover:to-secondary/20 hover:border-primary/30 transition-all duration-300 group"
                    whileHover={{ scale: 1.02, x: -3 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                    <span>Go Back</span>
                  </motion.button>
                </motion.div>
              </div>
              
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-3 text-gradient-vibrant">
                  {getStepTitle()}
                </h1>
                <p className="text-muted-foreground text-lg max-w-2xl">
                  {getStepDescription()}
                </p>
              </motion.div>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-20">
              <motion.div 
                className="flex flex-col items-center gap-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <div className="w-14 h-14 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
                <p className="text-muted-foreground font-medium">Loading amazing content...</p>
              </motion.div>
            </div>
          )}

          {/* Content */}
          {!loading && (
            <AnimatePresence mode="wait">
              {/* Welcome Cards */}
              {currentStep === 'welcome' && (
                <motion.div
                  key="welcome"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="flex flex-col items-center justify-center min-h-[60vh]"
                >
                  <div className="flex flex-col md:flex-row flex-wrap items-center justify-center gap-6">
                    {/* Utkarsh Card */}
                    <motion.div
                      whileHover={{ scale: 1.05, y: -10 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleWelcomeClick}
                      className="cursor-pointer"
                    >
                      <Card variant="interactive" className="w-80 md:w-96 overflow-hidden group">
                        <div className="relative h-48 bg-gradient-to-br from-primary via-secondary to-accent flex items-center justify-center">
                          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.15),transparent)]" />
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.3, type: "spring" }}
                            className="w-24 h-24 rounded-full bg-card/20 backdrop-blur-sm border-2 border-white/30 flex items-center justify-center"
                          >
                            <span className="text-4xl font-bold text-white">U</span>
                          </motion.div>
                        </div>
                        
                        <CardContent className="text-center py-6 space-y-4">
                          <h2 className="text-2xl md:text-3xl font-bold text-gradient">
                            Utkarsh
                          </h2>
                          <p className="text-muted-foreground">
                            Your Gateway to Success
                          </p>
                          <div className="flex items-center justify-center gap-2 text-primary">
                            <span className="text-sm font-medium">Click to Explore Courses</span>
                            <ChevronRight className="w-4 h-4 animate-pulse" />
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>

                    {/* ClassPlus Card */}
                    <motion.div
                      whileHover={{ scale: 1.05, y: -10 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setCurrentStep('classplus')}
                      className="cursor-pointer"
                    >
                      <Card variant="interactive" className="w-80 md:w-96 overflow-hidden group">
                        <div className="relative h-48 bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600 flex items-center justify-center">
                          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.15),transparent)]" />
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.4, type: "spring" }}
                            className="w-24 h-24 rounded-full bg-card/20 backdrop-blur-sm border-2 border-white/30 flex items-center justify-center"
                          >
                            <GraduationCap className="w-12 h-12 text-white" />
                          </motion.div>
                        </div>
                        
                        <CardContent className="text-center py-6 space-y-4">
                          <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                            ClassPlus
                          </h2>
                          <p className="text-muted-foreground">
                            Access Your Courses Anywhere
                          </p>
                          <div className="flex items-center justify-center gap-2 text-blue-600">
                            <span className="text-sm font-medium">Click to Browse</span>
                            <ChevronRight className="w-4 h-4 animate-pulse" />
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>

                    {/* Unacademy Card */}
                    <motion.div
                      whileHover={{ scale: 1.05, y: -10 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setCurrentStep('unacademy')}
                      className="cursor-pointer"
                    >
                      <Card variant="interactive" className="w-80 md:w-96 overflow-hidden group">
                        <div className="relative h-48 bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 flex items-center justify-center">
                          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.15),transparent)]" />
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.5, type: "spring" }}
                            className="w-24 h-24 rounded-full bg-card/20 backdrop-blur-sm border-2 border-white/30 flex items-center justify-center"
                          >
                            <span className="text-4xl font-bold text-white">UA</span>
                          </motion.div>
                        </div>

                        <CardContent className="text-center py-6 space-y-4">
                          <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-emerald-600 to-cyan-600 bg-clip-text text-transparent">
                            Unacademy
                          </h2>
                          <p className="text-muted-foreground">
                            Explore Unacademy Advance
                          </p>
                          <div className="flex items-center justify-center gap-2 text-emerald-600">
                            <span className="text-sm font-medium">Click to Open</span>
                            <ChevronRight className="w-4 h-4 animate-pulse" />
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  </div>
                  
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="mt-8 text-muted-foreground text-center"
                  >
                    Tap a card to begin your learning journey
                  </motion.p>
                </motion.div>
              )}

              {/* ClassPlus Browser */}
              {currentStep === 'classplus' && (
                <motion.div
                  key="classplus"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-50 overflow-y-auto"
                >
                  <ClassPlusBrowser onBack={() => setCurrentStep('welcome')} />
                </motion.div>
              )}

              {/* Unacademy Browser */}
              {currentStep === 'unacademy' && (
                <motion.div
                  key="unacademy"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-50 overflow-y-auto"
                >
                  <UnacademyBrowser onBack={() => setCurrentStep('welcome')} />
                </motion.div>
              )}

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
                  {masterCategories.map((cat, index) => (
                    <motion.div key={cat.id} variants={itemVariants}>
                      <motion.div
                        className="group cursor-pointer h-full rounded-2xl bg-gradient-to-br from-card via-card to-muted/30 border border-border/50 hover:border-primary/50 transition-all duration-500 overflow-hidden relative"
                        onClick={() => handleMasterSelect(cat)}
                        whileHover={{ scale: 1.03, y: -5 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {/* Gradient overlay on hover */}
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/0 via-secondary/0 to-accent/0 group-hover:from-primary/10 group-hover:via-secondary/5 group-hover:to-accent/10 transition-all duration-500" />
                        
                        <div className="p-6 flex flex-col items-center text-center relative z-10">
                          <motion.div 
                            className="text-5xl mb-4 drop-shadow-lg"
                            whileHover={{ scale: 1.3, rotate: [0, -15, 15, 0] }}
                            transition={{ duration: 0.5 }}
                          >
                            {getCategoryIcon(cat.name)}
                          </motion.div>
                          <h3 className="font-semibold text-sm group-hover:text-primary transition-colors">
                            {cat.name}
                          </h3>
                          <div className="mt-3 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-all">
                            <ChevronRight className="w-4 h-4 text-primary group-hover:translate-x-0.5 transition-transform" />
                          </div>
                        </div>
                      </motion.div>
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
                  {subCategories.map((cat, index) => (
                    <motion.div key={cat.id} variants={itemVariants}>
                      <motion.div
                        className="group cursor-pointer rounded-xl bg-gradient-to-r from-card to-muted/20 border border-border/50 hover:border-accent/50 transition-all duration-300 overflow-hidden"
                        onClick={() => handleSubSelect(cat)}
                        whileHover={{ scale: 1.02, x: 5 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="p-5 flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center flex-shrink-0 group-hover:from-accent/30 group-hover:to-accent/10 transition-all">
                            <Target className="w-6 h-6 text-accent" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-sm group-hover:text-accent transition-colors truncate">
                              {cat.name}
                            </h3>
                          </div>
                          <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-accent group-hover:translate-x-1 transition-all flex-shrink-0" />
                        </div>
                      </motion.div>
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
                        <div className="relative aspect-video overflow-hidden bg-muted">
                          {course.cover_image ? (
                            <img
                              src={course.cover_image}
                              alt={course.title}
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                              <BookOpen className="w-16 h-16 text-primary/30" />
                            </div>
                          )}
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
                <div className="space-y-6">
                  {/* View All Content Button */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-center"
                  >
                    <Button
                      variant="hero"
                      size="lg"
                      onClick={handleViewAllContent}
                      className="gap-3"
                    >
                      <Library className="w-5 h-5" />
                      View All Course Content
                      <span className="text-xs opacity-80">(Videos + PDFs)</span>
                    </Button>
                  </motion.div>

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
                </div>
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
                <TopicContentView
                  contents={contents}
                  selectedContent={selectedContent}
                  onSelectContent={handleContentSelect}
                />
              )}

              {/* All Course Content */}
              {currentStep === 'all-content' && fullCourseContent && (
                <FullCourseContentView
                  courseContent={fullCourseContent}
                  selectedContent={selectedContent}
                  onSelectContent={handleContentSelect}
                />
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
