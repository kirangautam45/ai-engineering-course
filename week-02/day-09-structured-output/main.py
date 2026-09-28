"""Day 9 — Structured output (JSON you can trust)

Run: python run.py day9
Extracts clean data from a messy job posting, guaranteed to match our schema.
"""

import sys
from typing import Literal

from pydantic import BaseModel, Field, ValidationError

from ailib.claude import MODEL, client

posting = """🚀 WE'RE HIRING!!! Junior MERN Developer @ Himalayan Tech Pvt. Ltd (Kathmandu, hybrid)
Must know React + Node, MongoDB is a plus. Git is a must!!
0-2 yrs experience. Salary: NPR 40k–60k/month depending on skills.
Send CV to jobs@himalayantech.example before Asoj 30. Freshers welcome 🙌"""


# 1. Describe the shape we want with Pydantic. Field descriptions are sent to the model as guidance.
class Experience(BaseModel):
    min: float
    max: float


class Salary(BaseModel):
    min: float
    max: float
    currency: str
    period: str


class Job(BaseModel):
    title: str
    company: str
    location: str
    remote: Literal["onsite", "hybrid", "remote", "unknown"]
    skills: list[str] = Field(description="Required and nice-to-have technical skills")
    experience_years: Experience
    salary: Salary | None = Field(description="null if no salary is mentioned")
    apply_email: str | None


# 2. messages.parse() sends the schema and turns the answer into a Job object for us
try:
    response = client.messages.parse(
        model=MODEL,
        max_tokens=2048,
        output_format=Job,
        messages=[{"role": "user", "content": f"Extract the job details from this posting:\n\n{posting}"}],
    )
except ValidationError as error:
    # Rare with structured output, but possible, e.g. if max_tokens cut the answer off mid-JSON
    sys.exit(f"The model's answer didn't match the schema:\n{error}")

# 3. parsed_output is a real Python object with attributes — no json.loads, no regex
job = response.parsed_output

print(job.model_dump_json(indent=2))
print(f"\n{job.title} at {job.company} needs: {', '.join(job.skills)}")
if job.salary:
    print(f"Pays {job.salary.currency} {job.salary.min:g}–{job.salary.max:g} per {job.salary.period}")
