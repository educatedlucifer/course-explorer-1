import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  Home, 
  Target, 
  GraduationCap, 
  ChevronRight, 
  Video, 
  FileText, 
  Play, 
  Download,
  Calendar,
  User,
  Search,
  ExternalLink,
  Loader2
} from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';

interface UnacademyBrowserProps {
  onBack: () => void;
}

interface Goal {
  uid: string;
  name: string;
}

interface Batch {
  uid: string;
  name: string;
  cover_photo?: string;
  languages?: { label: string }[];
}

interface Lesson {
  id: string;
  title: string;
  date: string;
  videoUrl: string;
  pdfUrl: string;
  author: string;
}

type Step = 'goals' | 'batches' | 'lessons';

function getApiBaseUrl(): string {
  if (import.meta.env.PROD) {
    return '/api/study-api';
  }
  return `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/study-api`;
}

async function callApi<T>(params: Record<string, string>): Promise<T> {
  const queryString = new URLSearchParams(params).toString();
  const baseUrl = getApiBaseUrl();
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  if (!import.meta.env.PROD) {
    headers['Authorization'] = `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`;
  }
  
  const response = await fetch(`${baseUrl}?${queryString}`, { headers });
  
  if (!response.ok) {
    throw new Error(`API request failed: ${response.statusText}`);
  }
  
  return response.json();
}

