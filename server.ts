import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', system: 'TrackSense Telemetry Hub', time: new Date().toISOString() });
  });

  // AI RDSO Track Analysis & Maintenance Report endpoint
  app.post('/api/ai/report', async (req, res) => {
    try {
      const { defectLogs, trackStats } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;

      if (!apiKey) {
        // Fallback structured RDSO maintenance advice if API key isn't provided
        return res.json({
          report: generateFallbackReport(defectLogs, trackStats),
          source: 'rule-based-engine'
        });
      }

      const ai = new GoogleGenAI({ apiKey });
      const prompt = `You are a Senior Track Maintenance Engineer for Indian Railways (RDSO Standard).
Analyze the following sensor-fused telemetry report from TrackSense monitoring trolley over a 2.5-meter mock track section:

Track Metadata:
- Track Gauge Standard: Broad Gauge (Nominal 1676 mm)
- Section Distance: 0.00m to 2.50m
- Total Defect Count: ${defectLogs ? defectLogs.length : 0}
- Telemetry Summary: ${JSON.stringify(trackStats || {})}

Defect Log Records:
${JSON.stringify(defectLogs || [], null, 2)}

Provide a concise, formal Indian Railways Inspection Directive including:
1. Executive Safety Assessment (Safe / Caution / Speed Restriction / Emergency Block)
2. Detailed Anomaly Analysis per location marker
3. Immediate Track Maintenance Action Items (e.g. Tamping, Gauge Correction, Fishplate Tightening, Rail Grinding)
4. Recommended Track Inspection Interval & RDSO Code References. Keep format clear and structured with markdown headings.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      return res.json({
        report: response.text || generateFallbackReport(defectLogs, trackStats),
        source: 'gemini-2.5-flash'
      });
    } catch (error: any) {
      console.error('Error generating AI track report:', error);
      return res.status(500).json({
        error: error.message || 'Failed to generate track inspection report',
        report: generateFallbackReport(req.body.defectLogs, req.body.trackStats),
        source: 'fallback-on-error'
      });
    }
  });

  // Vite middleware for development vs static build for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`TrackSense Server running on http://0.0.0.0:${PORT}`);
  });
}

function generateFallbackReport(defectLogs: any[], trackStats: any) {
  const criticalCount = (defectLogs || []).filter(d => d.confidenceScore >= 70).length;
  const moderateCount = (defectLogs || []).filter(d => d.confidenceScore >= 40 && d.confidenceScore < 70).length;

  let safetyRating = "NORMAL / OPERATIONAL";
  if (criticalCount > 0) safetyRating = "CRITICAL / SPEED RESTRICTION REQUIRED (PSR 20 km/h)";
  else if (moderateCount > 0) safetyRating = "CAUTION / MAINTENANCE SCHEDULED";

  return `### 🚆 INDIAN RAILWAYS TRACK MAINTENANCE DIRECTIVE (RDSO LAB DEMO)

**1. Safety & Operational Status:** ${safetyRating}
- **Inspection Section:** Mock Trackbed Unit 4 (0.00m - 2.50m)
- **Nominal Gauge:** 1676 mm Broad Gauge
- **Total Defects Identified:** ${defectLogs ? defectLogs.length : 0} (Critical: ${criticalCount}, Moderate: ${moderateCount})

---

### **2. Location-wise Sensor Fusion Findings:**
${(defectLogs && defectLogs.length > 0) ? defectLogs.map((d: any) => `
- **Location ${Number(d.location).toFixed(2)}m:** ${d.defectType.toUpperCase()}
  - *Confidence Score:* **${d.confidenceScore}%** (${d.severity} Severity)
  - *Sensor Inputs:* Gauge = ${d.gaugeMm} mm | Peak Vibration = ${d.vibrationG} G
  - *Root Cause:* ${d.defectType === 'Surface Corrugation' ? 'High-frequency vertical wheel bounce due to rail head wave crests.' : d.defectType === 'Gauge Widening' ? 'Lateral fastener degradation or sleeper movement.' : 'Fishplate bolt gap / joint displacement.'}
`).join('\n') : '- No critical defects recorded across the 2.5m track section. Track geometry meets RDSO tolerances.'}

---

### **3. Recommended Engineering Action Plan:**
1. **At Corrugation Zones:** Deploy portable rail grinder to restore longitudinal rail head profile.
2. **At Gauge Widening Zones:** Re-gauge ties using standard ERC clips and liners; inspect sleeper dowels.
3. **At Joint Anomalies:** Torque fishbolts to 550 Nm; apply rail joint lubricant; check gap clearance.

---

*Generated by TrackSense Fusion Engine • Indian Railways Track Maintenance Systems*`;
}

startServer();
