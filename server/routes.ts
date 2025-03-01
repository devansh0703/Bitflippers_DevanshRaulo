import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "default_key");

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  app.post("/api/reports", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== "paramedic") {
      return res.sendStatus(401);
    }

    const report = await storage.createReport(req.user.id, req.body);

    // Process with Gemini
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const prompt = `You are an Emergency Medical Triage AI assistant. Analyze the following patient data and provide ONLY:
1. A severity level (must be exactly one of: IMMEDIATE, URGENT, or DELAYED)
2. A brief, clear explanation in 2-3 sentences maximum.

Patient Data:
- Age: ${report.patientAge}, Gender: ${report.patientGender}
- Vitals: HR ${report.heartRate}bpm, BP ${report.bloodPressure}, RR ${report.respiratoryRate}, O2 ${report.oxygenSaturation}%, Temp ${report.temperature}°C
- Complaints: ${report.complaints}
- Medical History: ${report.medicalHistory || 'None'}
- Allergies: ${report.allergies || 'None'}
- Current Medications: ${report.currentMedications || 'None'}

Format your response exactly as:
SEVERITY: [level]
EXPLANATION: [your brief explanation]`;

    try {
      const result = await model.generateContent(prompt);
      const response = result.response.text();
      const [severityLine, explanationLine] = response.split('\n');

      const severity = severityLine.replace('SEVERITY:', '').trim();
      const explanation = explanationLine.replace('EXPLANATION:', '').trim();

      const updatedReport = await storage.updateReportTriage(report.id, {
        severity,
        explanation
      });

      res.json(updatedReport);
    } catch (error) {
      console.error("Gemini API error:", error);
      res.json(report);
    }
  });

  app.get("/api/reports", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }

    const reports = await storage.getReports();

    if (req.user.role === "paramedic") {
      // Filter reports for specific paramedic
      res.json(reports.filter(r => r.paramedicId === req.user.id));
    } else {
      // Doctors can see all reports
      res.json(reports);
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}