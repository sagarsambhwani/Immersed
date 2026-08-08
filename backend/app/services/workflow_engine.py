import uuid
import json
import asyncio
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
from fastapi import HTTPException, status

from app.schemas.workflow import (
    TaskStatus,
    InteractionStatus,
    InteractionType,
    WorkflowEventType,
    WorkflowInteraction,
    WorkflowTask,
    WorkflowPhase,
    WorkflowEvent,
    WorkflowTransition,
    WorkflowStateResponse,
    WorkflowMutationResponse,
    WorkflowStartRequest,
    WorkflowResumeRequest,
    WorkflowEvolveRequest,
    QuestionResumeData,
    ChoiceResumeData,
    ReviewResumeData,
    ApprovalResumeData,
    ActionResumeData,
    ReflectionResumeData,
    ValidationResumeData,
    FreeformResumeData,
    compute_mutation_hash
)
from app.config import settings
from app.services.llm.factory import LLMFactory
from app.core.logging import logger

class AIProposalEngine:
    """Domain-Agnostic Intent Decomposer & Adaptation Reasoner powered by LLM and Heuristic Fallbacks."""

    @classmethod
    def _get_active_llm_provider(cls):
        """Discovers the best available LLM provider based on configured API keys."""
        if settings.GEMINI_API_KEY:
            return LLMFactory.get_provider("gemini"), "gemini-1.5-flash"
        elif settings.OPENROUTER_API_KEY:
            return LLMFactory.get_provider("openrouter"), "meta-llama/llama-3.3-70b-instruct"
        elif settings.OPENAI_API_KEY:
            return LLMFactory.get_provider("openai"), "gpt-4o-mini"
        elif settings.GROQ_API_KEY:
            return LLMFactory.get_provider("groq"), "llama-3.3-70b-versatile"
        elif settings.ANTHROPIC_API_KEY:
            return LLMFactory.get_provider("anthropic"), "claude-3-5-sonnet-20241022"
        return None, None

    @classmethod
    async def _call_llm_for_decomposition(cls, intention: str, context_notes: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """Invokes LLM to decompose arbitrary human intention into structured phases, tasks, and interactions."""
        provider, model_name = cls._get_active_llm_provider()
        if not provider:
            return None

        system_prompt = (
            "You are an expert cognitive decomposition engine. Your task is to take any human intention "
            "(learning goal, inquiry into a belief, creative project, software architecture, writing, or life planning) "
            "and externalize it into a clean, doable, structured hierarchy: Goal -> Phase -> Task -> Interactions.\n"
            "Rules:\n"
            "1. Output ONLY valid JSON, no markdown fences or introductory text.\n"
            "2. Keep the workflow concise and actionable: 2 to 3 Phases, 1 to 2 Tasks per phase, 1 to 2 Interactions per task.\n"
            "3. Interaction types must be one of: 'choice', 'question', 'reflection', 'validation', 'approval', 'action', 'freeform'.\n"
            "4. Every interaction must explain 'why_relevant' (why asking now) and 'what_unlocks' (what decision or capability this unlocks).\n"
            "JSON Format:\n"
            "{\n"
            '  "domain": "Inferred Domain Name",\n'
            '  "phases": [\n'
            '    {\n'
            '      "title": "Phase 1 · Title",\n'
            '      "description": "Short explanation",\n'
            '      "tasks": [\n'
            '        {\n'
            '          "title": "Task Title",\n'
            '          "description": "Task details",\n'
            '          "interactions": [\n'
            '            {\n'
            '              "type": "choice",\n'
            '              "title": "Step Title",\n'
            '              "prompt_message": "Immediate question or prompt",\n'
            '              "why_relevant": "Why this is critical now",\n'
            '              "what_unlocks": "What completing this unlocks",\n'
            '              "options": ["Option 1", "Option 2", "Option 3"]\n'
            '            }\n'
            '          ]\n'
            '        }\n'
            '      ]\n'
            '    }\n'
            '  ]\n'
            "}"
        )

        user_content = f"Intention: {intention}\nContext Notes: {context_notes or 'None'}"
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_content}
        ]

        try:
            raw_response = await asyncio.wait_for(
                provider.generate_response(messages=messages, model=model_name, temperature=0.3),
                timeout=3.5
            )

            clean_json = raw_response.strip()
            if clean_json.startswith("```json"):
                clean_json = clean_json[7:]
            if clean_json.startswith("```"):
                clean_json = clean_json[3:]
            if clean_json.endswith("```"):
                clean_json = clean_json[:-3]
            clean_json = clean_json.strip()

            parsed = json.loads(clean_json)
            if "phases" in parsed and isinstance(parsed["phases"], list) and len(parsed["phases"]) > 0:
                return parsed
        except Exception as e:
            logger.info("LLM decomposition timed out or unavailable, using fast semantic engine", error=str(e))
        return None

    @classmethod
    async def _call_llm_for_adaptation(cls, completed_summary: List[str], change_statement: str, rationale: str) -> Optional[List[Dict[str, Any]]]:
        """Invokes LLM to plan adapted future phases preserving historical context."""
        provider, model_name = cls._get_active_llm_provider()
        if not provider:
            return None

        system_prompt = (
            "You are an adaptive workflow re-planner. The user has changed their direction or updated their assumptions mid-way. "
            "Their completed work is permanently preserved. Your job is to generate 1 to 2 new adapted future phases to achieve their revised goal.\n"
            "Output ONLY valid JSON with structure:\n"
            "[\n"
            "  {\n"
            '    "title": "Phase Adapted · Title",\n'
            '    "description": "Short explanation",\n'
            '    "tasks": [\n'
            "      {\n"
            '        "title": "Task Title",\n'
            '        "description": "Description",\n'
            '        "interactions": [\n'
            "          {\n"
            '            "type": "choice",\n'
            '            "title": "Step Title",\n'
            '            "prompt_message": "Prompt",\n'
            '            "why_relevant": "Why asking",\n'
            '            "what_unlocks": "What unlocks",\n'
            '            "options": ["Option A", "Option B"]\n'
            "          }\n"
            "        ]\n"
            "      }\n"
            "    ]\n"
            "  }\n"
            "]"
        )

        user_content = (
            f"Preserved Completed Work: {completed_summary}\n"
            f"New Direction Statement: {change_statement}\n"
            f"User Rationale: {rationale}"
        )

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_content}
        ]

        try:
            raw_response = await asyncio.wait_for(
                provider.generate_response(messages=messages, model=model_name, temperature=0.3),
                timeout=3.5
            )

            clean_json = raw_response.strip()
            if clean_json.startswith("```json"):
                clean_json = clean_json[7:]
            if clean_json.startswith("```"):
                clean_json = clean_json[3:]
            if clean_json.endswith("```"):
                clean_json = clean_json[:-3]
            clean_json = clean_json.strip()

            parsed = json.loads(clean_json)
            if isinstance(parsed, list) and len(parsed) > 0:
                return parsed
        except Exception as e:
            logger.info("LLM adaptation timed out or unavailable, using fast semantic engine", error=str(e))
        return None

    @classmethod
    async def propose_intent_decomposition(
        cls,
        intention: str,
        context_notes: Optional[str] = None,
        domain_hint: Optional[str] = None
    ) -> Dict[str, Any]:
        """Decomposes any human intention into a cognitive hierarchy: Goal -> Phase -> Task -> Interactions."""
        text = intention.lower()
        
        # 1. Attempt Dynamic LLM Decomposition
        llm_spec = await cls._call_llm_for_decomposition(intention, context_notes)
        if llm_spec:
            domain = llm_spec.get("domain", "Adaptive Intent Pathway")
            phases_spec = llm_spec.get("phases", [])
        else:
            # 2. Heuristic Semantic Engine Fallback
            if any(k in text for k in ["api", "version", "endpoint", "rest", "graphql", "grpc", "microservice", "backend", "database", "system design", "architecture"]):
                domain = "API & Software Architecture"
                phases_spec = [
                    {
                        "title": "Phase 1 · Versioning Strategies & Contract Design",
                        "description": "Evaluate URI, Header, and Query versioning and establish backward compatibility rules",
                        "tasks": [
                            {
                                "title": "Select Core Versioning Strategy",
                                "description": "Choose between URI path (/v1/), Custom Headers, or Accept Content Negotiation",
                                "interactions": [
                                    {
                                        "type": InteractionType.CHOICE,
                                        "title": "Preferred Versioning Scheme",
                                        "prompt_message": f"Which API versioning paradigm best fits your project for '{intention}'?",
                                        "why_relevant": "Determines routing complexity, caching behavior, and client ergonomics",
                                        "what_unlocks": "Concrete contract definitions and routing architecture",
                                        "options": [
                                            "URI Path Versioning (e.g. /api/v1/resource - Most explicit & cache-friendly)",
                                            "Header-Based Versioning (e.g. X-API-Version: 2 or Accept header - Clean URLs)",
                                            "Query Parameter Versioning (e.g. ?version=2 - Simple for webhooks & quick overrides)"
                                        ]
                                    }
                                ]
                            },
                            {
                                "title": "Define Breaking vs Non-Breaking Changes",
                                "description": "Establish SemVer rules and schema evolution boundaries",
                                "interactions": [
                                    {
                                        "type": InteractionType.QUESTION,
                                        "title": "Compatibility Policy Check",
                                        "prompt_message": "How strictly must you support legacy client schemas and payload fields?",
                                        "why_relevant": "Helps design graceful additive changes vs full version bumps",
                                        "what_unlocks": "Deprecation timelines and schema validation tests",
                                        "options": [
                                            "Strict backward compatibility (Additive fields only, no breaking renames)",
                                            "Parallel version support (Maintain v1 and v2 simultaneously with deprecation period)",
                                            "Rapid evolution (Internal microservices with coordinated client deployments)"
                                        ]
                                    }
                                ]
                            }
                        ]
                    },
                    {
                        "title": "Phase 2 · Deprecation Lifecycles & Sunset Headers",
                        "description": "Implement RFC Deprecation and Sunset headers with telemetry tracking",
                        "tasks": [
                            {
                                "title": "Design Deprecation & Warning Flow",
                                "description": "Configure HTTP Sunset headers and client migration notices",
                                "interactions": [
                                    {
                                        "type": InteractionType.REFLECTION,
                                        "title": "Migration Strategy Formulation",
                                        "prompt_message": "What is your target sunset timeline and client notification policy for obsolete versions?",
                                        "why_relevant": "Prevents breaking live client integrations without notice",
                                        "what_unlocks": "Routing layer & Gateway rewrite configuration"
                                    }
                                ]
                            }
                        ]
                    },
                    {
                        "title": "Phase 3 · Gateway Routing & Schema Evolution",
                        "description": "Deploy routing controllers and automated contract regression tests",
                        "tasks": [
                            {
                                "title": "Contract Testing & Verification",
                                "description": "Run OpenAPI schema diffing to guarantee zero unexpected breaking changes",
                                "interactions": [
                                    {
                                        "type": InteractionType.VALIDATION,
                                        "title": "Versioning Readiness Checkpoint",
                                        "prompt_message": "Confirm that multi-version controllers and OpenAPI documentation pass all integration checks.",
                                        "why_relevant": "Guarantees rock-solid production API stability",
                                        "what_unlocks": "API versioning mastery milestone complete"
                                    }
                                ]
                            }
                        ]
                    }
                ]
            elif any(k in text for k in ["quantum", "physics", "wave mechanics", "schrodinger", "superposition", "subatomic"]):
                domain = "Quantum Physics & Mechanics"
                phases_spec = [
                    {
                        "title": "Phase 1 · Prerequisites & Classical Foundations",
                        "description": "Establish baseline understanding of fundamental concepts",
                        "tasks": [
                            {
                                "title": "Assess Baseline Familiarity",
                                "description": "Identify prior knowledge and target depth",
                                "interactions": [
                                    {
                                        "type": InteractionType.CHOICE,
                                        "title": "Current Familiarity Level",
                                        "prompt_message": f"What is your current background regarding {intention}?",
                                        "why_relevant": "Determines the appropriate mathematical & conceptual scaffolding",
                                        "what_unlocks": "A customized learning pathway tailored to your experience",
                                        "options": ["Complete Beginner (Intuitive & visual analogies)", "Intermediate (Understand core principles, need formal depth)", "Advanced (Math-heavy first-principles analysis)"]
                                    }
                                ]
                            }
                        ]
                    },
                    {
                        "title": "Phase 2 · Core Phenomenological Pillars",
                        "description": "Understand core non-classical principles (Superposition & Measurement)",
                        "tasks": [
                            {
                                "title": "Explore Superposition & Wave-Particle Duality",
                                "description": "Grasp the double-slit experiment and probability amplitudes",
                                "interactions": [
                                    {
                                        "type": InteractionType.REFLECTION,
                                        "title": "Explain Back Exercise",
                                        "prompt_message": "In your own words, how does wave-particle duality challenge classical mechanics?",
                                        "why_relevant": "Active recall solidifies conceptual mental models",
                                        "what_unlocks": "Mathematical formalism and Schrödinger's equation"
                                    }
                                ]
                            }
                        ]
                    },
                    {
                        "title": "Phase 3 · Mathematical Formulation & Consolidation",
                        "description": "Synthesize wave functions, state vectors, and operators",
                        "tasks": [
                            {
                                "title": "Formulate State Vectors & Operators",
                                "description": "Understand bra-ket notation and observable measurements",
                                "interactions": [
                                    {
                                        "type": InteractionType.VALIDATION,
                                        "title": "Consolidation Checkpoint",
                                        "prompt_message": "Verify your understanding of quantum measurement and collapse postulates.",
                                        "why_relevant": "Ensures no misconceptions before advancing to advanced topics",
                                        "what_unlocks": "Completed mastery milestone"
                                    }
                                ]
                            }
                        ]
                    }
                ]
            elif any(k in text for k in ["learn", "study", "concept", "history", "biology", "chemistry", "psychology", "philosophy"]):
                clean_topic = intention.replace("I want to learn", "").replace("learn", "").replace("study", "").strip() or intention
                domain = f"Conceptual Learning · {clean_topic.title()}"
                phases_spec = [
                    {
                        "title": f"Phase 1 · Baseline & Core Principles of {clean_topic.title()}",
                        "description": f"Deconstruct foundational mental models and key terminology for {clean_topic}",
                        "tasks": [
                            {
                                "title": "Calibrate Prior Knowledge",
                                "description": "Identify current experience level and target outcome",
                                "interactions": [
                                    {
                                        "type": InteractionType.CHOICE,
                                        "title": "Target Learning Depth",
                                        "prompt_message": f"What is your starting point with {clean_topic}?",
                                        "why_relevant": "Calibrates the pacing and cognitive load of each step",
                                        "what_unlocks": "Targeted conceptual explanations and practical examples",
                                        "options": [
                                            "Complete Beginner (High-level intuitive analogies & practical overviews)",
                                            "Intermediate (Familiar with basics, need deep architectural/mechanistic nuance)",
                                            "Advanced (First-principles analysis, trade-offs, and edge cases)"
                                        ]
                                    }
                                ]
                            }
                        ]
                    },
                    {
                        "title": f"Phase 2 · Hands-On Exploration & Active Recall",
                        "description": "Apply principles to solve concrete problems and solidify retention",
                        "tasks": [
                            {
                                "title": "Active Synthesis Exercise",
                                "description": "Explain core mechanisms and trade-offs in your own words",
                                "interactions": [
                                    {
                                        "type": InteractionType.REFLECTION,
                                        "title": "Feynman Technique Synthesis",
                                        "prompt_message": f"In simple terms, how would you explain the most important principle of {clean_topic} to a peer?",
                                        "why_relevant": "Active explanation highlights gaps in mental models",
                                        "what_unlocks": "Advanced mastery & real-world scenario challenges"
                                    }
                                ]
                            }
                        ]
                    },
                    {
                        "title": f"Phase 3 · Mastery & Practical Application",
                        "description": "Synthesize knowledge into a lasting reference framework",
                        "tasks": [
                            {
                                "title": "Mastery Verification Checkpoint",
                                "description": "Validate complete grasp of key concepts",
                                "interactions": [
                                    {
                                        "type": InteractionType.VALIDATION,
                                        "title": "Topic Mastery Milestone",
                                        "prompt_message": f"Confirm you feel confident applying {clean_topic} concepts independently.",
                                        "why_relevant": "Guarantees self-sufficiency and retention",
                                        "what_unlocks": "Milestone achievement unlocked"
                                    }
                                ]
                            }
                        ]
                    }
                ]
            elif any(k in text for k in ["harmful", "believe", "think", "social media", "capitalism", "inequality", "claim", "investigate"]):
                domain = "Belief & Inquiry Investigation"
                phases_spec = [
                    {
                        "title": "Phase 1 · Clarify the Claim & Define Terms",
                        "description": "Unpack the core premise and define ambiguous language",
                        "tasks": [
                            {
                                "title": "Define Ambiguous Terms",
                                "description": "Establish what 'harm' or the core metric explicitly means",
                                "interactions": [
                                    {
                                        "type": InteractionType.FREEFORM,
                                        "title": "Clarify the Core Metric",
                                        "prompt_message": f"How do you specifically define the key terms in your claim: '{intention}'?",
                                        "why_relevant": "Prevents moving goalposts and establishes clear boundary conditions",
                                        "what_unlocks": "A precise, testable inquiry framework"
                                    }
                                ]
                            }
                        ]
                    },
                    {
                        "title": "Phase 2 · Examine Assumptions & Evidence",
                        "description": "Evaluate supporting and contradictory empirical data",
                        "tasks": [
                            {
                                "title": "Separate Correlation from Causation",
                                "description": "Examine confounding variables and counterexamples",
                                "interactions": [
                                    {
                                        "type": InteractionType.CHOICE,
                                        "title": "Identify Primary Confounding Factors",
                                        "prompt_message": "Which potential confounding factors should we examine first?",
                                        "why_relevant": "Critical thinking requires testing alternate hypotheses",
                                        "what_unlocks": "A balanced, evidence-backed perspective",
                                        "options": ["User age demographics & usage patterns", "Pre-existing mental health / economic baselines", "Algorithmic design vs. passive consumption"]
                                    }
                                ]
                            }
                        ]
                    },
                    {
                        "title": "Phase 3 · Update Belief & Form Nuanced Conclusion",
                        "description": "Synthesize findings into an evidence-based thesis",
                        "tasks": [
                            {
                                "title": "Formulate Calibrated Perspective",
                                "description": "State an updated, defensible conclusion",
                                "interactions": [
                                    {
                                        "type": InteractionType.REFLECTION,
                                        "title": "Reflect on Revised Position",
                                        "prompt_message": "How has your perspective evolved after examining the edge cases?",
                                        "why_relevant": "Consolidates rigorous cognitive inquiry into clear conviction",
                                        "what_unlocks": "Inquiry synthesis complete"
                                    }
                                ]
                            }
                        ]
                    }
                ]
            elif any(k in text for k in ["linkedin", "post", "article", "write", "content", "essay", "newsletter"]):
                domain = "Content & Narrative Creation"
                phases_spec = [
                    {
                        "title": "Phase 1 · Core Story & Target Audience",
                        "description": "Identify the key lesson, emotional hook, and reader takeaway",
                        "tasks": [
                            {
                                "title": "Define Audience & Core Angle",
                                "description": "Determine who this post is for and what action/insight they should take away",
                                "interactions": [
                                    {
                                        "type": InteractionType.CHOICE,
                                        "title": "Target Audience Focus",
                                        "prompt_message": "Who is this post primarily for?",
                                        "why_relevant": "Your audience determines the tone, depth, and opening hook",
                                        "what_unlocks": "Drafting the opening hook and story structure",
                                        "options": ["Engineers & Technical Founders", "Product Leaders & Designers", "General Professional Network", "Students & Early Career Builders"]
                                    }
                                ]
                            }
                        ]
                    },
                    {
                        "title": "Phase 2 · Draft the Opening Hook & Narrative Body",
                        "description": "Compose strong scroll-stopping opener and actionable takeaway",
                        "tasks": [
                            {
                                "title": "Draft the Hook & Narrative",
                                "description": "Write the first 3 lines and key story body",
                                "interactions": [
                                    {
                                        "type": InteractionType.FREEFORM,
                                        "title": "Draft Story & Key Insight",
                                        "prompt_message": "Draft your opening sentence and the core lesson learned.",
                                        "why_relevant": "Concrete narrative beats make posts memorable",
                                        "what_unlocks": "Tone review & polish"
                                    }
                                ]
                            }
                        ]
                    },
                    {
                        "title": "Phase 3 · Review Tone & Final Polish",
                        "description": "Ensure conciseness, remove fluff, and optimize readability",
                        "tasks": [
                            {
                                "title": "Review & Refine Draft",
                                "description": "Check formatting, line breaks, and clear call-to-action",
                                "interactions": [
                                    {
                                        "type": InteractionType.REVIEW,
                                        "title": "Final Review & Publication Readiness",
                                        "prompt_message": "Review the finalized post. Does the tone match your personal voice?",
                                        "why_relevant": "Guarantees authentic personal resonance before publishing",
                                        "what_unlocks": "Ready to publish"
                                    }
                                ]
                            }
                        ]
                    }
                ]
            elif any(k in text for k in ["gallery", "exhibition", "curate", "curatorial", "artwork", "painting", "sculpture"]):
                domain = "Creative & Curatorial Project"
                phases_spec = [
                    {
                        "title": "Phase 1 · Curatorial Concept & Theme",
                        "description": "Define the emotional and intellectual thesis of the gallery",
                        "tasks": [
                            {
                                "title": "Define Core Curatorial Thesis",
                                "description": "Establish the narrative thread connecting the works",
                                "interactions": [
                                    {
                                        "type": InteractionType.CHOICE,
                                        "title": "Select Curatorial Medium",
                                        "prompt_message": "What is the primary medium and format for this exhibition?",
                                        "why_relevant": "Shapes collection scope, layout requirements, and visitor flow",
                                        "what_unlocks": "Collection selection guidelines",
                                        "options": ["Physical gallery space", "Immersive virtual / 3D web experience", "Hybrid physical + digital catalog"]
                                    }
                                ]
                            }
                        ]
                    },
                    {
                        "title": "Phase 2 · Collection Development & Selection",
                        "description": "Curate artists, select pieces, and draft artwork descriptions",
                        "tasks": [
                            {
                                "title": "Select Artists & Featured Works",
                                "description": "Finalize list of works that illustrate the theme",
                                "interactions": [
                                    {
                                        "type": InteractionType.ACTION,
                                        "title": "Finalize Works Checklist",
                                        "prompt_message": "Compile 5-10 works that exemplify your exhibition theme.",
                                        "why_relevant": "Concrete assets anchor the experience design",
                                        "what_unlocks": "Experience & spatial flow design"
                                    }
                                ]
                            }
                        ]
                    },
                    {
                        "title": "Phase 3 · Experience Design & Exhibition Launch",
                        "description": "Design visual layout, visitor narrative, and promotional launch",
                        "tasks": [
                            {
                                "title": "Review Layout & Final Launch",
                                "description": "Final walkthrough of the gallery experience",
                                "interactions": [
                                    {
                                        "type": InteractionType.APPROVAL,
                                        "title": "Approve Launch Readiness",
                                        "prompt_message": "Is the exhibition layout and narrative ready for visitor launch?",
                                        "why_relevant": "Final verification of curatorial quality",
                                        "what_unlocks": "Official gallery opening"
                                    }
                                ]
                            }
                        ]
                    }
                ]
            else:
                domain = "Adaptive Intent Pathway"
                phases_spec = [
                    {
                        "title": "Phase 1 · Scope Definition & Objectives",
                        "description": "Clarify core targets, key constraints, and desired output",
                        "tasks": [
                            {
                                "title": "Clarify Core Focus",
                                "description": "Identify primary goals and immediate constraints",
                                "interactions": [
                                    {
                                        "type": InteractionType.CHOICE,
                                        "title": "Primary Goal Calibration",
                                        "prompt_message": f"How would you like to approach '{intention}'?",
                                        "why_relevant": "Calibrates the pacing and cognitive load of each step",
                                        "what_unlocks": "Actionable step-by-step roadmap",
                                        "options": [
                                            "Fast-track pragmatic execution (Direct steps & quick milestones)",
                                            "Deep first-principles understanding (Explore nuances and trade-offs)",
                                            "Structured exploratory overview (High-level foundation before deep dive)"
                                        ]
                                    }
                                ]
                            }
                        ]
                    },
                    {
                        "title": "Phase 2 · Implementation & Key Milestones",
                        "description": "Execute the primary steps with hands-on validation",
                        "tasks": [
                            {
                                "title": "Execute Primary Milestone",
                                "description": "Draft or build the essential core component",
                                "interactions": [
                                    {
                                        "type": InteractionType.ACTION,
                                        "title": "Core Action Execution",
                                        "prompt_message": "Complete the initial milestone and reflect on the key takeaway.",
                                        "why_relevant": "Maintains steady momentum through doable actions",
                                        "what_unlocks": "Final review and consolidation"
                                    }
                                ]
                            }
                        ]
                    },
                    {
                        "title": "Phase 3 · Review & Final Consolidation",
                        "description": "Review outcomes, consolidate lessons, and finalize",
                        "tasks": [
                            {
                                "title": "Outcome Verification",
                                "description": "Verify satisfaction with results and wrap up",
                                "interactions": [
                                    {
                                        "type": InteractionType.VALIDATION,
                                        "title": "Milestone Completion Review",
                                        "prompt_message": "Confirm that your goal criteria have been met.",
                                        "why_relevant": "Guarantees complete accomplishment",
                                        "what_unlocks": "Project milestone completed"
                                    }
                                ]
                            }
                        ]
                    }
                ]

        # 3. Build Hierarchy: Goal -> Phase -> Task -> List[Interaction]
        phases = []
        global_task_seq = 1
        for p_idx, p_data in enumerate(phases_spec, start=1):
            phase_id = f"ph_{p_idx}"
            tasks = []
            for t_idx, t_data in enumerate(p_data.get("tasks", []), start=1):
                task_id = f"task_{global_task_seq}"
                interactions = []
                for i_idx, i_data in enumerate(t_data.get("interactions", []), start=1):
                    interaction_id = f"int_{global_task_seq}_{i_idx}"
                    i_type_raw = str(i_data.get("type", "choice")).lower()
                    try:
                        i_type = InteractionType(i_type_raw)
                    except ValueError:
                        i_type = InteractionType.CHOICE

                    interactions.append(
                        WorkflowInteraction(
                            interaction_id=interaction_id,
                            sequence=i_idx,
                            type=i_type,
                            title=i_data.get("title", f"Step {i_idx}"),
                            prompt_message=i_data.get("prompt_message", "Please provide your input:"),
                            why_relevant=i_data.get("why_relevant", "Crucial for guiding the next step"),
                            what_unlocks=i_data.get("what_unlocks", "Unlocks subsequent progression"),
                            options=i_data.get("options"),
                            status=InteractionStatus.PENDING,
                            created_at=datetime.now(timezone.utc).isoformat()
                        )
                    )
                tasks.append(
                    WorkflowTask(
                        task_id=task_id,
                        plan_version=1,
                        sequence=global_task_seq,
                        title=t_data.get("title", f"Task {t_idx}"),
                        description=t_data.get("description", ""),
                        status=TaskStatus.PENDING,
                        interactions=interactions,
                        active_interaction_id=interactions[0].interaction_id if interactions else None
                    )
                )
                global_task_seq += 1
            phases.append(
                WorkflowPhase(
                    phase_id=phase_id,
                    sequence=p_idx,
                    title=p_data.get("title", f"Phase {p_idx}"),
                    description=p_data.get("description", ""),
                    tasks=tasks
                )
            )

        # Set first task and first interaction active
        if phases and phases[0].tasks:
            first_task = phases[0].tasks[0]
            first_task.status = TaskStatus.WAITING_FOR_INPUT
            if first_task.interactions:
                first_task.interactions[0].status = InteractionStatus.ACTIVE
                active_int = first_task.interactions[0]
            else:
                active_int = None
            active_task_id = first_task.task_id
            active_phase_id = phases[0].phase_id
        else:
            active_int = None
            active_task_id = None
            active_phase_id = None

        return {
            "domain": domain,
            "active_phase_id": active_phase_id,
            "active_task_id": active_task_id,
            "active_interaction": active_int,
            "phases": phases
        }

    @classmethod
    async def propose_adaptation(
        cls,
        current_state: WorkflowStateResponse,
        change_direction_statement: str,
        user_rationale: str
    ) -> List[WorkflowPhase]:
        """Evolves the future path while keeping completed tasks permanently immutable."""
        new_plan_version = current_state.plan_version + 1
        updated_phases = []
        completed_summary = []

        for phase in current_state.phases:
            updated_tasks = []
            for task in phase.tasks:
                if task.status == TaskStatus.COMPLETED:
                    updated_tasks.append(task)
                    completed_summary.append(f"{task.title} ('{task.user_response_summary or 'Done'}')")
                else:
                    superseded_task = task.model_copy(deep=True)
                    superseded_task.status = TaskStatus.SUPERSEDED
                    for inter in superseded_task.interactions:
                        if inter.status != InteractionStatus.COMPLETED:
                            inter.status = InteractionStatus.SUPERSEDED
                    updated_tasks.append(superseded_task)
            updated_phases.append(
                WorkflowPhase(
                    phase_id=phase.phase_id,
                    sequence=phase.sequence,
                    title=phase.title,
                    description=phase.description,
                    tasks=updated_tasks
                )
            )

        # Try dynamic LLM adaptation
        adapted_llm_spec = await cls._call_llm_for_adaptation(
            completed_summary=completed_summary,
            change_statement=change_direction_statement,
            rationale=user_rationale
        )

        adapted_phase_id = f"ph_adapted_v{new_plan_version}"
        adapted_task_id = f"task_adapted_v{new_plan_version}"
        adapted_int_id = f"int_adapted_v{new_plan_version}"

        if adapted_llm_spec and isinstance(adapted_llm_spec, list) and len(adapted_llm_spec) > 0:
            for idx, p_spec in enumerate(adapted_llm_spec, start=1):
                phase_id_adapted = f"ph_adapted_v{new_plan_version}_{idx}"
                dyn_tasks = []
                for t_idx, t_spec in enumerate(p_spec.get("tasks", []), start=1):
                    dyn_task_id = f"task_adapted_v{new_plan_version}_{idx}_{t_idx}"
                    dyn_interactions = []
                    for i_idx, i_spec in enumerate(t_spec.get("interactions", []), start=1):
                        dyn_int_id = f"int_adapted_v{new_plan_version}_{idx}_{t_idx}_{i_idx}"
                        dyn_interactions.append(
                            WorkflowInteraction(
                                interaction_id=dyn_int_id,
                                sequence=i_idx,
                                type=InteractionType.CHOICE if not i_spec.get("type") else InteractionType(str(i_spec.get("type")).lower()),
                                title=i_spec.get("title", "Adapted Direction Step"),
                                prompt_message=i_spec.get("prompt_message", f"Proceeding with {change_direction_statement}"),
                                why_relevant=i_spec.get("why_relevant", "Aligns with your updated direction"),
                                what_unlocks=i_spec.get("what_unlocks", "The next step in your adapted pathway"),
                                options=i_spec.get("options", ["Confirm & Continue", "Refine Direction Further"]),
                                status=InteractionStatus.ACTIVE if (idx == 1 and t_idx == 1 and i_idx == 1) else InteractionStatus.PENDING,
                                created_at=datetime.now(timezone.utc).isoformat()
                            )
                        )
                    dyn_tasks.append(
                        WorkflowTask(
                            task_id=dyn_task_id,
                            plan_version=new_plan_version,
                            sequence=len(updated_phases) + idx,
                            title=t_spec.get("title", f"Adapted Task: {change_direction_statement[:40]}"),
                            description=t_spec.get("description", user_rationale),
                            status=TaskStatus.WAITING_FOR_INPUT if (idx == 1 and t_idx == 1) else TaskStatus.PENDING,
                            interactions=dyn_interactions,
                            active_interaction_id=dyn_interactions[0].interaction_id if dyn_interactions else None
                        )
                    )
                updated_phases.append(
                    WorkflowPhase(
                        phase_id=phase_id_adapted,
                        sequence=len(updated_phases) + 1,
                        title=f"{p_spec.get('title', 'Adapted Phase')} (v{new_plan_version})",
                        description=p_spec.get("description", "Adapted pathway preserving completed work"),
                        tasks=dyn_tasks
                    )
                )
        else:
            # Heuristic adaptation fallback
            adapted_interaction = WorkflowInteraction(
                interaction_id=adapted_int_id,
                sequence=1,
                type=InteractionType.CHOICE,
                title="Confirm Adapted Direction",
                prompt_message=f"We adapted your forward path to focus on: '{change_direction_statement}'. Rationale: '{user_rationale}'. How would you like to proceed?",
                why_relevant="Ensures our next steps reflect your updated intent without losing past progress",
                what_unlocks="The next focused step in your adapted workflow",
                options=["Proceed with this adapted direction", "Adjust focus further"],
                status=InteractionStatus.ACTIVE,
                created_at=datetime.now(timezone.utc).isoformat()
            )

            adapted_task = WorkflowTask(
                task_id=adapted_task_id,
                plan_version=new_plan_version,
                sequence=len(updated_phases) + 1,
                title=f"Adapted Step: {change_direction_statement[:50]}",
                description=f"User-steered evolution: {user_rationale}",
                status=TaskStatus.WAITING_FOR_INPUT,
                interactions=[adapted_interaction],
                active_interaction_id=adapted_int_id
            )

            updated_phases.append(
                WorkflowPhase(
                    phase_id=adapted_phase_id,
                    sequence=len(updated_phases) + 1,
                    title=f"Adapted Phase (v{new_plan_version}) · {change_direction_statement[:40]}",
                    description="Evolved pathway based on user feedback",
                    tasks=[adapted_task]
                )
            )

        return updated_phases


