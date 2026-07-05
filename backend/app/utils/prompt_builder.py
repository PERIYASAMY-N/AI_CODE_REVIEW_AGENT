def build_review_messages(language: str, source_code: str) -> list[dict]:
    """
    Build the messages array sent to the Groq API for code review.

    Prompt design rules:
    - System prompt demands raw JSON only, no markdown wrapping.
    - corrected_code must use \\n for newlines and \\t for tabs — this is
      the only way to produce valid JSON (a JSON string cannot contain a
      raw unescaped newline character per the JSON spec).
    - We tell the model explicitly to escape newlines so that json.loads()
      can parse the response correctly every time.
    """

    system_prompt = (
        "You are an expert AI code reviewer and senior software engineer.\n"
        "Return ONLY a valid JSON object — nothing else.\n"
        "RULES:\n"
        "1. No markdown fences. No ```json wrapper. No text before or after the JSON.\n"
        "2. Your entire response must be one JSON object, parseable by json.loads().\n"
        "3. For corrected_code: the JSON spec forbids raw newlines inside string values.\n"
        "   You MUST encode every newline as the two-character sequence \\n\n"
        "   and every tab as \\t — exactly as required by the JSON standard.\n"
        "   Example of a valid corrected_code value:\n"
        '   "corrected_code": "class Foo {\\n    void bar() {\\n        // fix\\n    }\\n}"\n'
        "4. Do NOT write actual line breaks inside any JSON string value.\n"
        "5. Preserve full indentation using \\t or spaces encoded as \\n + spaces."
    )

    user_prompt = (
        f"Please perform a thorough code review of the following {language} code.\n\n"
        "Analyze for:\n"
        "1. Bugs (logical errors, null checks, edge cases)\n"
        "2. Security Issues (injections, hardcoded secrets, unvalidated input)\n"
        "3. Best Practices (naming, clean code, SOLID principles)\n"
        "4. Optimizations (algorithmic complexity, memory usage)\n"
        "5. Root Cause Analysis of critical issues\n"
        "6. Full Corrected Code — complete improved file, all lines\n"
        "7. Scores: overall (0-100), security (0-100), maintainability (0-100)\n"
        "8. Complexity: Low / Medium / High\n"
        "9. Time Complexity: e.g. O(n), O(n²), O(1)\n\n"
        "Return EXACTLY this JSON structure:\n"
        "{{\n"
        '  "bugs": ["description 1"],\n'
        '  "security_issues": ["issue 1"],\n'
        '  "best_practices": ["recommendation 1"],\n'
        '  "optimizations": ["suggestion 1"],\n'
        '  "root_cause": ["root cause 1"],\n'
        '  "corrected_code": "full corrected code with \\\\n for newlines and \\\\t for tabs",\n'
        '  "summary": "overall review summary",\n'
        '  "overall_score": 85,\n'
        '  "security_score": 90,\n'
        '  "maintainability_score": 88,\n'
        '  "complexity": "Medium",\n'
        '  "estimated_time_complexity": "O(n)",\n'
        '  "risk_level": "LOW"\n'
        "}}\n\n"
        "IMPORTANT for corrected_code:\n"
        "- Include the COMPLETE file — every line, not just changed parts.\n"
        "- Use \\n between every line of code.\n"
        "- Use spaces or \\t for indentation.\n"
        "- Preserve blank lines between methods as \\n\\n.\n"
        "- Preserve all comments.\n\n"
        f"Source code to review:\n"
        f"```{language}\n"
        f"{source_code}\n"
        f"```"
    )

    return [
        {"role": "system", "content": system_prompt},
        {"role": "user",   "content": user_prompt},
    ]
