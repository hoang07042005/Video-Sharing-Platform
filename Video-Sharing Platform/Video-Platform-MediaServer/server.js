const NodeMediaServer = require('node-media-server');
const express = require('express');
const cors = require('cors');
const http = require('http');
const WebSocket = require('ws');
const { spawn } = require('child_process');
const axios = require('axios');
const path = require('path');
const fs = require('fs');
const ffmpegPath = require('ffmpeg-static');

const BACKEND_API_URL = 'http://localhost:5139/api';
const MEDIA_ROOT = path.join(__dirname, 'media');

// Track ffmpeg transcoder processes (for RTMP input from OBS)
const transcoders = new Map();

// ── 1. Node-Media-Server (handles RTMP) ────────────────────────────────────
const config = {
  rtmp: {
    port: 1935,
    chunk_size: 60000,
    gop_cache: true,
    ping: 30,
    ping_timeout: 60
  },
  http: {
    port: 8000,
    allow_origin: '*',
    mediaroot: MEDIA_ROOT
  }
};

const nms = new NodeMediaServer(config);

nms.on('prePublish', async (session) => {
  const streamKey = session.streamName;
  console.log(`[NMS] Stream started: ${streamKey}`);

  // Create output dir
  const outDir = path.join(MEDIA_ROOT, 'live', streamKey);
  fs.mkdirSync(outDir, { recursive: true });

  // Spawn FFmpeg to transcode RTMP → HLS
  const ffmpeg = spawn(ffmpegPath, [
    '-i', `rtmp://127.0.0.1:1935/live/${streamKey}`,
    '-c:v', 'libx264',
    '-preset', 'veryfast',
    '-tune', 'zerolatency',
    '-g', '60',
    '-sc_threshold', '0',
    '-c:a', 'aac',
    '-ar', '44100',
    '-b:a', '128k',
    '-f', 'hls',
    '-hls_time', '4',
    '-hls_playlist_type', 'event',
    path.join(outDir, 'index.m3u8')
  ]);

  ffmpeg.stderr.on('data', (d) => {
    // Uncomment for verbose FFmpeg debug:
    // console.log('[FFmpeg RTMP→HLS]', d.toString());
  });

  ffmpeg.on('close', (code) => {
    console.log(`[FFmpeg RTMP→HLS] closed with code ${code} for key ${streamKey}`);
    transcoders.delete(streamKey);
  });

  transcoders.set(streamKey, ffmpeg);

  // Notify backend
  try {
    await axios.post(`${BACKEND_API_URL}/livestreams/webhook/publish`, { streamKey });
    console.log(`[Webhook] Notified backend: stream ${streamKey} is live`);
  } catch (e) {
    console.error(`[Webhook] Failed to notify backend:`, e.message);
  }
});

nms.on('donePublish', async (session) => {
  const streamKey = session.streamName;
  console.log(`[NMS] Stream ended: ${streamKey}`);

  const ffmpeg = transcoders.get(streamKey);
  if (ffmpeg) {
    ffmpeg.kill('SIGINT');
    transcoders.delete(streamKey);
  }

  try {
    await axios.post(`${BACKEND_API_URL}/livestreams/webhook/done`, { streamKey });
    console.log(`[Webhook] Notified backend: stream ${streamKey} ended`);
  } catch (e) {
    console.error(`[Webhook] Failed to notify backend:`, e.message);
  }
});

nms.run();

// ── 2. Express: serve HLS files + WebSocket bridge ─────────────────────────
const app = express();
app.use(cors());
app.use(express.json());

app.post('/api/drop', async (req, res) => {
  const { streamKey } = req.body;
  if (!streamKey) return res.status(400).json({ error: 'missing streamKey' });

  // 1. Kill any active ffmpeg transcoder
  const ffmpeg = transcoders.get(streamKey);
  if (ffmpeg) {
    ffmpeg.kill('SIGINT');
    transcoders.delete(streamKey);
  }

  // 2. Query NMS API for active sessions and drop the one matching the streamKey
  try {
    const { data: sessions } = await axios.get('http://localhost:8000/api/server/sessions');
    for (const [id, session] of Object.entries(sessions)) {
      if (session.publishStreamPath && session.publishStreamPath.endsWith(`/${streamKey}`)) {
        await axios.delete(`http://localhost:8000/api/server/sessions/${id}`);
        console.log(`[API Drop] Dropped NMS session ${id} for stream ${streamKey}`);
      }
    }
  } catch (err) {
    console.error(`[API Drop] Failed to drop NMS session:`, err.message);
  }

  res.json({ success: true, message: `Dropped stream ${streamKey}` });
});

