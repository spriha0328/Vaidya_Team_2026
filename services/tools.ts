import { FunctionDeclaration, Type } from "@google/genai";

// ==========================================
// 🔌 TOOL DEFINITIONS & LOGIC
// ==========================================

export const findSpecialistTool: FunctionDeclaration = {
  name: "find_specialist",
  description: "Find medical specialists based on location and specialty.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      location: { type: Type.STRING, description: "City or region e.g. New York, Mumbai" },
      specialty: { type: Type.STRING, description: "Medical specialty e.g. Cardiologist, Dermatologist" },
    },
    required: ["location", "specialty"],
  },
};

export const drugInteractionTool: FunctionDeclaration = {
  name: "check_drug_interaction",
  description: "Check for known interactions between two medications.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      drug1: { type: Type.STRING, description: "Name of first drug" },
      drug2: { type: Type.STRING, description: "Name of second drug" },
    },
    required: ["drug1", "drug2"],
  },
};

// Mock Execution Logic
export const executeFindSpecialist = (args: { location: string; specialty: string }) => {
  // Mock Database
  const specialists = [
    { name: "Dr. Sarah Smith", specialty: args.specialty, location: args.location, rating: 4.9, contact: "555-0101" },
    { name: "Dr. James Lee", specialty: args.specialty, location: args.location, rating: 4.7, contact: "555-0102" },
    { name: "Dr. Anika Patel", specialty: args.specialty, location: args.location, rating: 4.8, contact: "555-0103" },
  ];
  return JSON.stringify(specialists);
};

export const executeDrugInteraction = (args: { drug1: string; drug2: string }) => {
  const d1 = args.drug1.toLowerCase();
  const d2 = args.drug2.toLowerCase();
  
  const riskyPairs = [
    ["aspirin", "ibuprofen"],
    ["warfarin", "aspirin"],
    ["lisinopril", "potassium"],
  ];

  const isRisky = riskyPairs.some(pair => 
    (pair[0] === d1 && pair[1] === d2) || (pair[0] === d2 && pair[1] === d1)
  );

  if (isRisky) {
    return `⚠️ CRITICAL ALERT: Taking ${args.drug1} with ${args.drug2} has known severe interactions. Consult a doctor immediately.`;
  }
  return `✅ Safety Check: No severe interactions found between ${args.drug1} and ${args.drug2} in our database. Always consult your doctor.`;
};
