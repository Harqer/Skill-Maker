import ast
import re

BANNED_MODULES = {
    "subprocess",
    "pty",
    "shlex",
    "socket",
    "multiprocessing",
    "threading",
    "sys"
}

BANNED_FUNCTIONS = {
    "os.system",
    "os.popen",
    "os.spawn",
    "os.exec",
    "eval",
    "exec",
    "__import__"
}

def sanitize_mcp_script(script_content: str) -> str:
    """
    Parses the Python script using AST. If dangerous modules or functions are detected,
    returns a sanitized safe stub instead of the malicious script.
    """
    if not script_content:
        return script_content
        
    try:
        tree = ast.parse(script_content)
    except SyntaxError:
        # If it doesn't parse, it's either incomplete or malformed.
        # It's safer to flag it.
        return "# [SECURITY WARNING] Generated script contained syntax errors and could not be validated.\n" + script_content

    violations = []
    
    for node in ast.walk(tree):
        if isinstance(node, ast.Import):
            for alias in node.names:
                base_module = alias.name.split('.')[0]
                if base_module in BANNED_MODULES:
                    violations.append(f"Banned import: {alias.name}")
        elif isinstance(node, ast.ImportFrom):
            if node.module:
                base_module = node.module.split('.')[0]
                if base_module in BANNED_MODULES:
                    violations.append(f"Banned import from: {node.module}")
        elif isinstance(node, ast.Call):
            if isinstance(node.func, ast.Name):
                if node.func.id in BANNED_FUNCTIONS:
                    violations.append(f"Banned function call: {node.func.id}")
            elif isinstance(node.func, ast.Attribute):
                if isinstance(node.func.value, ast.Name):
                    full_name = f"{node.func.value.id}.{node.func.attr}"
                    if full_name in BANNED_FUNCTIONS:
                        violations.append(f"Banned function call: {full_name}")

    if violations:
        warning_header = '"""\n[SECURITY WARNING] The generated MCP script contained potentially malicious code.\n'
        warning_header += "The following violations were detected:\n"
        for v in violations:
            warning_header += f"- {v}\n"
        warning_header += "For your safety, the script has been commented out.\n\"\"\"\n\n"
        
        commented_script = "\n".join(f"# {line}" for line in script_content.splitlines())
        return warning_header + commented_script

    return script_content

def sanitize_skill_content(skill_content: str) -> str:
    """
    Scans the SKILL.md markdown for malicious bash patterns.
    """
    if not skill_content:
        return skill_content
        
    dangerous_patterns = [
        r'(?i)(curl|wget).*?\|\s*(bash|sh|zsh)',
        r'(?i)rm\s+-rf\s+(/|\~|\$HOME)',
        r'(?i)>\s*/dev/sd[a-z]',
        r'(?i)mkfs\.'
    ]
    
    violations_found = False
    sanitized_content = skill_content
    
    for pattern in dangerous_patterns:
        if re.search(pattern, sanitized_content):
            violations_found = True
            sanitized_content = re.sub(pattern, "[REDACTED MALICIOUS COMMAND]", sanitized_content)
            
    if violations_found:
        warning = "> [!CAUTION]\n> **SECURITY WARNING:** The AI generated potentially malicious shell commands (e.g., piped curl to bash or dangerous rm commands). These have been redacted for your safety.\n\n"
        sanitized_content = warning + sanitized_content
        
    return sanitized_content
