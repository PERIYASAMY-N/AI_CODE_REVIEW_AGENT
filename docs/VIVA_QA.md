# Viva Questions and Answers

**Q1: What is the main objective of this project?**
**A:** The primary objective is to automate the code review process securely by leveraging Large Language Models to check for vulnerabilities, optimization metrics, and bugs seamlessly outputting actionable solutions.

**Q2: Why did you choose FastAPI over Django or Flask?**
**A:** FastAPI is asynchronously built out-of-the-box leveraging ASGI architectures cleanly natively generating Pydantic validations validating data inputs immediately, executing natively much quicker than Django environments.

**Q3: How does the AI actually read the code safely?**
**A:** The source code string is extracted from the Monaco Editor, loaded onto the backend, strictly string-formatted replacing native prompt placeholders, and safely executed via HTTPS REST requests securely into the configured AI server natively shielding keys inside Render environment configs.

**Q4: How do you store authentication securely?**
**A:** We use Bcrypt via Passlib to one-way hash password arrays natively shielding actual plaintext logic before placing it safely onto PostgreSQL arrays. We deploy HS-256 JWT keys scaling access rules statelessly.

**Q5: What is Alembic?**
**A:** Alembic is a native database migration tool for SQLAlchemy. It tracks SQL infrastructure changes safely permitting zero-downtime rolling upgrades dynamically on standard PostgreSQL frameworks securely.

**Q6: What happens if the AI returns broken JSON?**
**A:** We implement backend scrubbing utilities mapping `replace("```json", "")` scaling out potential markdown fragments and fall safely into Try-Except JSONDecodes raising proper HTTP 500 cleanly preventing client-side crashes natively.

**Q7: How did you implement export mechanisms?**
**A:** We scaled out standard API endpoints using `fpdf2` directly converting standard python dictionary formats dynamically rendering lines of code dynamically packing Byte buffers sent directly back natively wrapped inside HTML attachments natively downloading securely via Axios triggers on the client window arrays.
