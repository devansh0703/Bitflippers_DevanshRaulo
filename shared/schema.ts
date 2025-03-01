import { pgTable, text, serial, integer, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull(), // 'paramedic' or 'doctor'
});

export const reports = pgTable("reports", {
  id: serial("id").primaryKey(),
  paramedicId: integer("paramedic_id").notNull(),
  patientName: text("patient_name").notNull(),
  patientAge: integer("patient_age").notNull(),
  patientGender: text("patient_gender").notNull(),
  heartRate: integer("heart_rate").notNull(),
  bloodPressure: text("blood_pressure").notNull(),
  respiratoryRate: integer("respiratory_rate").notNull(),
  oxygenSaturation: integer("oxygen_saturation").notNull(),
  temperature: integer("temperature").notNull(),
  complaints: text("complaints").notNull(),
  medicalHistory: text("medical_history"),
  allergies: text("allergies"),
  currentMedications: text("current_medications"),
  location: jsonb("location").notNull(), // { lat: number, lon: number }
  triageAssessment: jsonb("triage_assessment"), // { severity: string, explanation: string }
  treatment: jsonb("treatment"), // { medications: string, interventions: string, approved: boolean }
  ehrPatientId: integer("ehr_patient_id"), // ID of the patient in the EHR system if pre-existing
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// New table for resource tracking
export const resources = pgTable("resources", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(), // 'ambulance', 'bed', 'staff', 'supplies'
  status: text("status").notNull(), // 'available', 'occupied', 'maintenance'
  details: jsonb("details").notNull(), // Additional details specific to resource type
  location: jsonb("location"), // For mobile resources like ambulances
  lastUpdated: timestamp("last_updated").notNull().defaultNow(),
});

// Type definitions for EHR system integration
export interface PatientVisit {
  date: string;
  reason: string;
  diagnosis: string;
  treatment: string;
}

export interface Patient {
  id: number;
  medicalRecordNumber: string;
  name: string;
  age: number;
  gender: string;
  bloodType: string;
  allergies: string;
  medicalHistory: string;
  medications: string;
  recentVisits: PatientVisit[];
}

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  role: true,
});

export const insertReportSchema = createInsertSchema(reports).pick({
  patientName: true,
  patientAge: true,
  patientGender: true,
  heartRate: true,
  bloodPressure: true,
  respiratoryRate: true,
  oxygenSaturation: true,
  temperature: true,
  complaints: true,
  medicalHistory: true,
  allergies: true,
  currentMedications: true,
  location: true,
});

// Extended report schema that includes EHR patient ID
export const insertReportWithEhrSchema = insertReportSchema.extend({
  ehrPatientId: z.number().optional()
});

export const insertResourceSchema = createInsertSchema(resources).pick({
  type: true,
  status: true,
  details: true,
  location: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Report = typeof reports.$inferSelect;
export type InsertReport = z.infer<typeof insertReportSchema>;
export type InsertReportWithEhr = z.infer<typeof insertReportWithEhrSchema>;
export type Resource = typeof resources.$inferSelect;
export type InsertResource = z.infer<typeof insertResourceSchema>;