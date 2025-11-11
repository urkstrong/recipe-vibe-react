import { GoogleGenAI } from "@google/genai";

// Helper function to retry with exponential backoff
const retryWithBackoff = async (fn, maxRetries = 3, baseDelay = 1000) => {
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await fn();
        } catch (error) {
            const isLastRetry = i === maxRetries - 1;
            const isRetryableError = error.message?.includes('overloaded') || 
                                    error.message?.includes('503') ||
                                    error.message?.includes('429');
            
            if (isLastRetry || !isRetryableError) {
                throw error;
            }
            
            // Exponential backoff: wait 1s, 2s, 4s
            const delay = baseDelay * Math.pow(2, i);
            console.log(`Retry attempt ${i + 1}/${maxRetries} after ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
};

export const parseRecipeImage = async (imageFile) => {
    try {
        // Validate API key exists
        const apiKey = process.env.REACT_APP_GEMINI_API_KEY;
        
        if (!apiKey || apiKey === 'your_gemini_api_key_here') {
            return {
                success: false,
                error: 'Gemini API key is not configured. Please add your API key to the .env file and restart the server.'
            };
        }

        // Initialize the Gemini client with API key
        const ai = new GoogleGenAI({ apiKey });

        // Convert image to base64
        const base64Image = await fileToBase64(imageFile);
        
        const prompt = `Analyze this recipe image and extract the following information in JSON format:
{
  "title": "Recipe title",
  "description": "Brief description if available",
  "prepTime": "Preparation time (e.g., '15 minutes')",
  "cookTime": "Cooking time (e.g., '30 minutes')",
  "servings": "Number of servings",
  "ingredients": ["ingredient 1", "ingredient 2", ...],
  "instructions": ["step 1", "step 2", ...]
}

Rules:
- Extract the recipe title from the image
- List all ingredients with quantities and measurements
- Break down instructions into clear, sequential steps
- If any field is not visible, use an empty string or empty array
- Preserve original measurements and quantities
- Return ONLY valid JSON, no markdown formatting`;

        // Wrap the API call in retry logic
        const result = await retryWithBackoff(async () => {
            return await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: [
                    {
                        role: "user",
                        parts: [
                            { text: prompt },
                            {
                                inlineData: {
                                    mimeType: imageFile.type,
                                    data: base64Image
                                }
                            }
                        ]
                    }
                ]
            });
        });

        const text = result.text;
        
        // Remove markdown code blocks if present
        const jsonText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        
        const parsedRecipe = JSON.parse(jsonText);
        
        return {
            success: true,
            recipe: parsedRecipe
        };
    } catch (error) {
        console.error('Gemini API Error:', error);
        
        // Provide user-friendly error messages
        let errorMessage = 'Failed to parse recipe image';
        
        if (error.message?.includes('overloaded') || error.message?.includes('503')) {
            errorMessage = 'Gemini AI is currently busy. Please try again in a few moments.';
        } else if (error.message?.includes('429')) {
            errorMessage = 'Rate limit exceeded. Please wait a minute and try again.';
        } else if (error.message?.includes('API key')) {
            errorMessage = 'Invalid API key. Please check your configuration.';
        } else if (error.message?.includes('quota')) {
            errorMessage = 'API quota exceeded. Please try again later.';
        }
        
        return {
            success: false,
            error: errorMessage
        };
    }
};

const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const base64 = reader.result.split(',')[1];
            resolve(base64);
        };
        reader.onerror = error => reject(error);
    });
};
