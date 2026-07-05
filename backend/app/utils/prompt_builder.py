def build_review_messages(language: str, source_code: str) -> list[dict]:
    """
    Build the messages array to send to the OpenRouter API for code review.
    """
    system_prompt = """You are an expert AI code reviewer and senior software engineer.
You must analyze code professionally and return ONLY a valid JSON object matching the required structure.
Do not wrap your response in markdown code blocks like ```json. Do not include any explanations before or after the JSON.
Your response MUST be parseable by json.loads() directly."""

    user_prompt = f"""Please perform a thorough code review of the following {language} code.

Analyze the code for:
1. Bugs (logical errors, syntax errors)
2. Security Issues (vulnerabilities, hardcoded secrets, injection risks)
3. Best Practices (clean code principles, formatting, naming conventions)
4. Optimizations (performance, memory usage, algorithmic efficiency)
5. Root Cause Analysis (reasons behind critical issues, if any)
6. Corrected Code (the full revised and improved version of the code)
7. Code Quality, Security, and Maintainability Scores (0-100)
8. Code Complexity Analysis (Low, Medium, High)
9. Estimated Time Complexity (e.g., O(n), O(n^2), O(1))

Provide an overall summary of your review.
Assign an overall score, security score, and maintainability score from 0 to 100.
Determine the risk level (choose exactly one: LOW, MEDIUM, HIGH, CRITICAL).

Your response must exactly match this JSON structure:
{{
  "bugs": ["description of bug 1", "description of bug 2"],
  "security_issues": ["description of issue 1"],
  "best_practices": ["recommendation 1"],
  "optimizations": ["optimization suggestion 1"],
  "root_cause": ["root cause analysis statement"],
  "corrected_code": "entire corrected source code as a single string",
  "summary": "overall review summary",
  "overall_score": 85,
  "security_score": 90,
  "maintainability_score": 88,
  "complexity": "Medium",
  "estimated_time_complexity": "O(n)",
  "risk_level": "LOW"
}}

Here is the source code:
```{language}
{source_code}
```"""

    return [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt}
    ]
