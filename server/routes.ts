import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { ehrService } from "./ehr";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "default_key");

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  app.post("/api/reports", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== "paramedic") {
      return res.sendStatus(401);
    }

    // For new patients, add them to the EHR system
    let ehrPatientId = req.body.ehrPatientId;
    
    if (!ehrPatientId && req.body.patientName) {
      // This is a new patient, create an EHR record
      try {
        // Create new patient in EHR system
        const newPatient = ehrService.createPatient({
          name: req.body.patientName,
          age: req.body.patientAge,
          gender: req.body.patientGender,
          allergies: req.body.allergies || "None documented",
          medicalHistory: req.body.medicalHistory || "No prior history",
          medications: req.body.currentMedications || "None",
          recentVisits: []
        });
        
        // Use this patient ID for the report
        ehrPatientId = newPatient.id;
        req.body.ehrPatientId = ehrPatientId;
      } catch (error) {
        console.error("Failed to create EHR record:", error);
        // Continue with report creation even if EHR creation fails
      }
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

  // New resource management routes
  app.get("/api/resources", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }
    const resources = await storage.getResources();
    res.json(resources);
  });

  app.post("/api/resources", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== "doctor") {
      return res.sendStatus(401);
    }
    const resource = await storage.createResource(req.body);
    res.json(resource);
  });

  app.patch("/api/resources/:id/status", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== "doctor") {
      return res.sendStatus(401);
    }
    const resource = await storage.updateResourceStatus(parseInt(req.params.id), req.body.status);
    res.json(resource);
  });

  // Generate treatment recommendation
  app.post("/api/reports/:id/treatment", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== "doctor") {
      return res.sendStatus(401);
    }

    const reportId = parseInt(req.params.id);
    const report = await storage.getReportById(reportId);
    
    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    // Process with Gemini
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const prompt = `You are an Emergency Medical Treatment AI assistant. Based on the following patient data, provide:
1. Recommend medications (list up to 3 specific medications with dosages if applicable)
2. Suggested interventions or procedures (list 2-3 specific steps for immediate care)

Be precise and medical-professional appropriate in your recommendations.

Patient Data:
- Age: ${report.patientAge}, Gender: ${report.patientGender}
- Vitals: HR ${report.heartRate}bpm, BP ${report.bloodPressure}, RR ${report.respiratoryRate}, O2 ${report.oxygenSaturation}%, Temp ${report.temperature}°C
- Complaints: ${report.complaints}
- Medical History: ${report.medicalHistory || 'None'}
- Allergies: ${report.allergies || 'None'}
- Current Medications: ${report.currentMedications || 'None'}
- Triage Assessment: ${report.triageAssessment?.severity || 'Not available'} - ${report.triageAssessment?.explanation || 'Not available'}

Format your response in two sections:
MEDICATIONS:
[your recommendations]

INTERVENTIONS:
[your recommendations]`;

    try {
      const result = await model.generateContent(prompt);
      const response = result.response.text();

      // Split the response into medications and interventions
      const medicationsMatch = response.match(/MEDICATIONS:([\s\S]*?)(?=INTERVENTIONS:|$)/i);
      const interventionsMatch = response.match(/INTERVENTIONS:([\s\S]*)/i);

      const medications = medicationsMatch ? medicationsMatch[1].trim() : "No specific medications recommended.";
      const interventions = interventionsMatch ? interventionsMatch[1].trim() : "No specific interventions recommended.";

      const treatment = {
        medications,
        interventions,
        approved: false,
        generatedAt: new Date().toISOString()
      };

      const updatedReport = await storage.updateReportTreatment(reportId, treatment);
      res.json(updatedReport);
    } catch (error) {
      console.error("Gemini API error:", error);
      res.status(500).json({ message: "Failed to generate treatment recommendations" });
    }
  });

  // Approve treatment
  app.patch("/api/reports/:id/treatment/approve", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== "doctor") {
      return res.sendStatus(401);
    }

    const reportId = parseInt(req.params.id);
    const report = await storage.getReportById(reportId);
    
    if (!report || !report.treatment) {
      return res.status(404).json({ message: "Report or treatment not found" });
    }

    const updatedTreatment = {
      ...report.treatment,
      approved: true,
      approvedAt: new Date().toISOString()
    };

    const updatedReport = await storage.updateReportTreatment(reportId, updatedTreatment);
    
    // If report is linked to an EHR patient, update the patient record
    if (report.ehrPatientId) {
      ehrService.addEncounter(report.ehrPatientId, updatedReport);
    }
    
    res.json(updatedReport);
  });
  
  // EHR API Endpoints
  
  // Get all patients (limited data for search)
  app.get("/api/ehr/patients", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }
    
    const query = req.query.q as string;
    if (query) {
      const results = ehrService.searchPatients(query);
      return res.json(results);
    }
    
    const patients = ehrService.getAllPatients();
    res.json(patients);
  });
  
  // Get patient details by ID
  app.get("/api/ehr/patients/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }
    
    const patientId = parseInt(req.params.id);
    const patient = ehrService.getPatientById(patientId);
    
    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }
    
    res.json(patient);
  });

  const httpServer = createServer(app);
  return httpServer;
}