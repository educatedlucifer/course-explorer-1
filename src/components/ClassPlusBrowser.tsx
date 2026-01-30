import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  Search, 
  Play, 
  FileText, 
  Folder, 
  Image as ImageIcon, 
  File,
  ChevronRight,
  Copy,
  Check,
  X,
  GraduationCap,
  Home
} from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';

interface Batch {
  id: number;
  name: string;
  thumbnail: string | null;
  price: number;
  description: string;
}

interface ContentItem {
  id: number;
  name: string;
  type: 'folder' | 'video' | 'pdf' | 'image' | 'file';
  url: string;
  thumbnail: string | null;
}

interface BreadcrumbItem {
  id: number;
  name: string;
  type: 'root' | 'folder';
}

type Screen = 'login' | 'batches' | 'content';

interface ClassPlusBrowserProps {
  onBack: () => void;
}

export function ClassPlusBrowser({ onBack }: ClassPlusBrowserProps) {
  const [screen, setScreen] = useState<Screen>('login');
  const [orgCode, setOrgCode] = useState('');
  const [orgName, setOrgName] = useState('');
  const [hash, setHash] = useState('');
  const [batches, setBatches] = useState<Batch[]>([]);
  const [filteredBatches, setFilteredBatches] = useState<Batch[]>([]);
  const [currentBatch, setCurrentBatch] = useState<Batch | null>(null);
  const [currentBatchToken, setCurrentBatchToken] = useState('');
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [navigationStack, setNavigationStack] = useState<BreadcrumbItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Video modal state
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [currentVideo, setCurrentVideo] = useState<{ name: string; url: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const getApiUrl = () => {
    const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID || 'sayrfuwbcrujofbxijhh';
    return `https://${projectId}.supabase.co/functions/v1/classplus-api`;
  };

  const getApiHeaders = () => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    if (supabaseKey) {
      headers.apikey = supabaseKey;
      headers.Authorization = `Bearer ${supabaseKey}`;
    }
    return headers;
  };

  // Check for stored org code on mount
  useEffect(() => {
    const storedOrg = localStorage.getItem('cp_org_code');
    if (storedOrg) {
      setOrgCode(storedOrg);
    }
  }, []);

  // Filter batches when search query changes
  useEffect(() => {
    if (searchQuery) {
      const filtered = batches.filter(b =>
        b.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredBatches(filtered);
    } else {
      setFilteredBatches(batches);
    }
  }, [searchQuery, batches]);

  const handleLogin = async () => {
    const code = orgCode.trim().toLowerCase();
    if (!code) {
      setError('Please enter an organization code');
      return;
    }

    setLoading(true);
    setError('');
    setOrgCode(code);

    try {
      const response = await fetch(`${getApiUrl()}?action=org&orgCode=${code}`, {
        headers: getApiHeaders(),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Organization not found');
      }

      setOrgName(data.orgName);
      setHash(data.hash);
      localStorage.setItem('cp_org_code', code);

      await loadBatches(code, data.hash);
      setScreen('batches');
    } catch (err: any) {
      setError(err.message || 'Failed to connect. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadBatches = async (code: string, hashValue: string) => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(
        `${getApiUrl()}?action=batches&orgCode=${code}&hash=${encodeURIComponent(hashValue)}`,
        { headers: getApiHeaders() }
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load courses');
      }

      setBatches(data.batches || []);
      setFilteredBatches(data.batches || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load courses');
      setBatches([]);
      setFilteredBatches([]);
    } finally {
      setLoading(false);
    }
  };

  const openBatch = async (batch: Batch) => {
    setLoading(true);
    setError('');
    setCurrentBatch(batch);
    setNavigationStack([{ id: 0, name: batch.name, type: 'root' }]);

    try {
      // Get batch token first
      const tokenResponse = await fetch(
        `${getApiUrl()}?action=batch-token&orgCode=${orgCode}&courseId=${batch.id}`,
        { headers: getApiHeaders() }
      );
      const tokenData = await tokenResponse.json();

      const batchToken = tokenData.success && tokenData.hash ? tokenData.hash : hash;
      setCurrentBatchToken(batchToken);

      await loadContent(batchToken, 0);
      setScreen('content');
    } catch (err) {
      console.error('Error opening batch:', err);
      setCurrentBatchToken(hash);
      await loadContent(hash, 0);
      setScreen('content');
    } finally {
      setLoading(false);
    }
  };

  const loadContent = async (batchToken: string, folderId: number) => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(
        `${getApiUrl()}?action=content&batchToken=${batchToken}&folderId=${folderId}`,
        { headers: getApiHeaders() }
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load content');
      }

      // Sort: folders first, then by name
      const sortedContents = [...(data.contents || [])].sort((a: ContentItem, b: ContentItem) => {
        if (a.type === 'folder' && b.type !== 'folder') return -1;
        if (a.type !== 'folder' && b.type === 'folder') return 1;
        return a.name.localeCompare(b.name);
      });

      setContents(sortedContents);
    } catch (err: any) {
      setError(err.message || 'Failed to load content');
    } finally {
      setLoading(false);
    }
  };

  const handleContentClick = (item: ContentItem) => {
    if (item.type === 'folder') {
      setNavigationStack(prev => [...prev, { id: item.id, name: item.name, type: 'folder' }]);
      loadContent(currentBatchToken, item.id);
    } else if (item.type === 'video') {
      setCurrentVideo({ name: item.name, url: item.url });
      setVideoModalOpen(true);
    } else if (item.url) {
      window.open(item.url, '_blank');
    }
  };

  const goBack = () => {
    if (screen === 'content') {
      if (navigationStack.length > 1) {
        const newStack = navigationStack.slice(0, -1);
        setNavigationStack(newStack);
        const item = newStack[newStack.length - 1];
        loadContent(currentBatchToken, item.id);
      } else {
        setScreen('batches');
        setContents([]);
        setCurrentBatch(null);
      }
    } else if (screen === 'batches') {
      localStorage.removeItem('cp_org_code');
      setScreen('login');
      setBatches([]);
      setFilteredBatches([]);
      setOrgCode('');
      setOrgName('');
      setHash('');
    } else {
      onBack();
    }
  };

  const navigateTo = (index: number) => {
    const newStack = navigationStack.slice(0, index + 1);
    setNavigationStack(newStack);
    const item = newStack[newStack.length - 1];
    loadContent(currentBatchToken, item.id);
  };

  const playVideo = async (playerNum: number) => {
    if (!currentVideo) return;

    try {
      const signedRes = await fetch(
        `${getApiUrl()}?action=signed-url&url=${encodeURIComponent(currentVideo.url)}`,
        { headers: getApiHeaders() }
      );
      const signedData = await signedRes.json();
      const signedUrl = signedData.signedUrl || currentVideo.url;

      let playerUrl;
      if (playerNum === 1) {
        playerUrl = `https://playernew-cp.vercel.app/?url=${encodeURIComponent(signedUrl)}`;
      } else {
        playerUrl = `https://itsvchoudharydrm.vercel.app/api?url=${encodeURIComponent(signedUrl)}&auth=@veerjaatoffline`;
      }
      window.open(playerUrl, '_blank');
      setVideoModalOpen(false);
    } catch (e) {
      console.error('Error playing video:', e);
      const playerUrl = `https://playernew-cp.vercel.app/?url=${encodeURIComponent(currentVideo.url)}`;
      window.open(playerUrl, '_blank');
      setVideoModalOpen(false);
    }
  };

  const copyVideoUrl = () => {
    if (!currentVideo) return;
    navigator.clipboard.writeText(currentVideo.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getContentIcon = (type: string) => {
    switch (type) {
      case 'folder': return <Folder className="w-6 h-6" />;
      case 'video': return <Play className="w-6 h-6" />;
      case 'pdf': return <FileText className="w-6 h-6" />;
      case 'image': return <ImageIcon className="w-6 h-6" />;
      default: return <File className="w-6 h-6" />;
    }
  };

  const getIconColor = (type: string) => {
    switch (type) {
      case 'folder': return 'text-amber-500';
      case 'video': return 'text-blue-500';
      case 'pdf': return 'text-red-500';
      case 'image': return 'text-green-500';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Login Screen */}
      <AnimatePresence mode="wait">
        {screen === 'login' && (
          <motion.div
            key="login"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(37,99,235,0.1),transparent)] pointer-events-none" />
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative z-10 w-full max-w-md"
            >
              <Card className="bg-card/95 backdrop-blur-xl">
                <CardContent className="p-8">
                  {/* Logo */}
                  <div className="text-center mb-8">
                    <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
                      <GraduationCap className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold">ClassPlus Browser</h1>
                    <p className="text-muted-foreground text-sm mt-1">Access your courses anywhere</p>
                  </div>

                  {/* Input */}
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium flex items-center gap-2 mb-2">
                        <Home className="w-4 h-4" />
                        Organization Code
                      </label>
                      <Input
                        type="text"
                        value={orgCode}
                        onChange={(e) => setOrgCode(e.target.value)}
                        placeholder="Enter your org code (e.g., myinstitute)"
                        onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                        className="h-12"
                      />
                      <span className="text-xs text-muted-foreground mt-1 block">
                        This is usually part of your app URL
                      </span>
                    </div>

                    <Button
                      onClick={handleLogin}
                      disabled={loading}
                      className="w-full h-12 bg-blue-600 hover:bg-blue-700"
                    >
                      {loading ? (
                        <>
                          <span>Connecting...</span>
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin ml-2" />
                        </>
                      ) : (
                        <>
                          <span>Browse Courses</span>
                          <ChevronRight className="w-5 h-5 ml-2" />
                        </>
                      )}
                    </Button>

                    {error && (
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-destructive text-sm text-center"
                      >
                        {error}
                      </motion.p>
                    )}
                  </div>

                  {/* Back button */}
                  <Button
                    variant="ghost"
                    onClick={onBack}
                    className="w-full mt-4"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Home
                  </Button>
                </CardContent>
              </Card>

              {/* Features */}
              <div className="flex justify-center gap-6 mt-8 text-white/70">
                <div className="flex items-center gap-2 text-sm">
                  <Play className="w-5 h-5" />
                  <span>Stream Videos</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <FileText className="w-5 h-5" />
                  <span>View PDFs</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Folder className="w-5 h-5" />
                  <span>Browse Folders</span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Batches Screen */}
        {screen === 'batches' && (
          <motion.div
            key="batches"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-screen"
          >
            {/* Header */}
            <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-xl border-b border-border">
              <div className="container mx-auto px-4 py-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={goBack} title="Change Organization">
                      <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={onBack} title="Back to Home">
                      <Home className="w-5 h-5" />
                    </Button>
                    <div>
                      <span className="text-xs text-muted-foreground">Organization</span>
                      <h2 className="font-semibold">{orgName}</h2>
                    </div>
                  </div>
                  <div className="relative max-w-xs flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search courses..."
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>
            </header>

            {/* Stats bar */}
            <div className="container mx-auto px-4 py-3 text-sm text-muted-foreground flex flex-wrap items-center justify-between gap-3">
              <div>
                {filteredBatches.length} of {batches.length} courses
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={goBack}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Change Organization
                </Button>
                <Button variant="outline" size="sm" onClick={onBack}>
                  <Home className="w-4 h-4 mr-2" />
                  Back to Home
                </Button>
              </div>
            </div>

            {/* Content */}
            <div className="container mx-auto px-4 pb-8">
              {error && (
                <div className="mb-6 rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-destructive">
                  <p className="font-medium">Unable to load courses.</p>
                  <p className="text-sm mt-1">{error}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={() => loadBatches(orgCode, hash)}
                  >
                    Retry
                  </Button>
                </div>
              )}
              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                    <p className="text-muted-foreground">Loading courses...</p>
                  </div>
                </div>
              ) : filteredBatches.length === 0 ? (
                <div className="text-center py-20 text-muted-foreground">
                  No courses found for this organization.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredBatches.map((batch) => (
                    <motion.div
                      key={batch.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      whileHover={{ scale: 1.02, y: -5 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Card
                        className="h-full cursor-pointer hover:border-primary/50 hover:shadow-xl"
                        onClick={() => openBatch(batch)}
                      >
                        <div className="aspect-video bg-muted overflow-hidden rounded-t-xl">
                          {batch.thumbnail ? (
                            <img
                              src={batch.thumbnail}
                              alt={batch.name}
                              className="w-full h-full object-contain bg-muted"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                const placeholder = e.currentTarget.nextElementSibling as HTMLElement;
                                if (placeholder) placeholder.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <div className={`w-full h-full items-center justify-center bg-gradient-to-br from-blue-500/20 to-purple-500/20 ${batch.thumbnail ? 'hidden' : 'flex'}`}>
                            <GraduationCap className="w-12 h-12 text-muted-foreground/50" />
                          </div>
                        </div>
                        <CardContent className="p-4">
                          <h3 className="font-semibold line-clamp-2 mb-2" title={batch.name}>
                            {batch.name}
                          </h3>
                          <span className={`text-sm font-medium ${batch.price > 0 ? 'text-primary' : 'text-green-500'}`}>
                            {batch.price > 0 ? `₹${batch.price}` : 'Free'}
                          </span>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Content Screen */}
        {screen === 'content' && (
          <motion.div
            key="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-screen"
          >
            {/* Header */}
            <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-xl border-b border-border">
              <div className="container mx-auto px-4 py-4">
                <div className="flex items-center gap-4">
                  <Button variant="ghost" size="icon" onClick={goBack} title="Go Back">
                    <ArrowLeft className="w-5 h-5" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={onBack} title="Back to Home">
                    <Home className="w-5 h-5" />
                  </Button>
                  
                  {/* Breadcrumbs */}
                  <nav className="flex items-center gap-1 overflow-x-auto flex-1">
                    {navigationStack.map((item, index) => (
                      <div key={index} className="flex items-center gap-1">
                        {index > 0 && <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
                        <button
                          onClick={() => navigateTo(index)}
                          className={`px-2 py-1 rounded text-sm whitespace-nowrap ${
                            index === navigationStack.length - 1
                              ? 'font-medium text-foreground'
                              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                          }`}
                        >
                          {item.name.length > 20 ? item.name.substring(0, 20) + '...' : item.name}
                        </button>
                      </div>
                    ))}
                  </nav>
                </div>
              </div>
            </header>

            {/* Folder info */}
            <div className="container mx-auto px-4 py-4 border-b border-border/50">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="font-semibold">{navigationStack[navigationStack.length - 1]?.name || 'Content'}</h3>
                  <span className="text-sm text-muted-foreground">{contents.length} items</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={goBack}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Courses
                  </Button>
                  <Button variant="outline" size="sm" onClick={onBack}>
                    <Home className="w-4 h-4 mr-2" />
                    Back to Home
                  </Button>
                </div>
              </div>
            </div>

            {/* Content list */}
            <div className="container mx-auto px-4 py-4">
              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                    <p className="text-muted-foreground">Loading content...</p>
                  </div>
                </div>
              ) : contents.length === 0 ? (
                <div className="text-center py-20 text-muted-foreground">
                  No content found in this folder.
                </div>
              ) : (
                <div className="space-y-2">
                  {contents.map((item) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      whileHover={{ x: 5 }}
                      className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border hover:border-primary/50 cursor-pointer transition-all"
                      onClick={() => handleContentClick(item)}
                    >
                      <div className={`w-12 h-12 rounded-xl bg-muted flex items-center justify-center ${getIconColor(item.type)}`}>
                        {getContentIcon(item.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate" title={item.name}>
                          {item.name}
                        </h4>
                        <span className="text-sm text-muted-foreground capitalize">{item.type}</span>
                      </div>
                      {item.type === 'folder' && (
                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Video Player Modal */}
      <Dialog open={videoModalOpen} onOpenChange={setVideoModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="pr-8 truncate">{currentVideo?.name}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Choose your preferred player:</p>
            
            <div className="space-y-3">
              <Button
                onClick={() => playVideo(1)}
                className="w-full h-16 justify-start gap-4 bg-blue-600 hover:bg-blue-700"
              >
                <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                  <Play className="w-6 h-6" />
                </div>
                <div className="text-left">
                  <div className="font-medium">Player 1</div>
                  <div className="text-xs opacity-80">playernew-cp (Recommended)</div>
                </div>
              </Button>
              
              <Button
                onClick={() => playVideo(2)}
                variant="outline"
                className="w-full h-16 justify-start gap-4"
              >
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                  <Play className="w-6 h-6" />
                </div>
                <div className="text-left">
                  <div className="font-medium">Player 2</div>
                  <div className="text-xs text-muted-foreground">DRM Player</div>
                </div>
              </Button>
            </div>

            {/* Video URL */}
            <div className="p-3 rounded-lg bg-muted">
              <span className="text-xs text-muted-foreground block mb-1">Video URL:</span>
              <div className="flex items-center gap-2">
                <code className="text-xs flex-1 truncate">{currentVideo?.url}</code>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  onClick={copyVideoUrl}
                >
                  {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
