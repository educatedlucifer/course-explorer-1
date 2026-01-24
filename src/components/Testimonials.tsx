import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, ChevronLeft, ChevronRight, Quote } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';

const testimonials = [
  {
    id: 1,
    name: 'Priya Sharma',
    role: 'REET Qualified',
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face',
    rating: 5,
    text: 'StudyPro transformed my preparation journey. The video lectures are crystal clear, and the test series helped me understand the exam pattern perfectly. I cleared REET in my first attempt!',
  },
  {
    id: 2,
    name: 'Rahul Verma',
    role: 'Grade III Teacher',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    rating: 5,
    text: 'The faculty here is exceptional. Every topic is explained in detail with real-life examples. The PDF notes saved me so much time during revision. Highly recommended!',
  },
  {
    id: 3,
    name: 'Anjali Patel',
    role: 'Civil Services Aspirant',
    image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
    rating: 5,
    text: 'The current affairs section and daily updates are incredibly helpful. The live classes provide that extra edge with direct interaction with teachers. Best investment for my future!',
  },
  {
    id: 4,
    name: 'Vikram Singh',
    role: 'UGC NET Qualified',
    image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    rating: 5,
    text: 'I was struggling with paper pattern until I joined StudyPro. The structured approach and mock tests made all the difference. Cleared NET with a top rank!',
  },
];

export function Testimonials() {
  const [current, setCurrent] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);

  useEffect(() => {
    if (!autoPlay) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [autoPlay]);

  const next = () => {
    setAutoPlay(false);
    setCurrent((prev) => (prev + 1) % testimonials.length);
  };

  const prev = () => {
    setAutoPlay(false);
    setCurrent((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  return (
    <section className="py-20 relative overflow-hidden" id="testimonials">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-muted/20 via-background to-background" />
      <div className="absolute top-1/2 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-accent/10 border border-accent/20 text-sm font-medium text-accent mb-4">
            Student Success
          </span>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            Hear from Our <span className="text-gradient-gold">Achievers</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Thousands of students have achieved their dreams with us. Here's what they say about their journey.
          </p>
        </motion.div>

        <div className="max-w-4xl mx-auto">
          {/* Main testimonial */}
          <div className="relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={current}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.3 }}
              >
                <Card variant="glass" className="p-8 md:p-12">
                  <CardContent className="p-0">
                    <div className="flex flex-col md:flex-row gap-8 items-center">
                      {/* Image */}
                      <div className="relative flex-shrink-0">
                        <div className="w-24 h-24 md:w-32 md:h-32 rounded-2xl overflow-hidden border-2 border-primary/30 shadow-lg">
                          <img
                            src={testimonials[current].image}
                            alt={testimonials[current].name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-accent flex items-center justify-center">
                          <Quote className="w-5 h-5 text-accent-foreground" />
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-1 text-center md:text-left">
                        {/* Rating */}
                        <div className="flex justify-center md:justify-start gap-1 mb-4">
                          {[...Array(testimonials[current].rating)].map((_, i) => (
                            <Star key={i} className="w-5 h-5 text-accent fill-accent" />
                          ))}
                        </div>

                        {/* Quote */}
                        <p className="text-lg md:text-xl text-foreground/90 leading-relaxed mb-6 italic">
                          "{testimonials[current].text}"
                        </p>

                        {/* Author */}
                        <div>
                          <h4 className="font-display font-semibold text-lg">
                            {testimonials[current].name}
                          </h4>
                          <p className="text-sm text-primary">{testimonials[current].role}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </AnimatePresence>

            {/* Navigation */}
            <div className="flex items-center justify-center gap-4 mt-8">
              <Button variant="outline" size="icon" onClick={prev} className="rounded-full">
                <ChevronLeft className="w-5 h-5" />
              </Button>
              
              <div className="flex gap-2">
                {testimonials.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setAutoPlay(false);
                      setCurrent(i);
                    }}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      i === current
                        ? 'w-8 bg-primary'
                        : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
                    }`}
                  />
                ))}
              </div>

              <Button variant="outline" size="icon" onClick={next} className="rounded-full">
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
