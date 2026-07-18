import { generateDiagramFromPrompt, generateSchemaFromShapes } from "./ai.service.js";

export const generateDiagramController = async (req, res) => {
  try {
    const { prompt, schemaContext } = req.body;
    if (!prompt && !schemaContext) {
      return res.status(400).json({ message: "Prompt or schema context is required" });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(400).json({
        message: "Gemini API Key is not configured. Please define GEMINI_API_KEY in your backend/.env file."
      });
    }

    const shapes = await generateDiagramFromPrompt(prompt, schemaContext);
    res.json({ success: true, data: shapes });
  } catch (error) {
    console.error("AI Generate Diagram Error:", error.message);
    res.status(500).json({
      message: error.message || "Failed to generate diagram using AI"
    });
  }
};

export const generateSchemaController = async (req, res) => {
  try {
    const { shapes } = req.body;
    if (!shapes || !Array.isArray(shapes)) {
      return res.status(400).json({ message: "Canvas shapes array is required" });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(400).json({
        message: "Gemini API Key is not configured. Please define GEMINI_API_KEY in your backend/.env file."
      });
    }

    const schemaCode = await generateSchemaFromShapes(shapes);
    res.json({ success: true, data: schemaCode });
  } catch (error) {
    console.error("AI Generate Schema Error:", error.message);
    res.status(500).json({
      message: error.message || "Failed to generate schema code using AI"
    });
  }
};
