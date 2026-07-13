import { useState } from 'react';
import { useSkillCreator } from '@/context/SkillContext';

export interface EvaluationResult {
  score: number;
  feedback: string;
  improvements: string[];
}

export function useSkillEvaluator() {
  const { createdSkill } = useSkillCreator();
  
  const [testPrompt, setTestPrompt] = useState<string>("Develop a complete configuration setup for an integrated pipeline, validating all credentials and handling failure conditions safely.");
  const [assertions, setAssertions] = useState<string[]>([
    "Correctly authenticates with credentials",
    "Handles network timeout or bad response gracefully",
    "Uses correct parameter formatting based on target guidelines"
  ]);
  const [newAssertion, setNewAssertion] = useState<string>("");
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [evaluationResult, setEvaluationResult] = useState<EvaluationResult | null>(null);
  const [feedbackList, setFeedbackList] = useState<string[]>([]);
  const [newFeedback, setNewFeedback] = useState<string>("");
  const [evalError, setEvalError] = useState<string>("");

  const addAssertion = () => {
    if (!newAssertion.trim()) return;
    setAssertions([...assertions, newAssertion.trim()]);
    setNewAssertion("");
  };

  const removeAssertion = (index: number) => {
    setAssertions(assertions.filter((_, i) => i !== index));
  };

  const addFeedback = () => {
    if (!newFeedback.trim()) return;
    setFeedbackList([...feedbackList, newFeedback.trim()]);
    setNewFeedback("");
  };

  const handleEvaluate = async () => {
    if (!createdSkill) return;
    setIsEvaluating(true);
    setEvalError("");
    setEvaluationResult(null);

    try {
      const response = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: testPrompt,
          skillContent: createdSkill.files["SKILL.md"] || "",
          assertions: assertions,
        }),
      });

      if (!response.ok) {
        const errJson = await response.json();
        throw new Error(errJson.error || "Evaluation run failed.");
      }

      const data = await response.json();
      setEvaluationResult(data);
    } catch (err: unknown) {
      console.error("Evaluation error:", err);
      setEvalError(err instanceof Error ? err.message : "An unexpected error occurred during evaluation.");
    } finally {
      setIsEvaluating(false);
    }
  };

  return {
    testPrompt, setTestPrompt,
    assertions, newAssertion, setNewAssertion, addAssertion, removeAssertion,
    isEvaluating, evaluationResult, evalError,
    feedbackList, newFeedback, setNewFeedback, addFeedback,
    handleEvaluate
  };
}
