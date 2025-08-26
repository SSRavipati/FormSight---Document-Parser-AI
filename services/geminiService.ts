

import { GoogleGenAI } from "@google/genai";
import { ExtractedField } from './types.ts';

// Ensure the API key is provided through environment variables in your product
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * A document parser specialized in analyzing PDFs and image-based forms with arbitrary layouts.
 * For a given document, it extracts all recognized form elements.
 * 
 * @param base64Data The base64-encoded string of the document file.
 * @param mimeType The MIME type of the file (e.g., 'application/pdf', 'image/png').
 * @returns A promise that resolves to a flat JSON array of extracted form elements.
 */
export async function parseDocument(base64Data: string, mimeType: string): Promise<ExtractedField[]> {
  const model = "gemini-2.5-flash";
  const filePart = {
    inlineData: {
      data: base64Data,
      mimeType,
    },
  };

  const prompt = `
A document parser specialized in analyzing PDFs and image-based forms with arbitrary layouts. For each document provided (PDF or image), perform the following steps:

Extract all recognized form elements, including (but not limited to): text fields, tables, checkboxes, signatures, and selection marks.

For each detected element, output a JSON object with the following keys:

"field_type": The type of form element. Choose from: 'text', 'checkbox', 'table', 'signature', 'selectionMark'.

"label": The visible label, prompt, or closest description for the field, or null if not available. For 'checkbox' and 'selectionMark' types, if they are part of a group, combine the group's question (if any), the text for the specific option, and a list of all options in the group. For example, for an option "Technical Support" in a "Reason for Contact" group, a good label would be "Reason for Contact: Technical Support (Options: Sales, Technical Support, Billing)".

"value": The extracted content. For text fields and signatures, use the string value; for checkboxes and selection marks, indicate status ('checked' or 'unchecked'); for tables, output a two-dimensional array of extracted cell values.

"box": The bounding box coordinates as an array [x0, y0, x1, y1] in document coordinate space, where x0, y0 are the top-left and x1, y1 are the bottom-right corners.

"page_number": The page number where the field was found. For single-page documents (like images), this should always be 1.

Do not omit any recognized fields. Your output format must not depend on PDF, image, or layout style, beyond providing the page number.

Return your response as a single, flat JSON array. Each item in the array must be formatted as specified. If no fields are recognized, return an empty array [].

Do not include any explanatory text, extra keys, or metadata outside of the array. The output must strictly adhere to proper JSON syntax.

Output Example:

[
  {
    "field_type": "text",
    "label": "First Name",
    "value": "John",
    "box": [49, 122, 200, 143],
    "page_number": 1
  },
  {
    "field_type": "checkbox",
    "label": "Agreement",
    "value": "checked",
    "box": [212, 167, 220, 178],
    "page_number": 1
  },
  {
    "field_type": "table",
    "label": "Order Details",
    "value": [["Item", "Quantity", "Price"], ["Pen", "2", "$3"]],
    "box": [300, 250, 500, 320],
    "page_number": 2
  }
]

Instructions: Return only valid JSON as described. Do not add preambles, explanations, or formatting outside the array.
  `;
  
  try {
    const result = await ai.models.generateContent({
      model,
      contents: [{ parts: [filePart, { text: prompt }] }],
      config: {
        responseMimeType: "application/json",
      },
    });
    
    const jsonString = result.text.trim();

    if (!jsonString) {
      console.warn("API returned an empty response, returning empty array as per requirements.");
      return [];
    }
    
    // The AI is instructed to return a JSON array directly.
    const parsedJson = JSON.parse(jsonString);
    
    if (!Array.isArray(parsedJson)) {
        throw new Error("The AI returned data in a non-array format.");
    }

    return (parsedJson as any[]).map(item => ({
      ...item,
      page_number: item.page_number || 1, // Ensure page_number is present
    })) as ExtractedField[];

  } catch (error) {
    console.error("Error parsing document with Gemini:", error);
    if (error instanceof Error && error.message.includes("JSON.parse")) {
       throw new Error("The AI returned data in an invalid JSON format. Please try a different document or try again.");
    }
    throw new Error(`An error occurred while communicating with the AI: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}