// Serve HLS static files on /live/...
app.use('/live', express.static(path.join(MEDIA_ROOT, 'live'), {
  setHeaders: (res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'no-cache');
  }
}));

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// ── 3. WebSocket Bridge: Browser → FFmpeg → HLS directly ───────────────────
wss.on('connection', (ws, req) => {
  console.log('[WS Bridge] Client connected:', req.url);
  const urlParams = new URLSearchParams(req.url.split('?')[1]);
  const streamKey = urlParams.get('key');

  if (!streamKey) {
    ws.close(1008, 'Stream key required');
    return;
  }

  // Create HLS output directory
  const outDir = path.join(MEDIA_ROOT, 'live', streamKey);
  fs.mkdirSync(outDir, { recursive: true });

  const hlsOutput = path.join(outDir, 'index.m3u8');
  console.log(`[WS Bridge] Starting FFmpeg → HLS at: ${hlsOutput}`);

  // FFmpeg reads webm from stdin, outputs HLS to disk directly (no RTMP needed)
  const ffmpeg = spawn(ffmpegPath, [
    '-fflags', 'nobuffer',
    '-i', '-',
    '-c:v', 'libx264',
    '-preset', 'ultrafast',
    '-tune', 'zerolatency',
    '-g', '30',
    '-sc_threshold', '0',
    '-c:a', 'aac',
    '-ar', '44100',
    '-b:a', '128k',
    '-f', 'hls',
    '-hls_time', '4',
    '-hls_playlist_type', 'event',
    '-hls_segment_filename', path.join(outDir, 'seg%03d.ts'),
    hlsOutput
  ]);

  ffmpeg.stderr.on('data', (data) => {
    const msg = data.toString();
    // Only log important messages
    if (msg.includes('Error') || msg.includes('error') || msg.includes('Opening') || msg.includes('m3u8')) {
      console.log('[FFmpeg Browser→HLS]', msg.trim());
    }
  });

  ffmpeg.on('close', (code, signal) => {
    console.log(`[FFmpeg Browser→HLS] Process closed - code: ${code}, signal: ${signal}`);
    ws.close();
  });

  ffmpeg.stdin.on('error', (e) => {
    if (e.code !== 'EPIPE') {
      console.error('[FFmpeg stdin error]', e.message);
    }
  });

  let ffmpegReady = false;
  let pendingChunks = [];

  // Wait a moment for ffmpeg to start, then notify backend
  setTimeout(async () => {
    ffmpegReady = true;
    // Flush any buffered chunks
    for (const chunk of pendingChunks) {
      ffmpeg.stdin.write(chunk);
    }
    pendingChunks = [];

    // Notify backend
    try {
      await axios.post(`${BACKEND_API_URL}/livestreams/webhook/publish`, { streamKey });
      console.log(`[Webhook] Browser stream ${streamKey} is live`);
    } catch (e) {
      console.error(`[Webhook] Failed:`, e.message);
    }
  }, 1000);

  ws.on('message', (msg) => {
    if (Buffer.isBuffer(msg)) {
      if (ffmpegReady) {
        ffmpeg.stdin.write(msg);
      } else {
        pendingChunks.push(msg);
      }
    }
  });

  ws.on('close', async () => {
    console.log('[WS Bridge] Client disconnected');
    ffmpeg.stdin.end();
    setTimeout(() => ffmpeg.kill('SIGINT'), 500);

    try {
      await axios.post(`${BACKEND_API_URL}/livestreams/webhook/done`, { streamKey });
      console.log(`[Webhook] Browser stream ${streamKey} ended`);
    } catch (e) {
      console.error(`[Webhook] Failed:`, e.message);
    }

    // ── VOD Conversion: HLS segments → MP4 ─────────────────────────────────
    // Wait for FFmpeg to finish writing last segments
    setTimeout(async () => {
      const vodPath = path.join(outDir, 'vod.mp4');
      const m3u8Path = path.join(outDir, 'index.m3u8');

      // Check if m3u8 exists
      if (!fs.existsSync(m3u8Path)) {
        console.log(`[VOD] No m3u8 found for ${streamKey}, skipping conversion`);
        return;
      }

      console.log(`[VOD] Converting HLS → MP4 for stream ${streamKey}...`);

      const vodFfmpeg = spawn(ffmpegPath, [
        '-y',
        '-protocol_whitelist', 'file,http,crypto,tcp,tls',
        '-allowed_extensions', 'ALL',
        '-i', m3u8Path,
        '-c', 'copy',
        vodPath
      ]);

      vodFfmpeg.stderr.on('data', (d) => {
        const msg = d.toString();
        if (msg.includes('Error') || msg.includes('error')) {
          console.error('[VOD FFmpeg]', msg.trim());
        }
      });

      vodFfmpeg.on('close', async (code) => {
        if (code === 0 && fs.existsSync(vodPath)) {
          console.log(`[VOD] MP4 created: ${vodPath}`);
          const vodUrl = `http://localhost:8001/live/${streamKey}/vod.mp4`;
          try {
            await axios.post(`${BACKEND_API_URL}/livestreams/webhook/vod`, { streamKey, vodUrl });
            console.log(`[VOD] Backend notified with vodUrl: ${vodUrl}`);
          } catch (e) {
            console.error(`[VOD] Failed to notify backend:`, e.message);
          }
        } else {
          console.error(`[VOD] Conversion failed with code ${code}`);
        }
      });
    }, 5000); // Wait 5s for last HLS segments to flush
  });
});

server.listen(8001, () => {
  console.log('[WS Bridge] Listening on ws://localhost:8001');
});
