export interface CreatedSkill {
  folderName: string;
  displayName: string;
  description: string;
  files: {
    "SKILL.md": string;
    "scripts/validate.js": string;
    "references/source.md": string;
    "mcp-server.json"?: string;
    [key: string]: string | undefined;
  };
}

export interface GoogleChatSpace {
  name: string;
  displayName: string;
  type: string;
}
