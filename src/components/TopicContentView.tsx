import * as React from "react";
import { motion } from "framer-motion";
import { BookOpen, FileText, Play, Video } from "lucide-react";
import { Content } from "@/types/api";
import {
  getContentKind,
  isSameContent,
  normalizeContentUrl,
  toYouTubeEmbedUrl,
  type ContentKind,
} from "@/lib/content-utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

type TabKey = "all" | "videos" | "pdfs" | "other";

type ContentItem = {
  content: Content;
  url?: string;
  kind: ContentKind;
  key: string;
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring" as const, stiffness: 300, damping: 24 },
  },
};

export function TopicContentView({
  contents,
  selectedContent,
  onSelectContent,
}: {
  contents: Content[];
  selectedContent: Content | null;
  onSelectContent: (c: Content) => void;
}) {
  const items: ContentItem[] = contents.map((content, index) => {
    const url = normalizeContentUrl(content.url);
    return {
      content,
      url,
      kind: getContentKind(url),
      key: `${content.id}-${index}`,
    };
  });

  const videos = items.filter((i) => i.kind === "video" || i.kind === "youtube");
  const pdfs = items.filter((i) => i.kind === "pdf");
  const others = items.filter((i) => i.kind === "other");

  const selectedUrl = selectedContent ? normalizeContentUrl(selectedContent.url) : undefined;
  const selectedKind = getContentKind(selectedUrl);
  const selectedYouTubeEmbed = selectedUrl ? toYouTubeEmbedUrl(selectedUrl) : null;

  const [tab, setTab] = React.useState<TabKey>("all");

  // If you pick a video, jump to the Videos tab automatically.
  React.useEffect(() => {
    if (!selectedContent) return;
    const kind = getContentKind(normalizeContentUrl(selectedContent.url));
    if (kind === "video" || kind === "youtube") setTab("videos");
  }, [selectedContent]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-semibold text-lg">Content</h2>
          <p className="text-sm text-muted-foreground">
            Total: <span className="font-medium text-foreground">{contents.length}</span> • Videos: {videos.length} • PDFs: {pdfs.length} • Other: {others.length}
          </p>
        </div>
        <Tabs value={tab} onValueChange={(v) => setTab(v as TabKey)}>
          <TabsList className="bg-card/50 border border-border/50">
            <TabsTrigger value="all">All ({contents.length})</TabsTrigger>
            <TabsTrigger value="videos">Videos ({videos.length})</TabsTrigger>
            <TabsTrigger value="pdfs">PDFs ({pdfs.length})</TabsTrigger>
            <TabsTrigger value="other">Other ({others.length})</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as TabKey)}>
        <TabsContent value="all" className="mt-0">
          {/* Keep the "All" view simple: show sections so users never think items disappeared */}
          {videos.length > 0 && (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                  <Video className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Video Lectures</h3>
                  <p className="text-sm text-muted-foreground">{videos.length} items</p>
                </div>
              </div>
              <VideoTab
                videos={videos}
                selectedContent={selectedContent}
                selectedKind={selectedKind}
                selectedUrl={selectedUrl}
                selectedYouTubeEmbed={selectedYouTubeEmbed}
                onSelectContent={onSelectContent}
              />
            </div>
          )}

          {pdfs.length > 0 && (
            <div className={videos.length > 0 ? "mt-10 pt-8 border-t border-border/50" : ""}>
              <PdfGrid pdfs={pdfs} />
            </div>
          )}

          {others.length > 0 && (
            <div className={(videos.length > 0 || pdfs.length > 0) ? "mt-10 pt-8 border-t border-border/50" : ""}>
              <OtherGrid others={others} />
            </div>
          )}

          {videos.length === 0 && pdfs.length === 0 && others.length === 0 && <EmptyState />}
        </TabsContent>

        <TabsContent value="videos" className="mt-0">
          {videos.length > 0 ? (
            <VideoTab
              videos={videos}
              selectedContent={selectedContent}
              selectedKind={selectedKind}
              selectedUrl={selectedUrl}
              selectedYouTubeEmbed={selectedYouTubeEmbed}
              onSelectContent={onSelectContent}
            />
          ) : (
            <EmptyState label="No videos found" />
          )}
        </TabsContent>

        <TabsContent value="pdfs" className="mt-0">
          {pdfs.length > 0 ? <PdfGrid pdfs={pdfs} /> : <EmptyState label="No PDFs found" />}
        </TabsContent>

        <TabsContent value="other" className="mt-0">
          {others.length > 0 ? <OtherGrid others={others} /> : <EmptyState label="No other resources found" />}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function VideoTab({
  videos,
  selectedContent,
  selectedKind,
  selectedUrl,
  selectedYouTubeEmbed,
  onSelectContent,
}: {
  videos: ContentItem[];
  selectedContent: Content | null;
  selectedKind: ContentKind;
  selectedUrl?: string;
  selectedYouTubeEmbed: string | null;
  onSelectContent: (c: Content) => void;
}) {
  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className={`space-y-3 ${selectedContent && (selectedKind === "video" || selectedKind === "youtube") ? "lg:col-span-1 max-h-[600px] overflow-y-auto pr-2" : "lg:col-span-3"}`}
      >
        {videos.map((item, index) => {
          const content = item.content;
          const isSelected = isSameContent(selectedContent, content);
          return (
            <motion.div key={item.key} variants={itemVariants}>
              <motion.div
                className={`group cursor-pointer rounded-xl border transition-all duration-300 ${
                  isSelected
                    ? "border-primary bg-gradient-to-r from-primary/10 to-secondary/5"
                    : "border-border/50 bg-card/50 hover:border-primary/50 hover:bg-card"
                }`}
                onClick={() => onSelectContent(content)}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <div className="p-4 flex items-center gap-4">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      isSelected
                        ? "bg-gradient-to-br from-primary to-secondary text-primary-foreground"
                        : "bg-primary/10"
                    }`}
                  >
                    <Play className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3
                      className={`font-medium ${
                        isSelected ? "text-primary" : "group-hover:text-primary"
                      } transition-colors line-clamp-2`}
                    >
                      {content.title}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {item.kind === "youtube" ? "YouTube Video" : "Video Lecture"}
                    </p>
                  </div>
                  {isSelected && <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />}
                </div>
              </motion.div>
            </motion.div>
          );
        })}
      </motion.div>

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
  );
}

function PdfGrid({ pdfs }: { pdfs: ContentItem[] }) {
  return (
    <>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center">
          <FileText className="w-5 h-5 text-accent" />
        </div>
        <div>
          <h3 className="font-semibold text-lg">Study Materials (PDF)</h3>
          <p className="text-sm text-muted-foreground">{pdfs.length} documents</p>
        </div>
      </div>

      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {pdfs.map((item) => (
          <motion.div key={item.key} variants={itemVariants}>
            <motion.a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group block rounded-xl border border-border/50 bg-card/50 hover:border-accent/50 hover:bg-card transition-all duration-300 overflow-hidden"
              whileHover={{ scale: 1.02, y: -3 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="p-5">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center mb-4 group-hover:from-accent/30 group-hover:to-accent/10 transition-all">
                  <FileText className="w-7 h-7 text-accent" />
                </div>
                <h3 className="font-medium text-sm group-hover:text-accent transition-colors line-clamp-2 mb-2">{item.content.title}</h3>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="px-2 py-1 rounded-md bg-accent/10 text-accent">PDF</span>
                  <span>Click to view</span>
                </div>
              </div>
            </motion.a>
          </motion.div>
        ))}
      </motion.div>
    </>
  );
}

function OtherGrid({ others }: { others: ContentItem[] }) {
  return (
    <>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-muted/50 border border-border/50 flex items-center justify-center">
          <BookOpen className="w-5 h-5 text-foreground" />
        </div>
        <div>
          <h3 className="font-semibold text-lg">Other Resources</h3>
          <p className="text-sm text-muted-foreground">{others.length} items</p>
        </div>
      </div>

      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {others.map((item) => (
          <motion.div key={item.key} variants={itemVariants}>
            <motion.a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group block rounded-xl border border-border/50 bg-card/50 hover:border-primary/50 hover:bg-card transition-all duration-300 overflow-hidden"
              whileHover={{ scale: 1.02, y: -3 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="p-5">
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/15 transition-all">
                  <BookOpen className="w-7 h-7 text-primary" />
                </div>
                <h3 className="font-medium text-sm group-hover:text-primary transition-colors line-clamp-2 mb-2">{item.content.title}</h3>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="px-2 py-1 rounded-md bg-muted/60 text-foreground">Link</span>
                  <span>Open resource</span>
                </div>
              </div>
            </motion.a>
          </motion.div>
        ))}
      </motion.div>
    </>
  );
}

function EmptyState({ label = "No Content Available" }: { label?: string }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
      <BookOpen className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
      <h3 className="font-semibold text-xl mb-2">{label}</h3>
      <p className="text-muted-foreground">This topic has no videos or study materials yet.</p>
    </motion.div>
  );
}
