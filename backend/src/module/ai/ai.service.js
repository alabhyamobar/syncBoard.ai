import { GoogleGenerativeAI } from "@google/generative-ai";

export const generateDiagramFromPrompt = async (prompt, schemaContext = "") => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not defined in environment variables");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  let fullPrompt = "";
  if (schemaContext) {
    fullPrompt = `
You are a Tldraw diagram generator. Generate a JSON array of shapes representing a database ER diagram based on the database schema provided:

Schema:
\`\`\`javascript
${schemaContext}
\`\`\`

User instructions (if any):
"${prompt}"
`;
  } else {
    fullPrompt = `
You are a Tldraw diagram generator. Generate a JSON array of shapes representing a diagram (e.g. system architecture, flowchart, microservices, database diagram) based on the user request:

User Request:
"${prompt}"
`;
  }

  fullPrompt += `
Each shape in the JSON array must follow this exact Tldraw v2 schema format:

1. Table/Component Node (Type: "geo"):
{
  "id": "shape:<unique_alphanumeric_id>",
  "type": "geo",
  "x": <number>,
  "y": <number>,
  "props": {
    "geo": "rectangle",
    "w": <number, e.g., 220>,
    "h": <number, e.g., 160>,
    "text": "<name_or_label_with_fields_separated_by_newlines>",
    "align": "start",
    "verticalAlign": "middle",
    "font": "mono",
    "color": "black"
  }
}

2. Relationship Connection (Type: "arrow"):
{
  "id": "shape:<unique_alphanumeric_id>",
  "type": "arrow",
  "x": <number_matching_start_x>,
  "y": <number_matching_start_y>,
  "props": {
    "start": { "x": 0, "y": 0 },
    "end": { "x": <delta_x>, "y": <delta_y> },
    "text": "<optional_relationship_text_like_1_to_many>"
  }
}

Important Rules:
- Distribute the table/component nodes spaced out (e.g., 250px to 500px apart) so they don't overlap. Use coordinates like (100, 100), (500, 100), (100, 450), (500, 450) etc.
- Put the name of the component/table in bold at the top of the node, followed by fields or properties.
- For arrows, the "x" and "y" should correspond to the starting point. The "end.x" and "end.y" must be the relative distance (deltas) to the target point, e.g., if starting at (320, 180) and target is (500, 180), x=320, y=180, end.x=180, end.y=0.
- Output ONLY the raw JSON block containing the array of shapes. Do not wrap in markdown (do not use \`\`\`json or \`\`\`), do not output any other commentary or introductory text. Just the JSON array:
[
  {...},
  {...}
]
`;

  const result = await model.generateContent(fullPrompt);
  const responseText = result.response.text().trim();

  try {
    let cleanJsonText = responseText;
    if (cleanJsonText.startsWith("```json")) {
      cleanJsonText = cleanJsonText.substring(7);
    }
    if (cleanJsonText.startsWith("```")) {
      cleanJsonText = cleanJsonText.substring(3);
    }
    if (cleanJsonText.endsWith("```")) {
      cleanJsonText = cleanJsonText.substring(0, cleanJsonText.length - 3);
    }
    cleanJsonText = cleanJsonText.trim();

    return JSON.parse(cleanJsonText);
  } catch (error) {
    console.error("Gemini response was:", responseText);
    throw new Error("Failed to parse AI generated diagram. Response was not valid JSON.");
  }
};

export const generateSchemaFromShapes = async (shapes) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not defined in environment variables");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `
You are a software architect. Analyze the following Tldraw canvas shapes representing a database ER-Diagram or system architecture, and generate clean, fully functional Mongoose schema code in Node.js.

Canvas Shapes Data:
${JSON.stringify(shapes, null, 2)}

Guidelines:
1. Identify all database collections (rectangular nodes with names and fields).
2. Identify relationships between nodes based on arrow connections (e.g. if User has an arrow to Post, Post schema should have a userId field referencing User).
3. Generate complete Mongoose schema declarations (including imports, models, and type definitions).
4. Output ONLY the markdown code block containing the JavaScript code (wrap with \`\`\`javascript ... \`\`\`). Do not include other text, notes or instructions.
`;

  const result = await model.generateContent(prompt);
  return result.response.text().trim();
};
