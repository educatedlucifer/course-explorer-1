import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Common headers for ClassPlus API
const getHeaders = (token: string | null = null) => {
  const headers: Record<string, string> = {
    'accept': 'application/json, text/plain, */*',
    'accept-language': 'EN',
    'api-version': '40',
    'app-version': '1.4.73.2',
    'build-number': '40',
    'content-type': 'application/json',
    'device-details': 'Xiaomi_Redmi_Note_SDK-32',
    'device-id': 'c28d3cb16bbdac01',
    'host': 'api.classplusapp.com',
    'region': 'IN',
    'user-agent': 'Mobile-Android'
  };
  if (token) {
    headers['x-access-token'] = token;
  }
  return headers;
};

// URL transformation functions
function isVideoUrl(url: string): boolean {
  if (!url) return false;
  const patterns = [
    /\.m3u8$/i, /\.mp4$/i, /\.mpd$/i,
    /master\.m3u8/i, /playlist\.m3u8/i,
    /classplusapp\.com\/drm/i, /testbook\.com/i,
    /media-cdn\.classplusapp\.com/i, /tb-video\.classplusapp\.com/i
  ];
  return patterns.some(p => p.test(url));
}

function transformVideoUrl(url: string): string {
  if (!url) return url;
  
  if (url.includes('media-cdn.classplusapp.com/tencent/')) {
    return url.replace(/\/[^/]+$/, '/master.m3u8');
  }
  if (url.includes('media-cdn.classplusapp.com') && url.endsWith('.jpg')) {
    const parts = url.split('/');
    const identifier = parts[parts.length - 3];
    return `https://media-cdn.classplusapp.com/alisg-cdn-a.classplusapp.com/${identifier}/master.m3u8`;
  }
  if (url.includes('tencdn.classplusapp.com') && url.endsWith('.jpg')) {
    const parts = url.split('/');
    const identifier = parts[parts.length - 2];
    return `https://media-cdn.classplusapp.com/tencent/${identifier}/master.m3u8`;
  }
  if (url.includes('cpvideocdn.testbook.com') && url.endsWith('.png')) {
    const match = url.match(/\/streams\/([a-f0-9]{24})\//);
    const videoId = match ? match[1] : url.split('/').slice(-2)[0];
    return `https://cpvod.testbook.com/${videoId}/playlist.m3u8`;
  }
  if (url.includes('media-cdn.classplusapp.com/drm/') && url.endsWith('.png')) {
    const parts = url.split('/');
    const videoId = parts[parts.length - 3];
    return `https://media-cdn.classplusapp.com/drm/${videoId}/playlist.m3u8`;
  }
  if (url.includes('media-cdn.classplusapp.com') && 
      (url.includes('cc/') || url.includes('lc/') || url.includes('uc/') || url.includes('dy/')) && 
      url.endsWith('.png')) {
    return url.replace('thumbnail.png', 'master.m3u8');
  }
  if (url.includes('tb-video.classplusapp.com') && url.endsWith('.jpg')) {
    const videoId = url.split('/').pop()?.split('.')[0];
    return `https://tb-video.classplusapp.com/${videoId}/master.m3u8`;
  }
  
  return url;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get("action");

    // Get org info and hash
    if (action === "org") {
      const orgCode = url.searchParams.get("orgCode");
      if (!orgCode) {
        return new Response(JSON.stringify({ error: "orgCode is required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Get org info
      const orgResponse = await fetch(`https://api.classplusapp.com/v2/orgs/${orgCode}`, {
        headers: { 'User-Agent': 'Mobile-Android' }
      });
      const orgData = await orgResponse.json();

      if (orgData.status !== 'success') {
        return new Response(JSON.stringify({ error: orgData.message || 'Organization not found' }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Get hash from tutor info API
      let hash = null;
      try {
        const tutorRes = await fetch(
          `https://api.classplusapp.com/v2/course/preview/tutor/info?orgId=${orgData.data.orgId}`,
          { headers: { 'User-Agent': 'Mobile-Android', 'region': 'IN' } }
        );
        const tutorData = await tutorRes.json();
        hash = tutorData?.data?.hash || tutorData?.data?.courses?.[0]?.hash || null;
      } catch (e) {
        console.log('Tutor info fallback failed:', e);
      }

      return new Response(JSON.stringify({
        success: true,
        orgId: orgData.data.orgId,
        orgName: orgData.data.orgName || orgCode,
        hash: hash
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get all batches/courses for an org
    if (action === "batches") {
      const orgCode = url.searchParams.get("orgCode");
      const hash = url.searchParams.get("hash");

      if (!orgCode || !hash) {
        return new Response(JSON.stringify({ error: "orgCode and hash are required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const headers = {
        'accept': 'application/json, text/plain, */*',
        'region': 'IN',
        'accept-language': 'EN',
        'Api-Version': '22',
        'tutorWebsiteDomain': `https://${orgCode}.courses.store`,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      };

      let allCourses: any[] = [];
      let page = 0;
      const pageSize = 100;

      while (true) {
        const response = await fetch(
          `https://api.classplusapp.com/v2/course/preview/similar/${hash}?limit=${pageSize}&page=${page}`,
          { headers }
        );
        const data = await response.json();
        
        const courses = data?.data?.coursesData || [];
        if (courses.length === 0) break;
        
        allCourses = allCourses.concat(courses);
        if (courses.length < pageSize) break;
        page++;
      }

      return new Response(JSON.stringify({
        success: true,
        total: allCourses.length,
        batches: allCourses.map((c: any) => ({
          id: c.id,
          name: c.name,
          thumbnail: c.thumbnail || c.imageUrl || null,
          price: c.finalPrice || 0,
          description: c.shortDescription || ''
        }))
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get batch token/hash for content
    if (action === "batch-token") {
      const orgCode = url.searchParams.get("orgCode");
      const courseId = url.searchParams.get("courseId");

      if (!orgCode || !courseId) {
        return new Response(JSON.stringify({ error: "orgCode and courseId are required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const headers = {
        'Accept': 'application/json, text/plain, */*',
        'region': 'IN',
        'accept-language': 'EN',
        'Api-Version': '22',
        'tutorWebsiteDomain': `https://${orgCode}.courses.store`
      };

      const response = await fetch(
        `https://api.classplusapp.com/v2/course/preview/org/info?courseId=${courseId}`,
        { headers }
      );
      const data = await response.json();

      if (data.data?.hash) {
        return new Response(JSON.stringify({
          success: true,
          hash: data.data.hash,
          name: data.data.name
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } else {
        return new Response(JSON.stringify({ error: 'Batch token not found' }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Get content list for a batch
    if (action === "content") {
      const batchToken = url.searchParams.get("batchToken");
      const folderId = url.searchParams.get("folderId") || "0";

      if (!batchToken) {
        return new Response(JSON.stringify({ error: "batchToken is required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const headers = getHeaders();

      const response = await fetch(
        `https://api.classplusapp.com/v2/course/preview/content/list/${batchToken}?folderId=${folderId}&limit=9999`,
        { headers }
      );
      const data = await response.json();

      const contents = data?.data || [];

      // Process and transform URLs
      const processedContents = contents.map((item: any) => {
        let itemUrl = item.url || item.thumbnailUrl || '';
        let type = 'file';
        
        if (item.contentType === 1) {
          type = 'folder';
        } else {
          itemUrl = transformVideoUrl(itemUrl);
          if (isVideoUrl(itemUrl)) {
            type = 'video';
          } else if (itemUrl.toLowerCase().endsWith('.pdf')) {
            type = 'pdf';
          } else if (/\.(jpg|jpeg|png|gif|webp)$/i.test(itemUrl)) {
            type = 'image';
          }
        }
        
        return {
          id: item.id,
          name: item.name,
          type,
          url: itemUrl,
          thumbnail: item.thumbnailUrl || null
        };
      });

      return new Response(JSON.stringify({
        success: true,
        contents: processedContents
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get signed URL for video playback
    if (action === "signed-url") {
      const videoUrl = url.searchParams.get("url");
      
      if (!videoUrl) {
        return new Response(JSON.stringify({ error: "URL is required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const isDrm = videoUrl.includes('/drm/') || videoUrl.includes('playlist.m3u8');
      let signedUrl = videoUrl;

      try {
        if (isDrm) {
          const response = await fetch(
            `https://itsvchoudharydrm.vercel.app/api?url=${encodeURIComponent(videoUrl)}&auth=@veerjaatoffline`
          );
          const data = await response.json();
          signedUrl = data.url || data.signedUrl || videoUrl;
        } else {
          const response = await fetch(
            `https://playernew-cp.vercel.app/get_signed_url?url=${encodeURIComponent(videoUrl)}`
          );
          const data = await response.json();
          signedUrl = data.url || data.signedUrl || videoUrl;
        }
      } catch (e) {
        console.error('Signed URL error:', e);
      }

      return new Response(JSON.stringify({
        success: true,
        signedUrl,
        isDrm
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
