"""Quiz generation service using LLM."""
import httpx
import json
import uuid
from typing import List, Optional
from app.config import get_settings
from app.schemas import QuizQuestion, QuizOption

settings = get_settings()

# Language names for prompts
LANGUAGE_NAMES = {
    "en": "English",
    "zh": "Chinese (Simplified)",
    "ja": "Japanese",
    "de": "German",
    "fr": "French",
    "ko": "Korean",
    "es": "Spanish"
}


async def generate_quiz(
    topic: str,
    num_questions: int = 5,
    difficulty: str = "medium",
    language: str = "en"
) -> List[QuizQuestion]:
    """Generate quiz questions using LLM."""
    
    lang_name = LANGUAGE_NAMES.get(language, "English")
    
    prompt = f"""Generate exactly {num_questions} quiz questions about "{topic}" at {difficulty} difficulty level.
    
Output language: {lang_name}

Requirements:
- Mix question types: multiple choice (4 options), true/false, and fill-in-the-blank
- Questions should test understanding, not just recall
- Provide clear explanations for each answer
- Make sure all content is in {lang_name}

Return a JSON array with this exact structure:
[
  {{
    "type": "multiple_choice",
    "question": "Question text here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct_answer": "A",
    "explanation": "Explanation of why this is correct"
  }},
  {{
    "type": "true_false",
    "question": "Statement to evaluate?",
    "options": ["True", "False"],
    "correct_answer": "True",
    "explanation": "Explanation"
  }},
  {{
    "type": "fill_blank",
    "question": "Complete the sentence: The ___ is...",
    "options": null,
    "correct_answer": "answer",
    "explanation": "Explanation"
  }}
]

Return ONLY the JSON array, no other text."""

    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                f"{settings.llm_proxy_url}/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {settings.llm_proxy_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "claude-sonnet-4-20250514",
                    "messages": [
                        {"role": "user", "content": prompt}
                    ],
                    "max_tokens": 4000,
                    "temperature": 0.7
                }
            )
            response.raise_for_status()
            
            data = response.json()
            content = data["choices"][0]["message"]["content"]
            
            # Parse JSON from response
            # Find JSON array in response
            start = content.find('[')
            end = content.rfind(']') + 1
            if start == -1 or end == 0:
                raise ValueError("No JSON array found in response")
            
            json_str = content[start:end]
            questions_data = json.loads(json_str)
            
            # Convert to QuizQuestion objects
            questions = []
            for i, q in enumerate(questions_data):
                question_id = str(uuid.uuid4())[:8]
                
                options = None
                if q.get("options"):
                    options = [
                        QuizOption(id=chr(65 + j), text=opt)
                        for j, opt in enumerate(q["options"])
                    ]
                
                questions.append(QuizQuestion(
                    id=question_id,
                    type=q["type"],
                    question=q["question"],
                    options=options,
                    correct_answer=q["correct_answer"],
                    explanation=q["explanation"]
                ))
            
            return questions
            
    except httpx.HTTPStatusError as e:
        raise Exception(f"LLM API error: {e.response.status_code}")
    except json.JSONDecodeError as e:
        raise Exception(f"Failed to parse quiz response: {str(e)}")
    except Exception as e:
        raise Exception(f"Quiz generation failed: {str(e)}")


def calculate_xp(correct: int, total: int, streak: int, difficulty: str) -> int:
    """Calculate XP earned from a quiz."""
    # Base XP per correct answer
    base_xp = {
        "easy": 5,
        "medium": 10,
        "hard": 15
    }.get(difficulty, 10)
    
    # Calculate base score
    xp = correct * base_xp
    
    # Accuracy bonus (all correct)
    if correct == total and total > 0:
        xp += 20
    
    # Streak bonus
    if streak >= 3:
        xp += min(streak * 2, 20)  # Cap at 20 bonus XP
    
    return xp


def calculate_level(total_xp: int) -> int:
    """Calculate level from total XP."""
    # Level thresholds: 0, 100, 250, 500, 1000, 2000, etc.
    thresholds = [0, 100, 250, 500, 1000, 2000, 4000, 8000, 16000, 32000]
    
    for i, threshold in enumerate(thresholds):
        if total_xp < threshold:
            return i
    
    return len(thresholds)


def xp_to_next_level(total_xp: int) -> int:
    """Calculate XP needed for next level."""
    thresholds = [0, 100, 250, 500, 1000, 2000, 4000, 8000, 16000, 32000]
    current_level = calculate_level(total_xp)
    
    if current_level >= len(thresholds):
        return 0  # Max level
    
    return thresholds[current_level] - total_xp


# Achievement definitions
ACHIEVEMENTS = {
    "first_quiz": {"name": "First Steps", "description": "Complete your first quiz"},
    "perfect_score": {"name": "Perfect!", "description": "Get all questions correct"},
    "streak_5": {"name": "On Fire", "description": "Answer 5 questions correctly in a row"},
    "streak_10": {"name": "Unstoppable", "description": "Answer 10 questions correctly in a row"},
    "level_5": {"name": "Dedicated Learner", "description": "Reach level 5"},
    "level_10": {"name": "Knowledge Seeker", "description": "Reach level 10"},
    "hundred_questions": {"name": "Century", "description": "Answer 100 questions"},
    "thousand_xp": {"name": "XP Hunter", "description": "Earn 1000 XP"},
}


def check_achievements(
    total_questions: int,
    total_xp: int,
    level: int,
    best_streak: int,
    perfect_this_quiz: bool,
    existing_achievements: List[str]
) -> List[str]:
    """Check for new achievements earned."""
    new_achievements = []
    
    # First quiz
    if "first_quiz" not in existing_achievements and total_questions > 0:
        new_achievements.append("first_quiz")
    
    # Perfect score
    if "perfect_score" not in existing_achievements and perfect_this_quiz:
        new_achievements.append("perfect_score")
    
    # Streak achievements
    if "streak_5" not in existing_achievements and best_streak >= 5:
        new_achievements.append("streak_5")
    if "streak_10" not in existing_achievements and best_streak >= 10:
        new_achievements.append("streak_10")
    
    # Level achievements
    if "level_5" not in existing_achievements and level >= 5:
        new_achievements.append("level_5")
    if "level_10" not in existing_achievements and level >= 10:
        new_achievements.append("level_10")
    
    # Question count
    if "hundred_questions" not in existing_achievements and total_questions >= 100:
        new_achievements.append("hundred_questions")
    
    # XP milestone
    if "thousand_xp" not in existing_achievements and total_xp >= 1000:
        new_achievements.append("thousand_xp")
    
    return new_achievements
