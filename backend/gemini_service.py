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
Give a brief, encouraging review (2-3 sentences) and an ACCURATE integrity score.

SCORING GUIDELINES (be precise, use ANY number from 30-100):
- 95-100: Exceptional - Student clearly wrote this themselves, explains concepts fluently, provides details not in the text
- 85-94: Strong - Good understanding, answers confidently with specific details
- 75-84: Adequate - Understands main points but some hesitation or vagueness
- 65-74: Marginal - Basic recall but struggles to explain or elaborate
- 50-64: Weak - Limited understanding, generic or memorized-sounding answers
- 30-49: Poor - Cannot demonstrate genuine understanding

USE PRECISE SCORES like 97, 88, 73, 82, 91, 100 - NOT just multiples of 5!
If a student demonstrates excellent understanding, give them 98, 99, or 100.

CRITICAL: Always include the COMPLETE text in your response. Never truncate with "..." """

# JSON format instructions - always appended to ensure proper parsing
JSON_FORMAT_INSTRUCTIONS = """
RESPONSE FORMAT - ALWAYS use this exact JSON structure:
For first question: {"type": "question", "number": 1, "text": "Hi [name if known]! I've read your assignment about [topic]. [Your greeting showing you read it]. Now, [your first question]?"}
For follow-up questions: {"type": "question", "number": 2, "text": "Your follow-up question here"}
For review: {"type": "review", "score": 87, "review": "Your review here.", "observations": ["point 1", "point 2"]}

IMPORTANT: The "text" field must contain the COMPLETE message you want to say. For the first question, include a friendly greeting AND the question in the same text field.

Return ONLY valid JSON, nothing else."""


class GeminiService:
    def __init__(self, api_key: str = None):
        settings = get_settings()
        key = api_key or settings.gemini_api_key
        if not key:
            raise ValueError("GEMINI_API_KEY not set. Please add it in Settings or .env file.")
        genai.configure(api_key=key)
        self.model = genai.GenerativeModel("gemini-2.5-flash")

    def start_session(self, assignment_text: str, custom_prompt: str = None, num_questions: int = 3) -> dict:
        system_prompt = custom_prompt or SYSTEM_PROMPT
        # Replace the number of questions in the prompt if custom
        if num_questions != 3:
            system_prompt = system_prompt.replace("AFTER 3 ANSWERS:", f"AFTER {num_questions} ANSWERS:")
            system_prompt = system_prompt.replace("answered all three questions", f"answered all {num_questions} questions")
        
        prompt = f"""{system_prompt}

{JSON_FORMAT_INSTRUCTIONS}

Here is the student's assignment:
---
{assignment_text[:10000]}
---

Your response must include BOTH a greeting AND your first question in the "text" field. Example format:
"Hi there! I've read your assignment about [specific topic from their work]. It's interesting how you approached [something specific]. My first question is: [your question about something specific from their assignment]?"

Make sure the greeting mentions something specific from their assignment to show you actually read it."""

        response = self.model.generate_content(prompt)
        return self._parse_response(response.text)

    def process_answer(self, assignment_text: str, conversation_history: list, answer: str, question_number: int, custom_prompt: str = None, num_questions: int = 3) -> dict:
        system_prompt = custom_prompt or SYSTEM_PROMPT
        # Replace the number of questions in the prompt if custom
        if num_questions != 3:
            system_prompt = system_prompt.replace("AFTER 3 ANSWERS:", f"AFTER {num_questions} ANSWERS:")
            system_prompt = system_prompt.replace("answered all three questions", f"answered all {num_questions} questions")
        
        history_text = "\n".join([
            f"{'Coach' if msg['role'] == 'ai' else 'Student'}: {msg['text']}"
            for msg in conversation_history[-6:]
        ])

        if question_number < num_questions:
            next_q = question_number + 1
            instruction = f"Now ask question {next_q}. Pick something different from what you already asked about. Reference a specific part of their assignment."
        else:
            instruction = f"""The student has answered all {num_questions} questions. Give a brief encouraging review (2-3 sentences) and an ACCURATE integrity score.

Use a PRECISE score (like 97, 88, 73, 91, 100) - NOT just multiples of 5!
- If they answered excellently with clear understanding, give 95-100
- If they showed strong knowledge, give 85-94
- If adequate but some gaps, give 75-84
- Score lower only if they struggled significantly"""

        prompt = f"""{system_prompt}

{JSON_FORMAT_INSTRUCTIONS}

Assignment:
---
{assignment_text[:4000]}
---

Conversation so far:
{history_text}

Student's latest answer: "{answer}"

{instruction}"""

        response = self.model.generate_content(prompt)
        return self._parse_response(response.text)

    def _parse_response(self, text: str) -> dict:
        # Clean the response text
        original_text = text
        text = text.strip()
        
        print(f"[Gemini] Raw response length: {len(text)}")
        print(f"[Gemini] Raw response preview: {text[:200]}...")
        
        # Remove markdown code blocks if present
        if text.startswith("```"):
            text = re.sub(r'^```(?:json)?\s*', '', text)
            text = re.sub(r'\s*```$', '', text)
        
        # Try to parse as complete JSON first
        try:
            result = json.loads(text)
            if isinstance(result, dict) and "text" in result:
                print(f"[Gemini] Parsed JSON with text: {result['text'][:100]}...")
                return result
            if isinstance(result, dict) and "review" in result:
                print(f"[Gemini] Parsed JSON with review")
                return result
        except json.JSONDecodeError as e:
            print(f"[Gemini] JSON parse error: {e}")
        
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
                            print(f"[Gemini] Found embedded JSON")
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
            print(f"[Gemini] Extracted text from pattern: {extracted_text[:100]}...")
            return {"type": "question", "number": 1, "text": extracted_text}
        
        # Try to extract review pattern
        review_match = re.search(r'"review"\s*:\s*"([^"]*(?:\\.[^"]*)*)"', text)
        if review_match:
            extracted_review = review_match.group(1).replace('\\"', '"').replace('\\n', '\n')
            score_match = re.search(r'"score"\s*:\s*(\d+)', text)
            score = int(score_match.group(1)) if score_match else 75
            print(f"[Gemini] Extracted review from pattern")
            return {"type": "review", "score": score, "review": extracted_review, "observations": []}
        
        # If all else fails, use the raw text as a question
        # Clean up any JSON artifacts
        clean_text = re.sub(r'[\{\}"\[\]]', '', text)  # Remove JSON chars
        clean_text = re.sub(r'\s+', ' ', clean_text).strip()  # Normalize whitespace
        
        if len(clean_text) < 10:
            clean_text = "Hello! I've reviewed your assignment. Could you start by telling me about the main topic or goal of your work?"
        
        print(f"[Gemini] Using fallback text: {clean_text[:100]}...")
        return {"type": "question", "number": 1, "text": clean_text}
