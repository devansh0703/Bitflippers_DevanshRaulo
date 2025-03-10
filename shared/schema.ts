import { pgTable, text, serial, integer, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role", { enum: ["paramedic", "doctor"] }).notNull(),
  name: text("name").notNull(),
});

export const patients = pgTable("patients", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  age: integer("age").notNull(),
  gender: text("gender", { enum: ["male", "female", "other"] }).notNull(),
  medicalHistory: jsonb("medical_history").$type<string[]>(),
  allergies: jsonb("allergies").$type<string[]>(),
  medications: jsonb("medications").$type<string[]>(),
});

export const reports = pgTable("reports", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull(),
  paramedicId: integer("paramedic_id").notNull(),
  location: jsonb("location").$type<{lat: number, lng: number}>().notNull(),
  vitals: jsonb("vitals").$type<{
    heartRate: number,
    oxygenSaturation: number,
    bloodPressure: string,
    respirationRate: number
  }>().notNull(),
  symptoms: text("symptoms").array().notNull(),
  triageResult: jsonb("triage_result").$type<{
    severity: "immediate" | "urgent" | "delayed",
    explanation: string
  }>(),
  doctorRecommendation: text("doctor_recommendation"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const ehrRecords = pgTable("ehr_records", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull(),
  doctorId: integer("doctor_id").notNull(),
  diagnosis: text("diagnosis"),
  treatmentPlan: text("treatment_plan"),
  medications: jsonb("medications").$type<{
    name: string,
    dosage: string,
    frequency: string,
    duration: string
  }[]>(),
  labResults: jsonb("lab_results").$type<{
    test: string,
    result: string,
    date: string
  }[]>(),
  followUpDate: timestamp("follow_up_date"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users);
export const insertPatientSchema = createInsertSchema(patients);
export const insertReportSchema = createInsertSchema(reports);
export const insertEhrSchema = createInsertSchema(ehrRecords);

export type User = typeof users.$inferSelect;
export type Patient = typeof patients.$inferSelect;
export type Report = typeof reports.$inferSelect;
export type EhrRecord = typeof ehrRecords.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertPatient = z.infer<typeof insertPatientSchema>;
export type InsertReport = z.infer<typeof insertReportSchema>;
export type InsertEhrRecord = z.infer<typeof insertEhrSchema>;