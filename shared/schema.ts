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
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

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

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Report = typeof reports.$inferSelect;
export type InsertReport = z.infer<typeof insertReportSchema>;
