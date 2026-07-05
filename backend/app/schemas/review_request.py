from pydantic import BaseModel, Field, field_validator
from typing import Optional

SUPPORTED_LANGUAGES = {"java", "python", "javascript", "typescript", "c", "cpp", "csharp"}

# Ordered fallback list — first entry is the default.
# deepseek-r1-distill-llama-70b is REMOVED (Groq decommissioned it).
SUPPORTED_MODELS = [
    "llama-3.3-70b-versatile",
    "llama-3.1-70b-versatile",
    "mixtral-8x7b-32768",
]

# Set for O(1) lookup used in validators
SUPPORTED_MODELS_SET = set(SUPPORTED_MODELS)

# The safest default when no model is specified or a bad model is passed
DEFAULT_MODEL = SUPPORTED_MODELS[0]


class ReviewRequest(BaseModel):
    language: str = Field(..., description="The programming language of the source code")
    source_code: str = Field(
        ...,
        min_length=10,
        max_length=50000,
        description="The source code to be reviewed",
    )
    model_name: Optional[str] = Field(
        None,
        description=(
            "Groq model to use. "
            f"Supported: {', '.join(SUPPORTED_MODELS)}. "
            f"Defaults to '{DEFAULT_MODEL}'."
        ),
    )

    @field_validator("language")
    @classmethod
    def validate_language(cls, v: str) -> str:
        v = v.lower().strip()
        if v not in SUPPORTED_LANGUAGES:
            raise ValueError(
                f"Unsupported language '{v}'. "
                f"Supported: {', '.join(sorted(SUPPORTED_LANGUAGES))}"
            )
        return v

    @field_validator("model_name")
    @classmethod
    def validate_model(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            v = v.strip()
            if v not in SUPPORTED_MODELS_SET:
                raise ValueError(
                    f"Unsupported model '{v}'. "
                    f"Supported: {', '.join(SUPPORTED_MODELS)}"
                )
        return v
