# Interview Questions and Answers (Architecture & Logic)

**Q1: Explain how you prevent unauthorized access to someone else's code review history.**
**A:** The API handles permissions inside the service layer securely aggregating validations based upon the token ID safely decoded. Inside `get_review_by_id`, the system queries `Review.user_id == user_id`, meaning even if someone guesses an ID natively, the database will safely yield zero components returning standard Python `None` mapping perfectly into an HTTP 404 block natively.

**Q2: Contrast Context limitation handling when deploying AI applications natively.**
**A:** Passing entirely massive codebase formats will break token limitations triggering 413 limits natively out from OpenRouter environments. Our current implementation securely filters specific snippets accurately through focused analysis screens scaling out logic safely via File Readers ensuring users manage inputs logically preventing overflow natively.

**Q3: Describe the role of Pydantic across the infrastructure.**
**A:** Pydantic is radically utilized securely replacing standard procedural dict verifications safely forcing incoming HTTP requests natively mapping Types against schema standards safely. E.g., setting models for `ReviewRequest` tightly bounding validation layers automatically stripping unnecessary arrays natively scaling out zero-maintenance security barriers.

**Q4: How would you approach horizontal scaling for this application array?**
**A:** For the frontend, Vercel natively handles distribution safely globally. The backend runs on stateless configurations via Uvicorn natively safely load-balancing without memory bleeding. To improve backend scaling, deploying Docker containers across orchestrated Kubernetes environments strictly pointing toward heavily optimized Managed Postgres instances natively implementing Connection Pooling using tools natively like PgBouncer effectively scaling API concurrent processing seamlessly.

**Q5: Describe the architectural purpose of injecting Prompt engineering tightly onto the backend rather than the frontend UI architectures.**
**A:** Enforcing system protocols strictly on the frontend opens profound security vulnerabilities inherently allowing malicious end-users to rewrite instructions via console injections altering LLM targets efficiently wasting compute. Storing strict formatting mapping structures purely executed safely out from standard backend processes effectively natively bounds control execution flows safeguarding instructions cleanly natively securing platform goals. 
