
import { GoogleGenAI, Type } from "@google/genai";
import { StudentInput } from "../types";

export const generateStudentReport = async (input: StudentInput): Promise<{ mark: number; reportText: string; actionPlan: string[] }> => {
  // Use the direct process.env.API_KEY as per guidelines
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const systemInstruction = `
    You are an expert Teacher. Write a professional student report for the subject: ${input.subject}.
    
    STUDENT GENDER: ${input.gender}. 
    CRITICAL: Use correct pronouns for ${input.gender} throughout the report (he/she/they).
    
    YEAR GROUP: ${input.year} ${input.gradeLevel ? `(Class: ${input.gradeLevel})` : ''}
    Note: For Year 7 and above, ensure the language reflects secondary/high school academic rigor. 
    For Nursery and Reception, use nurturing and development-focused language.
    
    CURRICULUM: ${input.curriculum} Terminology.
    TONE: ${input.tone}
    LENGTH: ${input.length} (Short: 1 para, Medium: 2 paras, Long: 3 paras + details)
    LANGUAGE: Output the final report in ${input.language}.
    
    TARGET MARK: ${input.targetMark !== undefined ? `${input.targetMark}%` : "Generate an appropriate mark based on observations."}
    If a TARGET MARK is provided, you MUST use that value for the 'mark' property in the JSON.
    
    Formatting Rules:
    - Use Markdown for emphasis (bolding keywords).
    - If sentiment is Negative, use professional "growth-oriented" language.
    - Provide a list of 3 specific "Action Plan" items for improvement.
    
    Output JSON only.
  `;

  const promptParts: any[] = [
    { text: `Name: ${input.name}, Year: ${input.year}, Class ID: ${input.gradeLevel || 'N/A'}, Subject: ${input.subject}, Sentiment: ${input.sentiment}, Observations: ${input.details}` }
  ];

  if (input.imageEvidence) {
    promptParts.push({
      inlineData: {
        mimeType: "image/jpeg",
        data: input.imageEvidence.split(',')[1]
      }
    });
    promptParts[0].text += " Also analyze the attached image of the student's work to provide specific feedback.";
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: { parts: promptParts },
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            mark: { type: Type.NUMBER },
            reportText: { type: Type.STRING },
            actionPlan: { 
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["mark", "reportText", "actionPlan"],
        },
      },
    });

    // Directly access the text property as per guidelines
    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Gemini Error:", error);
    throw new Error("Failed to reach AI. Check your connection.");
  }
};
