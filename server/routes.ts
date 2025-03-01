import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

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
    const prompt = `You are a medical expert AI Triage, analyze this patient data:
      Name: ${report.patientName}
      Age: ${report.patientAge}
      Gender: ${report.patientGender}
      Heart Rate: ${report.heartRate} bpm
      Blood Pressure: ${report.bloodPressure} mmHg
      Respiratory Rate: ${report.respiratoryRate} breaths/min
      Oxygen Saturation: ${report.oxygenSaturation}%
      Temperature: ${report.temperature}°C
      Complaints: ${report.complaints}
      Medical History: ${report.medicalHistory}
      Allergies: ${report.allergies}
      Current Medications: ${report.currentMedications}
      
      Provide severity level (Immediate, Urgent, Delayed) and explanation.`;

    try {
      const result = await model.generateContent(prompt);
      const response = result.response.text();
      const [severity, ...explanation] = response.split("\n");
      
      const updatedReport = await storage.updateReportTriage(report.id, {
        severity: severity.trim(),
        explanation: explanation.join("\n").trim()
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
