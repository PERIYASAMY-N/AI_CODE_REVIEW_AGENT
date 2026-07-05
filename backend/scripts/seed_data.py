"""
Seed script — generates 5 test users + 10 sample reviews in the database.
Run from the backend/ directory:
    python -m scripts.seed_data
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import SessionLocal
from app.core.security import get_password_hash
from app.models.user import User
from app.models.review import Review

USERS = [
    {"name": "Periyasamy N",   "email": "periyasamy@test.com",  "password": "password123", "is_admin": True},
    {"name": "Alice Dev",      "email": "alice@test.com",        "password": "password123"},
    {"name": "Bob Engineer",   "email": "bob@test.com",          "password": "password123"},
    {"name": "Carol Senior",   "email": "carol@test.com",        "password": "password123"},
    {"name": "Dave Trainee",   "email": "dave@test.com",         "password": "password123"},
]

SAMPLE_REVIEWS = [
    {
        "language": "python",
        "source_code": "def add(a, b):\n    return a + b\nprint(add(1, 2))",
        "overall_score": 85,
        "risk_level": "LOW",
        "review_result": {
            "bugs": [], "security_issues": [],
            "best_practices": ["Add type hints", "Add docstring"],
            "optimizations": ["No significant issues"],
            "root_cause": [],
            "corrected_code": "def add(a: int, b: int) -> int:\n    \"\"\"Return the sum of a and b.\"\"\"\n    return a + b\n\nprint(add(1, 2))",
            "summary": "Clean, simple function. Minor improvements needed.",
            "overall_score": 85, "security_score": 95, "maintainability_score": 80,
            "complexity": "Low", "estimated_time_complexity": "O(1)", "risk_level": "LOW"
        }
    },
    {
        "language": "java",
        "source_code": 'public class Hello {\n  public static void main(String[] args) {\n    String pass = "admin123";\n    System.out.println("Hello " + pass);\n  }\n}',
        "overall_score": 42,
        "risk_level": "HIGH",
        "review_result": {
            "bugs": ["Password printed to stdout"],
            "security_issues": ["Hardcoded password 'admin123' detected", "Sensitive data exposed via System.out"],
            "best_practices": ["Use environment variables for secrets", "Avoid printing credentials"],
            "optimizations": [],
            "root_cause": ["Hardcoded credential anti-pattern"],
            "corrected_code": 'public class Hello {\n  public static void main(String[] args) {\n    String pass = System.getenv("APP_PASSWORD");\n    System.out.println("Hello World");\n  }\n}',
            "summary": "Critical security issue: hardcoded password exposed.",
            "overall_score": 42, "security_score": 10, "maintainability_score": 55,
            "complexity": "Low", "estimated_time_complexity": "O(1)", "risk_level": "HIGH"
        }
    },
    {
        "language": "javascript",
        "source_code": "function fetchData(url) {\n  return fetch(url).then(r => r.json());\n}",
        "overall_score": 72,
        "risk_level": "MEDIUM",
        "review_result": {
            "bugs": ["No error handling on rejected promise"],
            "security_issues": ["URL not validated — potential SSRF risk"],
            "best_practices": ["Add .catch() handler", "Validate input URL"],
            "optimizations": ["Consider async/await for readability"],
            "root_cause": ["Missing error handling cascades silently"],
            "corrected_code": "async function fetchData(url) {\n  try {\n    const res = await fetch(url);\n    if (!res.ok) throw new Error(`HTTP ${res.status}`);\n    return await res.json();\n  } catch (err) {\n    console.error('fetchData failed:', err);\n    throw err;\n  }\n}",
            "summary": "Missing error handling on async fetch. Medium risk.",
            "overall_score": 72, "security_score": 60, "maintainability_score": 70,
            "complexity": "Low", "estimated_time_complexity": "O(1)", "risk_level": "MEDIUM"
        }
    },
    {
        "language": "python",
        "source_code": "import os\nquery = 'SELECT * FROM users WHERE id = ' + input()\nos.system(query)",
        "overall_score": 5,
        "risk_level": "CRITICAL",
        "review_result": {
            "bugs": ["os.system used for SQL — wrong API"],
            "security_issues": ["SQL Injection vulnerability", "Command injection via os.system", "Unvalidated user input"],
            "best_practices": ["Use parameterized queries", "Never concatenate user input into queries"],
            "optimizations": [],
            "root_cause": ["Direct string concatenation of user input into SQL/OS command"],
            "corrected_code": "import sqlite3\nconn = sqlite3.connect('db.sqlite3')\ncursor = conn.cursor()\nuser_id = input('Enter ID: ')\ncursor.execute('SELECT * FROM users WHERE id = ?', (user_id,))\nprint(cursor.fetchall())",
            "summary": "CRITICAL: Multiple injection vulnerabilities. Immediate fix required.",
            "overall_score": 5, "security_score": 0, "maintainability_score": 20,
            "complexity": "Low", "estimated_time_complexity": "O(n)", "risk_level": "CRITICAL"
        }
    },
    {
        "language": "cpp",
        "source_code": "#include<iostream>\nusing namespace std;\nint main(){\n  int arr[5];\n  for(int i=0;i<=5;i++) arr[i]=i;\n}",
        "overall_score": 38,
        "risk_level": "HIGH",
        "review_result": {
            "bugs": ["Off-by-one error: loop runs i=0..5 but array size is 5 (indices 0-4)"],
            "security_issues": ["Buffer overflow — writing beyond array bounds"],
            "best_practices": ["Use std::vector instead of raw arrays", "Use range-based for or correct loop bounds"],
            "optimizations": ["Replace raw array with std::array or std::vector"],
            "root_cause": ["Loop condition i<=5 should be i<5"],
            "corrected_code": "#include<iostream>\n#include<vector>\nusing namespace std;\nint main(){\n  vector<int> arr(5);\n  for(int i=0; i<5; i++) arr[i] = i;\n  return 0;\n}",
            "summary": "Buffer overflow due to off-by-one error. High risk.",
            "overall_score": 38, "security_score": 20, "maintainability_score": 45,
            "complexity": "Low", "estimated_time_complexity": "O(n)", "risk_level": "HIGH"
        }
    },
]

def seed():
    db = SessionLocal()
    try:
        created_users = []
        for u in USERS:
            existing = db.query(User).filter(User.email == u["email"]).first()
            if existing:
                print(f"  [SKIP] User {u['email']} already exists.")
                created_users.append(existing)
                continue
            user = User(
                name=u["name"],
                email=u["email"],
                password_hash=get_password_hash(u["password"]),
                is_admin=u.get("is_admin", False)
            )
            db.add(user)
            db.flush()
            created_users.append(user)
            print(f"  [OK] Created user: {u['email']} (admin={u.get('is_admin', False)})")

        db.commit()

        # Assign reviews round-robin to users
        for i, rev in enumerate(SAMPLE_REVIEWS * 2):  # 10 reviews total
            user = created_users[i % len(created_users)]
            review = Review(
                user_id=user.id,
                language=rev["language"],
                source_code=rev["source_code"],
                overall_score=rev["overall_score"],
                risk_level=rev["risk_level"],
                review_result=rev["review_result"],
            )
            db.add(review)
            print(f"  [OK] Created review #{i+1}: {rev['language']} | {rev['risk_level']} | score={rev['overall_score']}")

        db.commit()
        print("\n✅ Seed complete!")
    except Exception as e:
        db.rollback()
        print(f"\n❌ Seed failed: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    seed()