class WorkflowStateMachine:
    """Deterministic, Concurrency-Safe Workflow Engine with Request Hashing & Optimistic Locking."""

    _idempotency_store: Dict[str, Dict[str, Any]] = {}

    @classmethod
    async def start_workflow(cls, project: Any, req: WorkflowStartRequest, current_user: Any = None) -> WorkflowStateResponse:
        """Initializes the Goal -> Phase -> Task -> Interaction state machine for a project."""
        # 1. Authorize
        if project.user_id and current_user and project.user_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Unauthorized access to project")

        # 2. Check if project already has initialized workflow (Start Idempotency)
        if project.blueprint_data:
            try:
                data = json.loads(project.blueprint_data)
                if data.get("workflow_version") and data.get("phases"):
                    return WorkflowStateResponse.model_validate(data)
            except Exception:
                pass

        # 3. Decompose Intention into Goal -> Phase -> Task -> Interaction
        decomposition = await AIProposalEngine.propose_intent_decomposition(
            intention=req.intention,
            context_notes=req.context_notes,
            domain_hint=req.domain_hint
        )

        state = WorkflowStateResponse(
            project_id=project.id,
            intention=req.intention,
            domain=decomposition["domain"],
            workflow_version=1,
            plan_version=1,
            status="in_progress",
            active_phase_id=decomposition["active_phase_id"],
            active_task_id=decomposition["active_task_id"],
            active_interaction=decomposition["active_interaction"],
            phases=decomposition["phases"],
            total_tasks_completed=0,
            total_tasks_remaining=sum(len(p.tasks) for p in decomposition["phases"])
        )

        project.blueprint_data = json.dumps(state.model_dump())
        project.domain = state.domain
        project.title = f"{state.domain}: {req.intention[:50]}"
        project.description = req.intention

        return state

    @classmethod
    async def get_workflow_state(cls, project: Any, current_user: Any = None) -> WorkflowStateResponse:
        """Retrieves authoritative workflow state."""
        if project.user_id and current_user and project.user_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Unauthorized access to project")

        if not project.blueprint_data:
            # Fallback initialization if empty
            req = WorkflowStartRequest(intention=project.title or "General Project")
            return await cls.start_workflow(project, req, current_user)

        data = json.loads(project.blueprint_data)
        return WorkflowStateResponse.model_validate(data)

    @classmethod
    async def resolve_interaction(
        cls,
        project: Any,
        req: WorkflowResumeRequest,
        current_user: Any = None
    ) -> WorkflowMutationResponse:
        """Resolves active interaction, validates typed payload, checks optimistic locks, and advances state."""
        # 1. Authorize
        if project.user_id and current_user and project.user_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Unauthorized access to project")

        current_state = await cls.get_workflow_state(project, current_user)

        # 2. Canonical Idempotency Check with Complete Mutation Identity Hashing
        mutation_hash = compute_mutation_hash(
            project_id=project.id,
            checkpoint_id=req.checkpoint_id,
            expected_version=req.expected_version,
            operation_type="resolve_interaction",
            resume_data=req.resume_data
        )

        idempotency_token = req.idempotency_key or mutation_hash
        if idempotency_token in cls._idempotency_store:
            cached_entry = cls._idempotency_store[idempotency_token]
            if cached_entry["mutation_hash"] == mutation_hash:
                return WorkflowMutationResponse.model_validate(cached_entry["response"])
            else:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail="Idempotency key reused with differing payload"
                )

        # 3. Two-Phase Optimistic Concurrency Check (Pre-check)
        if current_state.workflow_version != req.expected_version:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Workflow version conflict. Expected {req.expected_version}, server has {current_state.workflow_version}. Please refresh."
            )

        # 4. Verify Active Interaction Identity & Status
        active_inter = current_state.active_interaction
        if not active_inter or (active_inter.interaction_id != req.checkpoint_id and current_state.active_task_id != req.checkpoint_id):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Target checkpoint '{req.checkpoint_id}' is not the currently active step awaiting input."
            )

        # 5. Validate Typed Resume Payload
        cls._validate_typed_resume(active_inter.type, req.resume_data)

        # 6. Apply State Machine Transition (Atomic DB Transaction simulation)
        version_before = current_state.workflow_version
        version_after = version_before + 1

        # Locate active phase and task
        now_ts = datetime.now(timezone.utc).isoformat()
        response_summary = cls._summarize_user_response(active_inter.type, req.resume_data)

        active_inter.status = InteractionStatus.COMPLETED
        active_inter.completed_at = now_ts
        active_inter.user_response_summary = response_summary

        # Advance to next interaction in task OR next task
        next_interaction = None
        next_task_id = None
        next_phase_id = None
        found_current_task = False
        task_just_completed = False

        for phase in current_state.phases:
            for task in phase.tasks:
                if task.task_id == current_state.active_task_id:
                    found_current_task = True
                    # Check if task has more interactions
                    remaining_interactions = [i for i in task.interactions if i.status == InteractionStatus.PENDING]
                    if remaining_interactions:
                        next_interaction = remaining_interactions[0]
                        next_interaction.status = InteractionStatus.ACTIVE
                        task.active_interaction_id = next_interaction.interaction_id
                        task.status = TaskStatus.WAITING_FOR_INPUT
                        next_task_id = task.task_id
                        next_phase_id = phase.phase_id
                    else:
                        task.status = TaskStatus.COMPLETED
                        task.completed_at = now_ts
                        task.user_response_summary = response_summary
                        task_just_completed = True
                    break
            if found_current_task:
                break

        # If task completed, find next pending task in current or subsequent phases
        if task_just_completed:
            found_next_task = False
            for phase in current_state.phases:
                for task in phase.tasks:
                    if task.status == TaskStatus.PENDING:
                        task.status = TaskStatus.WAITING_FOR_INPUT
                        if task.interactions:
                            next_interaction = task.interactions[0]
                            next_interaction.status = InteractionStatus.ACTIVE
                            task.active_interaction_id = next_interaction.interaction_id
                        next_task_id = task.task_id
                        next_phase_id = phase.phase_id
                        found_next_task = True
                        break
                if found_next_task:
                    break

            if not found_next_task:
                current_state.status = "completed"

        # Update State Snapshot
        current_state.workflow_version = version_after
        current_state.active_task_id = next_task_id
        current_state.active_phase_id = next_phase_id
        current_state.active_interaction = next_interaction
        current_state.total_tasks_completed = sum(1 for p in current_state.phases for t in p.tasks if t.status == TaskStatus.COMPLETED)
        current_state.total_tasks_remaining = sum(1 for p in current_state.phases for t in p.tasks if t.status != TaskStatus.COMPLETED)

        # 7. Commit & Persist
        project.blueprint_data = json.dumps(current_state.model_dump())

        transition = WorkflowTransition(
            transition_id=f"tr_{uuid.uuid4().hex[:8]}",
            operation_type="interaction_resolved",
            workflow_version_before=version_before,
            workflow_version_after=version_after,
            timestamp=now_ts
        )

        response = WorkflowMutationResponse(transition=transition, workflow=current_state)

        # 8. Store in Idempotency Cache
        cls._idempotency_store[idempotency_token] = {
            "mutation_hash": mutation_hash,
            "response": response.model_dump()
        }

        return response

    @classmethod
    async def evolve_workflow(
        cls,
        project: Any,
        req: WorkflowEvolveRequest,
        current_user: Any = None
    ) -> WorkflowMutationResponse:
        """Adapts workflow direction while preserving all completed task history as permanent immutable facts."""
        if project.user_id and current_user and project.user_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Unauthorized access to project")

        current_state = await cls.get_workflow_state(project, current_user)

        # Optimistic Concurrency Check
        if current_state.workflow_version != req.expected_version:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Workflow version conflict during evolution. Expected {req.expected_version}, server has {current_state.workflow_version}."
            )

        now_ts = datetime.now(timezone.utc).isoformat()
        version_before = current_state.workflow_version
        version_after = version_before + 1

        # Propose Adapted remaining path
        adapted_phases = await AIProposalEngine.propose_adaptation(
            current_state=current_state,
            change_direction_statement=req.change_direction_statement,
            user_rationale=req.user_rationale
        )

        # Identify newly active task and interaction
        active_phase_id = adapted_phases[-1].phase_id
        active_task = adapted_phases[-1].tasks[0]
        active_task_id = active_task.task_id
        active_interaction = active_task.interactions[0] if active_task.interactions else None

        current_state.workflow_version = version_after
        current_state.plan_version += 1
        current_state.phases = adapted_phases
        current_state.active_phase_id = active_phase_id
        current_state.active_task_id = active_task_id
        current_state.active_interaction = active_interaction
        current_state.total_tasks_completed = sum(1 for p in current_state.phases for t in p.tasks if t.status == TaskStatus.COMPLETED)
        current_state.total_tasks_remaining = sum(1 for p in current_state.phases for t in p.tasks if t.status != TaskStatus.COMPLETED)

        project.blueprint_data = json.dumps(current_state.model_dump())

        transition = WorkflowTransition(
            transition_id=f"tr_{uuid.uuid4().hex[:8]}",
            operation_type="workflow_evolved",
            workflow_version_before=version_before,
            workflow_version_after=version_after,
            timestamp=now_ts
        )

        return WorkflowMutationResponse(transition=transition, workflow=current_state)

    @classmethod
    def _validate_typed_resume(cls, interaction_type: InteractionType, data: Dict[str, Any]):
        """Dispatches typed schema validation per interaction type."""
        try:
            if interaction_type == InteractionType.QUESTION:
                QuestionResumeData.model_validate(data)
            elif interaction_type == InteractionType.CHOICE:
                ChoiceResumeData.model_validate(data)
            elif interaction_type == InteractionType.REVIEW:
                ReviewResumeData.model_validate(data)
            elif interaction_type == InteractionType.APPROVAL:
                ApprovalResumeData.model_validate(data)
            elif interaction_type == InteractionType.ACTION:
                ActionResumeData.model_validate(data)
            elif interaction_type == InteractionType.REFLECTION:
                ReflectionResumeData.model_validate(data)
            elif interaction_type == InteractionType.VALIDATION:
                ValidationResumeData.model_validate(data)
            elif interaction_type == InteractionType.FREEFORM:
                FreeformResumeData.model_validate(data)
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Invalid resume payload for interaction type '{interaction_type}': {str(e)}"
            )

    @classmethod
    def _summarize_user_response(cls, interaction_type: InteractionType, data: Dict[str, Any]) -> str:
        """Formats clean user-facing response summary for immutable history."""
        if interaction_type == InteractionType.CHOICE:
            return f"Selected: {data.get('selected_option')}"
        elif interaction_type == InteractionType.QUESTION:
            return f"Answered {len(data.get('answers', {}))} questions"
        elif interaction_type == InteractionType.REFLECTION:
            return f"Reflection: {data.get('reflection_text', '')[:60]}..."
        elif interaction_type == InteractionType.FREEFORM:
            return f"Note: {data.get('text', '')[:60]}..."
        elif interaction_type == InteractionType.APPROVAL:
            return "Approved" if data.get('approved') else "Requested Revisions"
        elif interaction_type == InteractionType.VALIDATION:
            return "Validated" if data.get('is_valid') else "Gaps Identified"
        elif interaction_type == InteractionType.ACTION:
            return data.get('action_notes') or "Completed Action"
        return "Step Resolved"
