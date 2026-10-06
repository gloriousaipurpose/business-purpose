# All LLM Prompts according to Section 7 of specification

EXTRACT_PROMPT = """You are a data extraction engine. From the raw items below, extract every distinct startup, product, business, or pain point.
Return ONLY a JSON object matching this structure:
{
  "items": [
    {
      "name": "Exact Name",
      "kind": "startup | product | pain_point | india_opportunity | trend | ai_opportunity",
      "one_line_description": "Short description",
      "category": "Category name",
      "country_of_origin": "Country or null",
      "date": "YYYY-MM-DD or null",
      "source_url": "Exact source URL from raw text",
      "supporting_quote": "Exact sentence copied from text, max 25 words"
    }
  ]
}

The supporting_quote must be copied exactly from the raw text, max 25 words. Do not analyze, judge, or add anything not in the text. If an item contains nothing relevant, skip it. If unsure about a field, use null.
"""

SECTION_FOCUS_LINES = {
    "new_startups": "New Startups: focus on what launched, what it does, and traction signals.",
    "booming_products": "Booming Businesses & Products: focus on what is growing fast and the growth evidence.",
    "pain_points": "Pain Points: focus on recurring complaints, how many people complain, how intense, and existing solutions mentioned.",
    "ai_opportunities": "AI/Software Opportunities: focus on problems solvable with AI/software, and how a small team could build it.",
    "emerging_trends": "Emerging Trends: focus on broad patterns across multiple findings, not single items.",
    "india_gaps": "India Market Gaps: focus on needs visible in India with weak or no local solutions.",
    "deep_research": "Deep Research: analyze the user topic using provided evidence. Cover market size evidence, competitors, trends, risks, and India angle."
}

def get_analyze_prompt(section: str) -> str:
    focus_line = SECTION_FOCUS_LINES.get(section, "Analyze market opportunities.")
    return f"""You are a market analyst. Use ONLY the evidence provided below. Never use outside knowledge for facts, numbers or competitors.
Section Focus: {focus_line}

For each finding give: what it is, why it matters, evidence (source URLs and exact supporting quotes), canonical entity name, kind, section, and confidence: high = 3+ independent sources, medium = 2, low = 1.
If evidence is weak, say so plainly. If nothing significant exists, return an empty findings list and summary 'No significant findings in this data.'

Return ONLY a JSON object:
{{
  "findings": [
    {{
      "canonical_name": "Entity Name",
      "title": "Finding Title",
      "summary": "Detailed summary",
      "kind": "startup|product|pain_point|india_opportunity|trend|ai_opportunity",
      "section": "{section}",
      "evidence": [
        {{"url": "Source URL", "quote": "Exact supporting quote", "source": "Source Name"}}
      ],
      "confidence": "high|medium|low"
    }}
  ],
  "summary": "Overall section summary string"
}}
"""

INDIA_GAP_PROMPT = """Check whether this product or idea already exists in India: {entity}.
Search results / evidence gathered:
{web_evidence}

Return ONLY a JSON object:
{{
  "competitors_found": [
    {{"name": "Competitor Name", "url": "http...", "how_close_a_match": "Direct competitor | Partial match"}}
  ],
  "queries_used": ["query 1", "query 2"],
  "conclusion": "clear_gap | partial_gap | saturated | unclear",
  "reasoning": "Detailed explanation based on search findings."
}}

Only say 'clear_gap' if at least 5 different query angles were checked with no close match found. Never assume. If search results are poor, say 'unclear'.
"""

CRITIC_PROMPT = """You are a skeptical investor. For this opportunity, argue the strongest case that it is a BAD idea: regulation, hype spike vs real demand, saturation, unit economics, distribution difficulty, why it may not work in India, and why global success may not transfer. Use only the evidence provided.

Entity Name: {entity}
Details & Evidence:
{evidence_text}

Return ONLY a JSON object:
{{
  "top_risks": [
    {{"risk": "Risk description", "severity": "low|medium|high", "evidence": "Quote or reason"}}
  ],
  "verdict": "proceed | proceed_with_caution | avoid",
  "one_line_summary": "Skeptical summary line"
}}
"""

SCORING_PROMPT = """Score this opportunity using ONLY the evidence provided.
Entity: {entity}
Evidence & India Gap Context:
{context_text}

Rubric (0-100 total):
1. demand_growth (0-25)
2. proven_abroad (0-15)
3. india_gap (0-20)
4. ease_to_build (0-15)
5. revenue_potential (0-15)
6. timing (0-10)

For each dimension, provide the sub-score integer/float and a one-sentence justification citing evidence. Do not give high scores without evidence.
The India gap score must reflect the verify_india result. The critic's risks must lower the relevant sub-scores.

Return ONLY a JSON object:
{{
  "demand_growth": {{"score": 20.0, "justification": "Evidence shows..."}},
  "proven_abroad": {{"score": 12.0, "justification": "Evidence shows..."}},
  "india_gap": {{"score": 18.0, "justification": "Evidence shows..."}},
  "ease_to_build": {{"score": 10.0, "justification": "Evidence shows..."}},
  "revenue_potential": {{"score": 12.0, "justification": "Evidence shows..."}},
  "timing": {{"score": 8.0, "justification": "Evidence shows..."}}
}}
"""

DIFF_PROMPT = """Compare the previous run's findings with this run's.
Previous Run Findings:
{previous_findings}

Current Run Findings:
{current_findings}

Return ONLY a JSON object:
{{
  "new": [ {{"entity": "Name", "summary": "..."}} ],
  "disappeared": [ {{"entity": "Name", "reason": "..."}} ],
  "score_up": [ {{"entity": "Name", "from": 60, "to": 85, "why": "..."}} ],
  "score_down": [ {{"entity": "Name", "from": 80, "to": 65, "why": "..."}} ],
  "repeated": [ {{"entity": "Name", "times_seen": 3}} ],
  "important_trends": ["Trend 1", "Trend 2"],
  "summary": "Plain 3-sentence summary of the differences."
}}
If nothing changed meaningfully, say 'No significant changes' in the summary.
"""
