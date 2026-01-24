import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, BookOpen, Video, FileText, Clock, Users, Star, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { fetchMasterCategories, fetchSubCategories, fetchFinalCategories, fetchCourses } from '@/services/api';
import { MasterCategory, SubCategory, FinalCategory, Course } from '@/types/api';

export function CourseCatalog() {
  const [masterCategories, setMasterCategories] = useState<MasterCategory[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [finalCategories, setFinalCategories] = useState<FinalCategory[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedMaster, setSelectedMaster] = useState<number | null>(null);
  const [selectedSub, setSelectedSub] = useState<string | null>(null);
  const [selectedFinal, setSelectedFinal] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchMasterCategories().then(setMasterCategories).catch(console.error);
  }, []);

  useEffect(() => {
    if (selectedMaster) {
      setLoading(true);
      setSubCategories([]);
      setFinalCategories([]);
      setCourses([]);
      setSelectedSub(null);
      setSelectedFinal(null);
      fetchSubCategories(selectedMaster)
        .then(setSubCategories)
        .finally(() => setLoading(false));
    }
  }, [selectedMaster]);

  useEffect(() => {
    if (selectedSub) {
      setLoading(true);
      setFinalCategories([]);
      setCourses([]);
      setSelectedFinal(null);
      fetchFinalCategories(selectedSub)
        .then(setFinalCategories)
        .finally(() => setLoading(false));
    }
  }, [selectedSub]);

  useEffect(() => {
    if (selectedMaster && selectedSub && selectedFinal) {
      setLoading(true);
      fetchCourses(selectedMaster, selectedSub, selectedFinal)
        .then(setCourses)
        .finally(() => setLoading(false));
    }
  }, [selectedFinal, selectedMaster, selectedSub]);

  const getCategoryIcon = (name: string) => {
    if (name.includes('Teaching')) return '📚';
    if (name.includes('Civil')) return '⚖️';
    if (name.includes('Nursing')) return '🏥';
    if (name.includes('Agriculture')) return '🌾';
    if (name.includes('School')) return '🎓';
    if (name.includes('College')) return '🏛️';
    return '📖';
  };

  return (
    <section className="py-20 relative" id="courses">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/20 to-background" />
      
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-sm font-medium text-primary mb-4">
            Explore Courses
          </span>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            Find Your Perfect <span className="text-gradient">Study Path</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Choose from our comprehensive catalog of exam preparation courses designed by India's top educators.
          </p>
        </motion.div>

        {/* Category Selection */}
        <div className="space-y-6 mb-12">
          {/* Master Categories */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
              Select Exam Category
            </h3>
            <div className="flex flex-wrap gap-3">
              {masterCategories.map((cat) => (
                <motion.button
                  key={cat.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedMaster(cat.id)}
                  className={`px-4 py-3 rounded-xl font-medium transition-all duration-300 flex items-center gap-2 ${
                    selectedMaster === cat.id
                      ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
                      : 'bg-card hover:bg-card/80 border border-border hover:border-primary/50'
                  }`}
                >
                  <span>{getCategoryIcon(cat.name)}</span>
                  <span>{cat.name}</span>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Sub Categories */}
          <AnimatePresence mode="wait">
            {subCategories.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
                  <ChevronRight className="w-4 h-4" />
                  Select Region / Type
                </h3>
                <div className="flex flex-wrap gap-3">
                  {subCategories.map((cat) => (
                    <motion.button
                      key={cat.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      whileHover={{ scale: 1.05 }}
                      onClick={() => setSelectedSub(cat.id)}
                      className={`px-4 py-2.5 rounded-lg font-medium transition-all duration-300 ${
                        selectedSub === cat.id
                          ? 'bg-accent text-accent-foreground shadow-lg'
                          : 'bg-secondary hover:bg-secondary/80'
                      }`}
                    >
                      {cat.name}
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Final Categories */}
          <AnimatePresence mode="wait">
            {finalCategories.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
                  <ChevronRight className="w-4 h-4" />
                  Select Exam
                </h3>
                <div className="flex flex-wrap gap-3">
                  {finalCategories.map((cat) => (
                    <motion.button
                      key={cat.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      whileHover={{ scale: 1.05 }}
                      onClick={() => setSelectedFinal(cat.id)}
                      className={`px-4 py-2.5 rounded-lg font-medium transition-all duration-300 ${
                        selectedFinal === cat.id
                          ? 'bg-primary/80 text-primary-foreground shadow-lg'
                          : 'bg-muted hover:bg-muted/80'
                      }`}
                    >
                      {cat.name}
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Courses Grid */}
        <AnimatePresence mode="wait">
          {courses.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {courses.map((course, i) => (
                <CourseCard key={course.id} course={course} index={i} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty State */}
        {!loading && courses.length === 0 && selectedFinal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No courses found for this selection.</p>
          </motion.div>
        )}
      </div>
    </section>
  );
}

function CourseCard({ course, index }: { course: Course; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Card variant="interactive" className="h-full group overflow-hidden">
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
              <BookOpen className="w-12 h-12 text-primary/50" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent" />
          
          {/* Badge */}
          <div className="absolute top-4 left-4 flex gap-2">
            <span className="px-3 py-1 rounded-full bg-primary/90 text-primary-foreground text-xs font-semibold backdrop-blur-sm">
              Popular
            </span>
          </div>
        </div>

        <CardHeader className="pb-2">
          <CardTitle className="text-lg line-clamp-2 group-hover:text-primary transition-colors">
            {course.title}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Stats */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Video className="w-4 h-4 text-primary" />
              <span>HD Videos</span>
            </div>
            <div className="flex items-center gap-1">
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

          {/* Price & CTA */}
          <div className="flex items-center justify-between pt-4 border-t border-border">
            <div>
              {course.selling_price && (
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-primary">₹{course.selling_price}</span>
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
            <Button variant="hero" size="sm" className="group/btn">
              Enroll
              <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
