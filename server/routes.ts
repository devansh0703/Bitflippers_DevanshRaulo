import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { insertPatientSchema, insertReportSchema, insertEhrSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  // Patient routes
  app.post("/api/patients", async (req, res) => {
    const parsed = insertPatientSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json(parsed.error);
    }
    const patient = await storage.createPatient(parsed.data);
    res.status(201).json(patient);
  });

  app.get("/api/patients/:id", async (req, res) => {
    const patient = await storage.getPatient(parseInt(req.params.id));
    if (!patient) return res.status(404).send("Patient not found");
    res.json(patient);
  });

  // Report routes
  app.post("/api/reports", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== "paramedic") {
      return res.status(403).send("Unauthorized");
    }

    const parsed = insertReportSchema.safeParse({
      ...req.body,
      paramedicId: req.user.id,
    });
    if (!parsed.success) {
      return res.status(400).json(parsed.error);
    }
    const report = await storage.createReport(parsed.data);
    res.status(201).json(report);
  });

  app.get("/api/reports", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Unauthorized");
    }

    let reports;
    if (req.user.role === "paramedic") {
      reports = await storage.getReportsByParamedic(req.user.id);
    } else {
      reports = await storage.getAllReports();
    }
    res.json(reports);
  });

  app.patch("/api/reports/:id", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== "doctor") {
      return res.status(403).send("Unauthorized");
    }

    try {
      const report = await storage.updateReport(parseInt(req.params.id), req.body);
      res.json(report);
    } catch (error) {
      res.status(404).send("Report not found");
    }
  });

  // EHR routes
  app.post("/api/ehr", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== "doctor") {
      return res.status(403).send("Unauthorized");
    }

    const parsed = insertEhrSchema.safeParse({
      ...req.body,
      doctorId: req.user.id,
    });
    if (!parsed.success) {
      return res.status(400).json(parsed.error);
    }

    const ehr = await storage.createEhrRecord(parsed.data);
    res.status(201).json(ehr);
  });

  app.get("/api/ehr/patient/:patientId", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Unauthorized");
    }

    const records = await storage.getEhrRecordsByPatient(parseInt(req.params.patientId));
    res.json(records);
  });

  const httpServer = createServer(app);
  return httpServer;
}