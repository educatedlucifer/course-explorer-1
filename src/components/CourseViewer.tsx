import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize2, 
  SkipBack, 
  SkipForward,
  BookOpen,
  FileText,
  ChevronDown,
  ChevronRight,
  Clock,
  CheckCircle2,
  Lock
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { fetchBatch, fetchSubjects, fetchTopics, fetchContent } from '@/services/api';
import { Subject, Topic, Content } from '@/types/api';

interface VideoPlayerProps {
  url: string;
  title: string;
}

function VideoPlayer({ url, title }: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);

  return (
    <div className="video-container relative bg-background/95 aspect-video group">
      {/* Video Element */}
      <video
        src={url}
        className="w-full h-full object-cover"
        onClick={() => setIsPlaying(!isPlaying)}
      />
      
      {/* Overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      {/* Play/Pause overlay */}
      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsPlaying(true)}
            className="w-20 h-20 rounded-full bg-primary/90 backdrop-blur-sm flex items-center justify-center shadow-lg shadow-primary/30"
          >
            <Play className="w-8 h-8 text-primary-foreground ml-1" fill="currentColor" />
          </motion.button>
        </div>
      )}

      {/* Controls */}
      <div className="absolute bottom-0 left-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        {/* Progress bar */}
        <div className="mb-4">
          <div className="h-1 bg-muted rounded-full overflow-hidden cursor-pointer">
            <motion.div 
              className="h-full bg-primary progress-glow"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="text-foreground hover:bg-muted/50">
              <SkipBack className="w-5 h-5" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-foreground hover:bg-muted/50"
              onClick={() => setIsPlaying(!isPlaying)}
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            </Button>
            <Button variant="ghost" size="icon" className="text-foreground hover:bg-muted/50">
              <SkipForward className="w-5 h-5" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-foreground hover:bg-muted/50"
              onClick={() => setIsMuted(!isMuted)}
            >
              {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </Button>
            <span className="text-sm text-muted-foreground">0:00 / 45:30</span>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="text-foreground hover:bg-muted/50">
              1x
            </Button>
            <Button variant="ghost" size="icon" className="text-foreground hover:bg-muted/50">
              <Maximize2 className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Title overlay */}
      <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-background/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <h3 className="font-display font-semibold truncate">{title}</h3>
      </div>
    </div>
  );
}

export function CourseViewer() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [contents, setContents] = useState<Content[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [selectedContent, setSelectedContent] = useState<Content | null>(null);
  const [expandedSubject, setExpandedSubject] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const courseId = '20881'; // Demo course

  useEffect(() => {
    setLoading(true);
    fetchSubjects(courseId)
      .then((data) => {
        setSubjects(data);
        if (data.length > 0) {
          setExpandedSubject(data[0].id);
          setSelectedSubject(data[0].id);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (selectedSubject) {
      fetchTopics(courseId, selectedSubject).then(setTopics);
    }
  }, [selectedSubject]);

  useEffect(() => {
    if (selectedSubject && selectedTopic) {
      fetchContent(courseId, selectedSubject, selectedTopic).then((data) => {
        setContents(data);
        if (data.length > 0) {
          setSelectedContent(data[0]);
        }
      });
    }
  }, [selectedTopic, selectedSubject]);

  const isVideo = (url: string) => url.includes('.mp4');
  const isPdf = (url: string) => url.includes('.pdf');

  return (
    <section className="py-20 relative" id="learn">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/10 to-background" />
      
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-accent/10 border border-accent/20 text-sm font-medium text-accent mb-4">
            Interactive Learning
          </span>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            Immersive <span className="text-gradient-gold">Study Experience</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            HD video lectures, downloadable PDFs, and structured curriculum - everything you need to succeed.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Video Player Area */}
          <div className="lg:col-span-2 space-y-4">
            {selectedContent && isVideo(selectedContent.url) ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                key={selectedContent.id}
              >
                <VideoPlayer url={selectedContent.url} title={selectedContent.title} />
              </motion.div>
            ) : selectedContent && isPdf(selectedContent.url) ? (
              <Card variant="glass" className="aspect-video flex items-center justify-center">
                <div className="text-center">
                  <FileText className="w-16 h-16 text-accent mx-auto mb-4" />
                  <h3 className="font-display font-semibold text-lg mb-2">{selectedContent.title}</h3>
                  <Button variant="accent">
                    <FileText className="w-4 h-4 mr-2" />
                    Download PDF
                  </Button>
                </div>
              </Card>
            ) : (
              <Card variant="glass" className="aspect-video flex items-center justify-center">
                <div className="text-center">
                  <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Select a lesson to begin</p>
                </div>
              </Card>
            )}

            {/* Current content info */}
            {selectedContent && (
              <Card variant="glass" className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-display font-semibold text-lg mb-1">{selectedContent.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      Rajasthan GK Special Batch • {isVideo(selectedContent.url) ? 'Video Lecture' : 'PDF Notes'}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <FileText className="w-4 h-4 mr-2" />
                      Notes
                    </Button>
                    <Button variant="hero" size="sm">
                      Mark Complete
                      <CheckCircle2 className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>
              </Card>
            )}
          </div>

          {/* Course Sidebar */}
          <div className="space-y-4">
            <Card variant="glow" className="sticky top-24">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Course Content</CardTitle>
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                    {subjects.length} Subjects
                  </span>
                </div>
                {/* Progress */}
                <div className="mt-4">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Your Progress</span>
                    <span className="font-semibold text-primary">25%</span>
                  </div>
                  <Progress value={25} className="h-2" />
                </div>
              </CardHeader>

              <CardContent className="max-h-[500px] overflow-y-auto custom-scrollbar">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : (
                  <div className="space-y-2">
                    {subjects.map((subject) => (
                      <div key={subject.id} className="rounded-lg overflow-hidden">
                        <button
                          onClick={() => {
                            setExpandedSubject(expandedSubject === subject.id ? null : subject.id);
                            setSelectedSubject(subject.id);
                          }}
                          className={`w-full p-3 flex items-center justify-between text-left transition-colors ${
                            expandedSubject === subject.id
                              ? 'bg-primary/10 text-primary'
                              : 'hover:bg-muted/50'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <BookOpen className="w-4 h-4" />
                            <span className="font-medium text-sm line-clamp-1">{subject.title}</span>
                          </div>
                          <ChevronDown 
                            className={`w-4 h-4 transition-transform ${
                              expandedSubject === subject.id ? 'rotate-180' : ''
                            }`} 
                          />
                        </button>

                        <AnimatePresence>
                          {expandedSubject === subject.id && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden"
                            >
                              {topics.length > 0 ? (
                                topics.map((topic) => (
                                  <button
                                    key={topic.id}
                                    onClick={() => setSelectedTopic(topic.id)}
                                    className={`w-full p-3 pl-10 flex items-center gap-3 text-left text-sm transition-colors ${
                                      selectedTopic === topic.id
                                        ? 'bg-accent/10 text-accent'
                                        : 'hover:bg-muted/30 text-muted-foreground'
                                    }`}
                                  >
                                    <ChevronRight className="w-3 h-3" />
                                    <span className="line-clamp-1">{topic.title}</span>
                                  </button>
                                ))
                              ) : (
                                <div className="p-3 pl-10 text-sm text-muted-foreground">
                                  Loading topics...
                                </div>
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}
