import google.generativeai as genai
from config import get_settings
import json
import re

SYSTEM_PROMPT = """You are a friendly AI coach checking if a student understands their submitted assignment.

YOUR GOAL:
Verify the student actually did and understands their work by asking questions only they could answer if they wrote it themselves.

YOUR STYLE:
- Ask clear, specific questions based on their actual content
- Be conversational and encouraging
- Vary your questions - don't follow a rigid pattern

QUESTION IDEAS (mix it up, pick what fits their assignment):
- Ask about a specific claim or statement they made
- Ask them to explain a term or concept they used
- Ask why they chose a particular approach or example
- Ask what they found difficult or surprising
- Ask them to elaborate on a specific section
- Ask about data, sources, or evidence they referenced
- Ask what they would do differently
- Ask them to summarize a specific part
- Ask about the connection between two ideas they mentioned

IMPORTANT:
- Each question should reference something specific from their assignment
- Don't ask the same type of question every time
- Make questions clear enough to answer verbally
- Ask ONE question at a time

AFTER 3 ANSWERS:
Give a brief, encouraging review (2-3 sentences) and a score from 0-100 based on how well they demonstrated genuine understanding.

RESPONSE FORMAT - ALWAYS use this exact JSON structure:
For questions: {"type": "question", "number": 1, "text": "Your full question here"}
For review: {"type": "review", "score": 75, "review": "Your review here.", "observations": ["point 1", "point 2"]}

CRITICAL: Always include the COMPLETE text in your response. Never truncate with "..." """


class GeminiService:
    def __init__(self):
        settings = get_settings()
        if not settings.gemini_api_key:
            raise ValueError("GEMINI_API_KEY not set in environment")
        genai.configure(api_key=settings.gemini_api_key)
        self.model = genai.GenerativeModel("gemini-2.5-flash")

    def start_session(self, assignment_text: str) -> dict:
        prompt = f"""{SYSTEM_PROMPT}

Here is the student's assignment:
---
{assignment_text[:5000]}
---

Start with a brief friendly greeting that shows you read their work, then ask your FIRST question. Pick something interesting or important from their assignment to ask about.

Return ONLY valid JSON, nothing else."""

        response = self.model.generate_content(prompt)
        return self._parse_response(response.text)

    def process_answer(self, assignment_text: str, conversation_history: list, answer: str, question_number: int) -> dict:
        history_text = "\n".join([
            f"{'Coach' if msg['role'] == 'ai' else 'Student'}: {msg['text']}"
            for msg in conversation_history[-6:]
        ])

        if question_number < 3:
            next_q = question_number + 1
            instruction = f"Now ask question {next_q}. Pick something different from what you already asked about. Reference a specific part of their assignment."
        else:
            instruction = "The student has answered all three questions. Give a brief encouraging review (2-3 sentences) and a score from 0-100 based on how well they demonstrated understanding."

        prompt = f"""{SYSTEM_PROMPT}

Assignment:
---
{assignment_text[:4000]}
---

Conversation so far:
{history_text}

Student's latest answer: "{answer}"

{instruction}

Return ONLY valid JSON, nothing else."""

        response = self.model.generate_content(prompt)
        return self._parse_response(response.text)

    def _parse_response(self, text: str) -> dict:
        # Clean the response text
        text = text.strip()
        
        # Remove markdown code blocks if present
        if text.startswith("```"):
            text = re.sub(r'^```(?:json)?\s*', '', text)
            text = re.sub(r'\s*```$', '', text)
        
        # Try to parse as complete JSON first
        try:
            result = json.loads(text)
            if isinstance(result, dict) and "text" in result:
                return result
            if isinstance(result, dict) and "review" in result:
                return result
        except json.JSONDecodeError:
            pass
        
        # Try to find JSON object with balanced braces
        brace_count = 0
        start_idx = -1
        for i, char in enumerate(text):
            if char == '{':
                if start_idx == -1:
                    start_idx = i
                brace_count += 1
            elif char == '}':
                brace_count -= 1
                if brace_count == 0 and start_idx != -1:
                    json_str = text[start_idx:i+1]
                    try:
                        result = json.loads(json_str)
                        if isinstance(result, dict):
                            return result
                    except json.JSONDecodeError:
                        pass
                    start_idx = -1
        
        # Last resort: extract text manually if JSON parsing completely fails
        # Look for "text": "..." pattern
        text_match = re.search(r'"text"\s*:\s*"([^"]*(?:\\.[^"]*)*)"', text)
        if text_match:
            extracted_text = text_match.group(1)
            # Unescape JSON string
            extracted_text = extracted_text.replace('\\"', '"').replace('\\n', '\n')
            return {"type": "question", "number": 1, "text": extracted_text}
        
        # If all else fails, just use the raw text
        clean_text = re.sub(r'\{[^}]*$', '', text).strip()  # Remove incomplete JSON
        clean_text = re.sub(r'^[^a-zA-Z]*', '', clean_text)  # Remove leading non-letters
        if not clean_text:
            clean_text = "I'm having trouble formulating my question. Could you tell me about your assignment?"
        return {"type": "question", "number": 1, "text": clean_text}
