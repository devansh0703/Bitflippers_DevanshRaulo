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
  gender: text("gender").notNull(),
  medicalHistory: text("medical_history"),
  allergies: text("allergies"),
  medications: text("medications"),
});

export const cases = pgTable("cases", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").references(() => patients.id),
  paramedicId: integer("paramedic_id").references(() => users.id),
  doctorId: integer("doctor_id").references(() => users.id),
  status: text("status", { enum: ["open", "closed"] }).notNull().default("open"),
  location: jsonb("location").notNull(),
  vitals: jsonb("vitals").notNull(),
  symptoms: text("symptoms").notNull(),
  triageResult: jsonb("triage_result"),
  treatmentRecommendation: text("treatment_recommendation"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(users);
export const insertPatientSchema = createInsertSchema(patients);
export const insertCaseSchema = createInsertSchema(cases);

export type User = typeof users.$inferSelect;
export type Patient = typeof patients.$inferSelect;
export type Case = typeof cases.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertPatient = z.infer<typeof insertPatientSchema>;
export type InsertCase = z.infer<typeof insertCaseSchema>;

export const vitalsSchema = z.object({
  heartRate: z.number(),
  oxygenSaturation: z.number(),
  bloodPressure: z.object({
    systolic: z.number(),
    diastolic: z.number()
  }),
  respirationRate: z.number()
});

export const locationSchema = z.object({
  lat: z.number(),
  lng: z.number(),
  address: z.string()
});

export type Vitals = z.infer<typeof vitalsSchema>;
export type Location = z.infer<typeof locationSchema>;