export function UnacademyBrowser({ onBack }: UnacademyBrowserProps) {
  const [currentStep, setCurrentStep] = useState<Step>('goals');
  const [loading, setLoading] = useState(false);
  
  // Data
  const [goals, setGoals] = useState<Goal[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  
  // Selected
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
  
  // Pagination
  const [batchOffset, setBatchOffset] = useState(0);
  const [hasMoreBatches, setHasMoreBatches] = useState(false);
  
  // Search
  const [goalSearch, setGoalSearch] = useState('');
  const [lessonSearch, setLessonSearch] = useState('');

  useEffect(() => {
    loadGoals();
  }, []);

  const loadGoals = async () => {
    setLoading(true);
    try {
      const response = await callApi<{ data: Goal[] }>({ endpoint: 'unacademy-goals' });
      setGoals(response.data || []);
    } catch (error) {
      console.error('Failed to load goals:', error);
    }
    setLoading(false);
  };

  const selectGoal = async (goal: Goal) => {
    setSelectedGoal(goal);
    setBatchOffset(0);
    setCurrentStep('batches');
    await loadBatches(goal.uid, 0);
  };

  const loadBatches = async (goalId: string, offset: number) => {
    setLoading(true);
    try {
      const response = await callApi<{ data: { results: Batch[]; next: string | null } }>({ 
        endpoint: 'unacademy-batches',
        goal_id: goalId,
        offset: offset.toString(),
        limit: '20'
      });
      const newBatches = response.data?.results || [];
      setBatches(offset === 0 ? newBatches : [...batches, ...newBatches]);
      setHasMoreBatches(!!response.data?.next);
      setBatchOffset(offset);
    } catch (error) {
      console.error('Failed to load batches:', error);
    }
    setLoading(false);
  };

  const selectBatch = async (batch: Batch) => {
    setSelectedBatch(batch);
    setCurrentStep('lessons');
    await loadLessons(batch.uid);
  };

  const loadLessons = async (batchId: string) => {
    setLoading(true);
    try {
      const response = await callApi<{ data: { lessons: Lesson[] } }>({ 
        endpoint: 'unacademy-schedule',
        batch_id: batchId
      });
      setLessons(response.data?.lessons || []);
    } catch (error) {
      console.error('Failed to load lessons:', error);
    }
    setLoading(false);
  };

  const goBack = () => {
    if (currentStep === 'lessons') {
      setCurrentStep('batches');
      setSelectedBatch(null);
      setLessons([]);
    } else if (currentStep === 'batches') {
      setCurrentStep('goals');
      setSelectedGoal(null);
      setBatches([]);
    } else {
      onBack();
    }
  };

  const openVideo = (url: string) => {
    if (!url) return;
    window.open(`https://www.hlsplayer.org/?url=${encodeURIComponent(url)}`, '_blank');
  };

  const openPdf = (url: string) => {
    if (!url) return;
    window.open(url, '_blank');
  };

  const filteredGoals = goals.filter(g => 
    g.name.toLowerCase().includes(goalSearch.toLowerCase())
  );

  const filteredLessons = lessons.filter(l => 
    l.title.toLowerCase().includes(lessonSearch.toLowerCase())
  );

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-emerald-500/5 via-background to-cyan-500/5 pointer-events-none" />
      
      {/* Header */}
      <header className="sticky top-0 z-50 glass-strong border-b border-border/50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={goBack}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onBack}>
              <Home className="w-5 h-5" />
            </Button>
            
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm overflow-x-auto">
              <span 
                className={`cursor-pointer hover:text-primary transition-colors ${currentStep === 'goals' ? 'text-primary font-medium' : 'text-muted-foreground'}`}
                onClick={() => { setCurrentStep('goals'); setSelectedGoal(null); setSelectedBatch(null); }}
              >
                Goals
              </span>
              {selectedGoal && (
                <>
                  <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <span 
                    className={`cursor-pointer hover:text-primary transition-colors truncate max-w-[150px] ${currentStep === 'batches' ? 'text-primary font-medium' : 'text-muted-foreground'}`}
                    onClick={() => { setCurrentStep('batches'); setSelectedBatch(null); }}
                  >
                    {selectedGoal.name}
                  </span>
                </>
              )}
              {selectedBatch && (
                <>
                  <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-primary font-medium truncate max-w-[150px]">
                    {selectedBatch.name}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-6">
        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
          </div>
        )}

        {!loading && (
          <AnimatePresence mode="wait">
            {/* Goals */}
            {currentStep === 'goals' && (
              <motion.div
                key="goals"
                initial="hidden"
                animate="visible"
                exit={{ opacity: 0 }}
                variants={containerVariants}
              >
                <div className="mb-6">
                  <h1 className="text-2xl md:text-3xl font-bold mb-2 bg-gradient-to-r from-emerald-600 to-cyan-600 bg-clip-text text-transparent">
                    Select Your Goal
                  </h1>
                  <p className="text-muted-foreground">Choose an exam category to explore batches</p>
                </div>

                {/* Search */}
                <div className="relative mb-6 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search goals..."
                    value={goalSearch}
                    onChange={(e) => setGoalSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredGoals.map((goal) => (
                    <motion.div key={goal.uid} variants={itemVariants}>
                      <Card 
                        className="cursor-pointer hover:border-emerald-500/50 transition-all duration-300 group"
                        onClick={() => selectGoal(goal)}
                      >
                        <CardContent className="p-5 flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 flex items-center justify-center flex-shrink-0 group-hover:from-emerald-500/30 group-hover:to-cyan-500/30 transition-all">
                            <Target className="w-6 h-6 text-emerald-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-sm group-hover:text-emerald-600 transition-colors line-clamp-2">
                              {goal.name}
                            </h3>
                          </div>
                          <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-emerald-600 group-hover:translate-x-1 transition-all flex-shrink-0" />
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>

                {filteredGoals.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No goals found</p>
                  </div>
                )}
              </motion.div>
            )}

            {/* Batches */}
            {currentStep === 'batches' && (
              <motion.div
                key="batches"
                initial="hidden"
                animate="visible"
                exit={{ opacity: 0 }}
                variants={containerVariants}
              >
                <div className="mb-6">
                  <h1 className="text-2xl md:text-3xl font-bold mb-2 bg-gradient-to-r from-emerald-600 to-cyan-600 bg-clip-text text-transparent">
                    {selectedGoal?.name}
                  </h1>
                  <p className="text-muted-foreground">Select a batch to view lessons</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {batches.map((batch) => (
                    <motion.div key={batch.uid} variants={itemVariants}>
                      <Card 
                        className="cursor-pointer hover:border-emerald-500/50 transition-all duration-300 group overflow-hidden"
                        onClick={() => selectBatch(batch)}
                      >
                        {batch.cover_photo && (
                          <div className="relative h-36 overflow-hidden">
                            <img 
                              src={batch.cover_photo} 
                              alt={batch.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              onError={(e) => { e.currentTarget.style.display = 'none'; }}
                            />
                          </div>
                        )}
                        <CardContent className="p-4">
                          <h3 className="font-semibold text-sm mb-2 group-hover:text-emerald-600 transition-colors line-clamp-2">
                            {batch.name}
                          </h3>
                          {batch.languages && batch.languages.length > 0 && (
                            <p className="text-xs text-muted-foreground">
                              {batch.languages.map(l => l.label).join(', ')}
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>

                {hasMoreBatches && (
                  <div className="flex justify-center mt-6">
                    <Button 
                      variant="outline" 
                      onClick={() => loadBatches(selectedGoal!.uid, batchOffset + 20)}
                    >
                      Load More
                    </Button>
                  </div>
                )}

                {batches.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <GraduationCap className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No batches found for this goal</p>
                  </div>
                )}
              </motion.div>
            )}

            {/* Lessons */}
            {currentStep === 'lessons' && (
              <motion.div
                key="lessons"
                initial="hidden"
                animate="visible"
                exit={{ opacity: 0 }}
                variants={containerVariants}
              >
                <div className="mb-6">
                  <h1 className="text-2xl md:text-3xl font-bold mb-2 bg-gradient-to-r from-emerald-600 to-cyan-600 bg-clip-text text-transparent">
                    {selectedBatch?.name}
                  </h1>
                  <p className="text-muted-foreground">{lessons.length} lessons available</p>
                </div>

                {/* Search */}
                <div className="relative mb-6 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search lessons..."
                    value={lessonSearch}
                    onChange={(e) => setLessonSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <ScrollArea className="h-[calc(100vh-280px)]">
                  <div className="space-y-3 pr-4">
                    {filteredLessons.map((lesson, index) => (
                      <motion.div key={lesson.id} variants={itemVariants}>
                        <Card className="hover:border-emerald-500/30 transition-all">
                          <CardContent className="p-4">
                            <div className="flex items-start gap-4">
                              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 flex items-center justify-center flex-shrink-0">
                                <span className="text-sm font-bold text-emerald-600">{index + 1}</span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-medium text-sm mb-1 line-clamp-2">{lesson.title}</h3>
                                <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {lesson.date}
                                  </span>
                                  {lesson.author && lesson.author !== 'Unknown' && (
                                    <span className="flex items-center gap-1">
                                      <User className="w-3 h-3" />
                                      {lesson.author}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                {lesson.videoUrl && (
                                  <Button 
                                    size="sm" 
                                    variant="default"
                                    className="gap-1 bg-emerald-600 hover:bg-emerald-700"
                                    onClick={() => openVideo(lesson.videoUrl)}
                                  >
                                    <Play className="w-3 h-3" />
                                    Video
                                  </Button>
                                )}
                                {lesson.pdfUrl && (
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    className="gap-1"
                                    onClick={() => openPdf(lesson.pdfUrl)}
                                  >
                                    <FileText className="w-3 h-3" />
                                    PDF
                                  </Button>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                </ScrollArea>

                {filteredLessons.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <Video className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No lessons found</p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </main>
    </div>
  );
}
