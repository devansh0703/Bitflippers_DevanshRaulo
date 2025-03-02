import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { insertCaseSchema, insertPatientSchema } from "@shared/schema";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "default-key");

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  // Patient routes
  app.post("/api/patients", async (req, res) => {
    const data = insertPatientSchema.parse(req.body);
    const patient = await storage.createPatient(data);
    res.json(patient);
  });

  // Case routes
  app.post("/api/cases", async (req, res) => {
    const data = insertCaseSchema.parse(req.body);
    const caseData = await storage.createCase(data);
    
    // Generate AI triage
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const prompt = `Given these vitals and symptoms, classify the emergency severity as IMMEDIATE, URGENT, or DELAYED. Also provide a brief explanation.\n\nVitals: ${JSON.stringify(data.vitals)}\nSymptoms: ${data.symptoms}`;
    
    const result = await model.generateContent(prompt);
    const triageResult = await result.response.text();
    
    const updatedCase = await storage.updateCaseTriageResult(caseData.id, triageResult);
    res.json(updatedCase);
  });

  app.get("/api/cases", async (req, res) => {
    const cases = await storage.getAllCases();
    res.json(cases);
  });

  app.post("/api/cases/:id/treatment", async (req, res) => {
    const caseId = parseInt(req.params.id);
    const { recommendation } = req.body;
    
    const updatedCase = await storage.updateCaseTreatment(caseId, recommendation);
    res.json(updatedCase);
  });

  const httpServer = createServer(app);
  return httpServer;
}
