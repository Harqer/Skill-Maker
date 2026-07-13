import React, { createContext, useContext, useState, ReactNode } from 'react';
import JSZip from 'jszip';
import { CreatedSkill } from '@/types';
import { useAuth } from '@clerk/clerk-react';

interface SkillContextType {
  url: string;
  setUrl: (url: string) => void;
  includeMcp: boolean;
  setIncludeMcp: (inc: boolean) => void;
  customInstructions: string;
  setCustomInstructions: (inst: string) => void;
  isCreating: boolean;
  createStep: number;
  errorMessage: string;
  createdSkill: CreatedSkill | null;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  handleCreate: (e: React.FormEvent) => Promise<void>;
  handleFileChange: (fileName: string, value: string) => void;
  handleDownloadZip: () => Promise<void>;
  handleRestoreTemplates: () => void;
  selectSuggestion: (targetUrl: string) => void;
}

const SkillContext = createContext<SkillContextType | undefined>(undefined);

export function SkillProvider({ children }: { children: ReactNode }) {
  const [url, setUrl] = useState("");
  const [includeMcp, setIncludeMcp] = useState(false);
  const [customInstructions, setCustomInstructions] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [createStep, setCreateStep] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
  
  const [createdSkill, setCreatedSkill] = useState<CreatedSkill | null>(null);
  const [activeTab, setActiveTab] = useState<string>("SKILL.md");
  const { getToken } = useAuth();

  const selectSuggestion = (targetUrl: string) => {
    setUrl(targetUrl);
    setErrorMessage("");
  };

  const handleRestoreTemplates = () => {
    setUrl("");
    setCustomInstructions("");
    setIncludeMcp(false);
    setCreatedSkill(null);
    setErrorMessage("");
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) {
      setErrorMessage("Please enter a documentation URL to create.");
      return;
    }

    setIsCreating(true);
    setCreateStep(1);
    setErrorMessage("");
    setCreatedSkill(null);

    const stepInterval = setInterval(() => {
      setCreateStep((prev) => {
        if (prev < 4) return prev + 1;
        return prev;
      });
    }, 2800);

    try {
      const token = await getToken();
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch("/api/generate_skill", {
        method: "POST",
        headers,
        body: JSON.stringify({ url, include_mcp: includeMcp, prompt: customInstructions }),
      });

      if (!response.ok) {
        throw new Error(`Failed to initiate generation: ${response.statusText}`);
      }
      
      const { db_id } = await response.json();
      if (!db_id) throw new Error("Invalid response from server: Missing db_id");

      let finalData = null;
      let attempts = 0;
      const maxAttempts = 600; // 300 seconds (500ms intervals)

      while (attempts < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        attempts++;

        const pollResponse = await fetch(`/api/skill_request/${db_id}`, { headers });
        if (!pollResponse.ok) {
          throw new Error("Failed to poll skill generation status");
        }

        const pollData = await pollResponse.json();
        if (pollData.status === "completed") {
          finalData = pollData.result;
          break;
        } else if (pollData.status === "failed") {
          throw new Error(pollData.error || "Skill generation failed on the server.");
        }
      }

      if (!finalData) {
        throw new Error("Skill generation timed out.");
      }

      clearInterval(stepInterval);
      setCreateStep(5);
      setCreatedSkill(finalData);
      
      if (finalData.files["SKILL.md"]) {
        setActiveTab("SKILL.md");
      } else {
        const firstFile = Object.keys(finalData.files)[0];
        setActiveTab(firstFile || "");
      }
    } catch (err: unknown) {
      clearInterval(stepInterval);
      setErrorMessage(err instanceof Error ? err.message : "An unexpected error occurred while creating the skill.");
      setIsCreating(false);
    }
  };

  const handleFileChange = (fileName: string, value: string) => {
    if (!createdSkill) return;
    setCreatedSkill({
      ...createdSkill,
      files: {
        ...createdSkill.files,
        [fileName]: value,
      },
    });
  };

  const handleDownloadZip = async () => {
    if (!createdSkill) return;
    try {
      const zip = new JSZip();
      const folder = zip.folder(createdSkill.folderName) || zip;

      Object.entries(createdSkill.files).forEach(([pathName, content]) => {
        if (content) {
          folder.file(pathName, content as string);
        }
      });

      const blob = await zip.generateAsync({ type: "blob" });
      const dlUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = dlUrl;
      link.download = `${createdSkill.folderName}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(dlUrl);
    } catch (err) {
      console.error("Error creating ZIP:", err);
      alert("Failed to download ZIP file.");
    }
  };

  const value = {
    url, setUrl, includeMcp, setIncludeMcp, customInstructions, setCustomInstructions,
    isCreating, createStep, errorMessage, createdSkill, activeTab, setActiveTab,
    handleCreate, handleFileChange, handleDownloadZip, handleRestoreTemplates, selectSuggestion
  };

  return (
    <SkillContext.Provider value={value}>
      {children}
    </SkillContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSkillCreator() {
  const context = useContext(SkillContext);
  if (context === undefined) {
    throw new Error("useSkillCreator must be used within a SkillProvider");
  }
  return context;
}
