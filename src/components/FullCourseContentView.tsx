import * as React from "react";
import { motion } from "framer-motion";
import { BookOpen, ChevronDown, ChevronRight, FileText, Folder, Play, Video } from "lucide-react";
import { FullCourseContent, Content } from "@/types/api";
import {
  getContentKind,
  normalizeContentUrl,
  toYouTubeEmbedUrl,
  type ContentKind,
} from "@/lib/content-utils";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./ui/collapsible";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.03 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 300, damping: 24 },
  },
};

export function FullCourseContentView({
  courseContent,
  selectedContent,
  onSelectContent,
}: {
  courseContent: FullCourseContent;
  selectedContent: Content | null;
  onSelectContent: (c: Content) => void;
}) {
  // Flatten all content for counting
  const allContents: { content: Content; subjectName: string; topicName: string }[] = [];
  for (const subj of courseContent.subjects) {
    for (const topic of subj.topics) {
      for (const c of topic.contents) {
        allContents.push({ content: c, subjectName: subj.name, topicName: topic.name });
      }
    }
  }

  const videos = allContents.filter((item) => {
    const kind = getContentKind(normalizeContentUrl(item.content.url));
    return kind === "video" || kind === "youtube";
  });
  const pdfs = allContents.filter((item) => getContentKind(normalizeContentUrl(item.content.url)) === "pdf");
  const others = allContents.filter((item) => getContentKind(normalizeContentUrl(item.content.url)) === "other");

  const selectedUrl = selectedContent ? normalizeContentUrl(selectedContent.url) : undefined;
  const selectedKind = getContentKind(selectedUrl);
  const selectedYouTubeEmbed = selectedUrl ? toYouTubeEmbedUrl(selectedUrl) : null;

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20">
        <h2 className="font-semibold text-lg mb-2">📚 Full Course Content</h2>
        <div className="flex flex-wrap gap-4 text-sm">
          <span className="flex items-center gap-2">
            <Folder className="w-4 h-4 text-primary" />
            <strong>{courseContent.subjects.length}</strong> Subjects
          </span>
          <span className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-secondary" />
            <strong>{courseContent.subjects.reduce((a, s) => a + s.topics.length, 0)}</strong> Topics
          </span>
          <span className="flex items-center gap-2">
            <Video className="w-4 h-4 text-primary" />
            <strong>{videos.length}</strong> Videos
          </span>
          <span className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-accent" />
            <strong>{pdfs.length}</strong> PDFs
          </span>
          {others.length > 0 && (
            <span className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-muted-foreground" />
              <strong>{others.length}</strong> Other
            </span>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Content Tree */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className={`space-y-4 ${selectedContent && (selectedKind === "video" || selectedKind === "youtube") ? "lg:col-span-1 max-h-[700px] overflow-y-auto pr-2" : "lg:col-span-3"}`}
        >
          {courseContent.subjects.map((subject, sIdx) => (
            <motion.div key={subject.id} variants={itemVariants}>
              <Collapsible defaultOpen={sIdx === 0}>
                <CollapsibleTrigger className="w-full">
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border/50 hover:border-primary/50 transition-colors cursor-pointer group">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center flex-shrink-0">
                      <Folder className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 text-left">
                      <h3 className="font-semibold group-hover:text-primary transition-colors">{subject.name}</h3>
                      <p className="text-xs text-muted-foreground">
                        {subject.topics.length} topics • {subject.topics.reduce((a, t) => a + t.contents.length, 0)} items
                      </p>
                    </div>
                    <ChevronDown className="w-5 h-5 text-muted-foreground group-data-[state=open]:rotate-180 transition-transform" />
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="ml-6 mt-2 space-y-2 border-l-2 border-border/50 pl-4">
                    {subject.topics.map((topic) => (
                      <Collapsible key={topic.id} defaultOpen>
                        <CollapsibleTrigger className="w-full">
                          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer group">
                            <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center flex-shrink-0">
                              <BookOpen className="w-4 h-4 text-secondary" />
                            </div>
                            <div className="flex-1 text-left">
                              <h4 className="font-medium text-sm group-hover:text-secondary transition-colors">{topic.name}</h4>
                              <p className="text-xs text-muted-foreground">{topic.contents.length} items</p>
                            </div>
                            <ChevronRight className="w-4 h-4 text-muted-foreground group-data-[state=open]:rotate-90 transition-transform" />
                          </div>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <div className="ml-4 mt-2 space-y-1">
                            {topic.contents.map((content, cIdx) => {
                              const url = normalizeContentUrl(content.url);
                              const kind = getContentKind(url);
                              const isSelected = selectedContent?.id === content.id && normalizeContentUrl(selectedContent?.url) === url;
                              const isPdf = kind === "pdf";
                              const isVideo = kind === "video" || kind === "youtube";

                              if (isPdf) {
                                return (
                                  <a
                                    key={`${content.id}-${cIdx}`}
                                    href={url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent/10 transition-colors group"
                                  >
                                    <div className="w-7 h-7 rounded-md bg-accent/10 flex items-center justify-center flex-shrink-0">
                                      <FileText className="w-4 h-4 text-accent" />
                                    </div>
                                    <span className="text-sm group-hover:text-accent transition-colors line-clamp-1 flex-1">
                                      {content.title}
                                    </span>
                                    <span className="text-xs px-2 py-0.5 rounded bg-accent/10 text-accent">PDF</span>
                                  </a>
                                );
                              }

                              if (isVideo) {
                                return (
                                  <button
                                    key={`${content.id}-${cIdx}`}
                                    onClick={() => onSelectContent(content)}
                                    className={`w-full flex items-center gap-3 p-2 rounded-lg transition-colors group ${
                                      isSelected ? "bg-primary/10 border border-primary/30" : "hover:bg-primary/5"
                                    }`}
                                  >
                                    <div
                                      className={`w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 ${
                                        isSelected ? "bg-primary text-primary-foreground" : "bg-primary/10"
                                      }`}
                                    >
                                      <Play className="w-4 h-4" />
                                    </div>
                                    <span
                                      className={`text-sm transition-colors line-clamp-1 flex-1 text-left ${
                                        isSelected ? "text-primary font-medium" : "group-hover:text-primary"
                                      }`}
                                    >
                                      {content.title}
                                    </span>
                                    <span className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary">
                                      {kind === "youtube" ? "YT" : "Video"}
                                    </span>
                                    {isSelected && <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />}
                                  </button>
                                );
                              }

                              // Other
                              return (
                                <a
                                  key={`${content.id}-${cIdx}`}
                                  href={url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors group"
                                >
                                  <div className="w-7 h-7 rounded-md bg-muted/50 flex items-center justify-center flex-shrink-0">
                                    <BookOpen className="w-4 h-4 text-muted-foreground" />
                                  </div>
                                  <span className="text-sm group-hover:text-foreground transition-colors line-clamp-1 flex-1">
                                    {content.title}
                                  </span>
                                  <span className="text-xs px-2 py-0.5 rounded bg-muted/50 text-muted-foreground">Link</span>
                                </a>
                              );
                            })}
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </motion.div>
          ))}
        </motion.div>

        {/* Video Player */}
        {selectedContent && (selectedKind === "video" || selectedKind === "youtube") && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="lg:col-span-2 lg:sticky lg:top-24 h-fit">
            <div className="rounded-2xl overflow-hidden border border-border/50 bg-card">
              <div className="aspect-video bg-black relative">
                {selectedKind === "video" && selectedUrl && (
                  <video
                    key={`${selectedContent.id}-${selectedUrl}`}
                    src={selectedUrl}
                    controls
                    className="w-full h-full"
                    controlsList="nodownload"
                  />
                )}

                {selectedKind === "youtube" && selectedUrl && (
                  <iframe
                    key={`${selectedContent.id}-${selectedUrl}`}
                    className="w-full h-full"
                    src={selectedYouTubeEmbed ?? selectedUrl}
                    title={selectedContent.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                )}
              </div>
              <div className="p-4 border-t border-border/50">
                <h2 className="font-semibold text-lg text-gradient">{selectedContent.title}</h2>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Empty State */}
      {allContents.length === 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
          <BookOpen className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="font-semibold text-xl mb-2">No Content Found</h3>
          <p className="text-muted-foreground">This course has no study materials yet.</p>
        </motion.div>
      )}
    </div>
  );
}
